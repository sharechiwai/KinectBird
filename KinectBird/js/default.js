//------------------------------------------------------------------------------
// <copyright file="default.js" company="Microsoft">
//     Copyright (c) Microsoft Corporation.  All rights reserved.
// </copyright>
//------------------------------------------------------------------------------

(function (window, document, Game) {
    "use strict";

    WinJS.Binding.optimizeBindingReferences = true;

    var app = WinJS.Application;
    var activation = Windows.ApplicationModel.Activation;
    var kinect = WindowsPreview.Kinect;

    var sensor = null;
    var bodyFrameReader = null;
    var bodies = null;

    // Handles the body frame data arriving from the sensor
    function reader_BodyFrameArrived(args) {
        // get body frame
        var bodyFrame = args.frameReference.acquireFrame();
        var dataReceived = false;

        if (bodyFrame !== null) {
            // got a body, update body data
            bodyFrame.getAndRefreshBodyData(bodies);
            dataReceived = true;
            bodyFrame.close();
        }
    }

    // Handler for sensor availability changes
    function sensor_IsAvailableChanged() {
        if (sensor.isAvailable) {
            document.getElementById("statustext").innerHTML = "Running";
        }
        else {
            document.getElementById("statustext").innerHTML = "Kinect not available!";
        }
    }

    app.onactivated = function (args) {
        if (args.detail.kind === activation.ActivationKind.launch) {
            if (args.detail.previousExecutionState !== activation.ApplicationExecutionState.terminated) {
                // get the kinectSensor object
                sensor = kinect.KinectSensor.getDefault();

                // add handler for sensor availability
                sensor.addEventListener("isavailablechanged", sensor_IsAvailableChanged);

                // open the reader for frames
                bodyFrameReader = sensor.bodyFrameSource.openReader();

                // wire handler for frame arrival
                bodyFrameReader.addEventListener("framearrived", reader_BodyFrameArrived);

                // create bodies array
                bodies = new Array(sensor.bodyFrameSource.bodyCount);

                // open the sensor
                sensor.open();

                var canvas2 = document.getElementById('kinect-bird'),
                 game = new Game(canvas2, { kinect: kinect }),
                 gameTick = function () {
                     window.requestAnimationFrame(gameTick);

                     game.update(app.getBodyJoints());
                 };

                game.init(app.getBodyJoints());
                window.requestAnimationFrame(gameTick);
            } else {
                // TODO: This application has been reactivated from suspension.
                // Restore application state here.
            }
            args.setPromise(WinJS.UI.processAll());
        }
    };

    app.oncheckpoint = function () {
        // TODO: This application is about to be suspended. Save any state
        // that needs to persist across suspensions here. You might use the
        // WinJS.Application.sessionState object, which is automatically
        // saved and restored across suspension. If you need to complete an
        // asynchronous operation before your application is suspended, call
        // args.setPromise().
    };

    app.onunload = function () {
        if (sensor !== null) {
            sensor.close();
        }
    };


    WinJS.UI.Pages.define("/default.html", {
        // This function is called whenever a user navigates to this page. It
        // populates the page elements with the app's data.
        ready: function (element, options) {
            // TODO: Initialize the page here.
            var button1 = element.querySelector("#btnRun");
            button1.addEventListener("click", this.button1Click, false);
        },

        button1Click: function (mouseEvent) {
           /* var audio = document.getElementById('bgAudio');
            audio.src = 'audio/congrad.wav';
            audio.load();
            */
            var sound1 = new Audio('audio/congrad.wav');
            var sound2 = new Audio('audio/smb_mariodie.wav');
            sound1.mediaGroup = 'soundGroup';
            sound2.mediaGroup = 'soundGroup';
            sound1.play();
            sound2.play();

        }
    });

    app.getBodyJoints = function () {
        var resultArray = [];
        for (var i = 0; i < bodies.length; i++) {
            var body = bodies[i];
            if (body && body.trackingId !== 0) {
              var t = { bodyId: body.trackingId, object: body, joint: body.joints.lookup(20), active: body.isTracked };
                resultArray.push(t);
            }
        }

        return resultArray;
    };

    app.start();
})(window, document, Game);
