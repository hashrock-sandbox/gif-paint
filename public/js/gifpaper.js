"use strict";
var idx = 0;
var restorePoints = [];
var canvasColor = "#DDBABA";
var idxColor;
var idxBrush;
var mainCanvas = $("#drawCanvas");
var drawingFlag = false;
var mouseX, mouseY = "";
var elMainCanvas = mainCanvas[0];
var context = elMainCanvas.getContext("2d");
var sprites = $(".cc");


function saveRestorePoint() {
    var oCanvas = document.getElementById("drawCanvas");
    var imgSrc = oCanvas.toDataURL("image/png");
    restorePoints.push(imgSrc);
}

function undoDrawOnCanvas() {
    if (restorePoints.length > 0) {
        var oImg = new Image();
        oImg.onload = function () {
            var canvasContext = document.getElementById("drawCanvas").getContext("2d");
            canvasContext.drawImage(oImg, 0, 0);
        };
        oImg.src = restorePoints.pop();
    }
}

function clear(dest, transparent) {
    var destCtx = dest.getContext('2d');
    if (transparent) {
        destCtx.clearRect(0, 0, 600, 600);
    } else {
        destCtx.fillStyle = canvasColor;
        destCtx.fillRect(0, 0, 600, 600);

    }
}

function c2c(src, dest) {
    var destCtx = dest.getContext('2d');
    destCtx.fillStyle = canvasColor;
    destCtx.fillRect(0, 0, 600, 600);
    destCtx.drawImage(src, 0, 0);
}


function setUpPen(context, elMainCanvas) {

    context.strokeStyle = "black";
    context.lineWidth = 5;
    context.lineCap = "round";
    context.fillStyle = canvasColor;
    context.fillRect(0, 0, elMainCanvas.width, elMainCanvas.height);
}

// Initialize Firebase
var config = {
    apiKey: "AIzaSyAcf0MnlFfnRU556SvZIoCKMIK7Dr7sgHw",
    authDomain: "test-upload-e4523.firebaseapp.com",
    databaseURL: "https://test-upload-e4523.firebaseio.com",
    storageBucket: "test-upload-e4523.appspot.com",
};
firebase.initializeApp(config);
var auth = firebase.auth();
var storageRef = firebase.storage().ref();

function uploadImage(file) {
    var metadata = {
        'contentType': "image/gif"
    };
    storageRef.child('images/' + file.name).put(file, metadata).then(function (snapshot) {
        console.log('Uploaded', snapshot.totalBytes, 'bytes.');
        console.log(snapshot.metadata);
        var url = snapshot.metadata.downloadURLs[0];
        console.log('File available at', url);
        document.getElementById('linkbox').innerHTML = '<a href="' + url + '">'+url+'</a>';
    }).catch(function (error) {
        console.error('Upload failed:', error);
    });
}


auth.signInAnonymously().then(function (user) {
    console.log('Anonymous Sign In Success', user);
}).catch(function (error) {
    console.error('Anonymous Sign In Error', error);
});

function saveGif(callback) {
    var _sprites = $(".cc");
    var gif = new GIF({
        workers: 2,
        quality: 10
    });
    var count = 0;
    _sprites.each(function (index) {
        var enabled = $(this).attr("data-enabled");
        if (enabled === "true") {
            count++;
            gif.addFrame(this, {
                delay: 200
            });
        }
    });
    if (count === 0) {
        alert("NO IMAGE");
    } else {
        gif.on('finished', function (blob) {
            $("#result").attr("src", URL.createObjectURL(blob));
            if (callback) {
                callback(blob);
            }
        });

        gif.render();

    }
    gif = null;
}


$(document).ready(function () {
    setUpPen(context, elMainCanvas);

    function mouseUpdate(d, el) {
        var rect = d.target.getBoundingClientRect();
        mouseX = d.clientX - rect.left;
        mouseY = d.clientY - rect.top;
    }

    $("#bcl").change(function () {
        context.strokeStyle = this.value;
    });
    mainCanvas.on("mousedown touchstart", function (d) {
        saveRestorePoint();
        drawingFlag = true;
        context.save();
        mouseUpdate(d, this);
    });

    $(document).on("mouseup touchend", function () {
        drawingFlag = false;
    });

    $(document).on("click", function () {
        drawingFlag = false;
    });

    mainCanvas.on("mousemove touchmove", function (d) {
        if (drawingFlag) {
            context.beginPath();

            var rect = d.target.getBoundingClientRect();
            var dx = d.clientX - rect.left;
            var dy = d.clientY - rect.top;

            context.moveTo(dx, dy);
            context.lineTo(mouseX, mouseY);
            context.stroke();
            context.closePath();
            mouseUpdate(d, this);
        }
    });

    $("#undo").click(function () {
        undoDrawOnCanvas();
    });

    $("#tweet").click(function () {
        saveGif(function (blob) {
            uploadImage(blob);
        });
    });

    $("#save").click(function () {
        saveGif();
    });
    $("#clear").click(function () {
        clear(mainCanvas[0], false);
        clear(sprites[idx], true);
        $(sprites[idx]).attr("data-enabled", "false");
    });
    var later = _.debounce(function(){
        saveGif();
    }, 1000);


    mainCanvas.on("mouseup touchend", function () {
        c2c(this, sprites[idx]);
        $(sprites[idx]).attr("data-enabled", "true");
        later();

    });
    sprites.on("click", function () {
        idx = sprites.index(this);
        sprites.removeClass("selected");
        $(this).addClass("selected");
        c2c(sprites[idx], mainCanvas[0]);
        if (idx > 0) {
            c2c(sprites[idx - 1], $("#onionSkinCanvas")[0]);
        }
    });
    $(".colorpick").click(function () {
        idxColor = $(".colorpick").index(this);
        $(".colorpick").removeClass("selected");
        $(this).addClass("selected");

        context.strokeStyle = $(this).css("background-color");
    });
    $(".brushpick").click(function () {
        idxBrush = $(".brushpick").index(this);
        $(".brushpick").removeClass("selected");
        $(this).addClass("selected");
        context.lineWidth = parseInt($(this).text(), 10);
    });
});
