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
    var streams = Windows.Storage.Streams;
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

                // get depth frame description
                var depthFrameDescription = sensor.depthFrameSource.frameDescription;

                // create bodies array
                bodies = new Array(sensor.bodyFrameSource.bodyCount);

                // open the sensor
                sensor.open();

                var jointText = document.getElementById('jointInfo');
                var canvas2 = document.getElementById('kinect-bird'),
                 game = new Game(canvas2),
                 gameTick = function () {
                     window.requestAnimationFrame(gameTick);

                     game.update(app.getBodyJoints());
                     var text = 'GAME INFO => ';
                     _.forEach(game.state.players, function (player) {
                         text = text + 'Player ' + player.id + ', State: ' + player.state + ' @ ' + player.position.x + ',' + player.position.y + '    ';
                     });
                     jointText.children[0].innerText = text;
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

    app.oncheckpoint = function (args) {
        // TODO: This application is about to be suspended. Save any state
        // that needs to persist across suspensions here. You might use the
        // WinJS.Application.sessionState object, which is automatically
        // saved and restored across suspension. If you need to complete an
        // asynchronous operation before your application is suspended, call
        // args.setPromise().
    };

    app.onunload = function (args) {
        if (depthFrameReader != null) {
            depthFrameReader.close();
        }

        if (sensor != null) {
            sensor.close();
        }
    }


    WinJS.UI.Pages.define("/default.html", {
        // This function is called whenever a user navigates to this page. It
        // populates the page elements with the app's data.
        ready: function (element, options) {
            // TODO: Initialize the page here.
        }
    });

    app.getBodyJoints = function () {
        var resultArray = [];
        for (var i = 0; i < bodies.length; i++) {
            var body = bodies[i];
            if (body != null && body.trackingId !== 0) {
                var t = { bodyId: body.trackingId, joint: body.joints.lookup(20), active: body.isTracked };
                resultArray.push(t);
            }
        }

        return resultArray;
    };

    app.start();

   
})(window, document, Game);
