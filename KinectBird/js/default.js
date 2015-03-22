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

    // Body
    // C++ WinRT component
    var bodyImageProcessor = KinectImageProcessor.BodyHelper;

    // references to canvas
    var bodyCanvas = null;
    var bodyContext = null;

    // ENd Body

    var sensor = null;
    var bodyFrameReader = null;
    var bodies = null;


    // array of all bones in a body
    // bone defined by two joints
    var bones = null;

    // defines a different color for each body
    var bodyColors = null;

    // total number of joints = 25
    var jointCount = null;

    // total number of bones = 24
    var boneCount = null;

    // handstate circle size
    var HANDSIZE = 20;

    // tracked bone line thickness
    var TRACKEDBONETHICKNESS = 4;

    // inferred bone line thickness
    var INFERREDBONETHICKNESS = 1;

    // thickness of joints
    var JOINTTHICKNESS = 3;

    // thickness of clipped edges
    var CLIPBOUNDSTHICKNESS = 5;

    // closed hand state color
    var HANDCLOSEDCOLOR = "red";

    // open hand state color
    var HANDOPENCOLOR = "purple";

    // lasso hand state color
    var HANDLASSOCOLOR = "blue";

    // tracked joint color
    var TRACKEDJOINTCOLOR = "green";

    // inferred joint color
    var INFERREDJOINTCOLOR = "yellow";

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

    // Body Start


    // Draw a body
    var drawBody = function (joints, jointPoints, bodyColor) {

        var jointText = document.getElementById('jointInfo');
        // draw all bones
        for (var boneIndex = 0; boneIndex < boneCount; ++boneIndex) {

            var boneStart = bones[boneIndex].jointStart;

            var boneEnd = bones[boneIndex].jointEnd;

            if (boneEnd === 20 || boneStart === 20) continue;
            console.log(boneEnd);
            var joint0 = joints.lookup(boneStart);
            var joint1 = joints.lookup(boneEnd);

            // don't do anything if either joint is not tracked
            if ((joint0.trackingState == kinect.TrackingState.notTracked) ||
                (joint1.trackingState == kinect.TrackingState.notTracked)) {
                return;
            }

            // all bone lines are inferred thickness unless both joints are tracked
            var boneThickness = INFERREDBONETHICKNESS;
            if ((joint0.trackingState == kinect.TrackingState.tracked) &&
                (joint1.trackingState == kinect.TrackingState.tracked)) {
                boneThickness = TRACKEDBONETHICKNESS;
            }

            drawBone(jointPoints[boneStart], jointPoints[boneEnd], boneThickness, bodyColor);
        }

        // draw all joints
        var jointColor = null;
        for (var jointIndex = 0; jointIndex < jointCount; ++jointIndex) {
            var trackingState = joints.lookup(jointIndex).trackingState;

            // only draw if joint is tracked or inferred
            if (trackingState == kinect.TrackingState.tracked) {
                jointColor = TRACKEDJOINTCOLOR;
            }
            else if (trackingState == kinect.TrackingState.inferred) {
                jointColor = INFERREDJOINTCOLOR;
            }

            if (jointColor != null) {
                drawJoint(jointPoints[jointIndex], jointColor);
            }
        }
    }

    // Draw a joint circle on canvas
    var drawJoint = function (joint, jointColor) {
        bodyContext.beginPath();
        bodyContext.fillStyle = jointColor;
        bodyContext.arc(joint.x, joint.y, JOINTTHICKNESS, 0, Math.PI * 2, true);
        bodyContext.fill();
        bodyContext.closePath();
    }

    // Draw a bone line on canvas
    var drawBone = function (startPoint, endPoint, boneThickness, boneColor) {
        bodyContext.beginPath();
        bodyContext.strokeStyle = boneColor;
        bodyContext.lineWidth = boneThickness;
        bodyContext.moveTo(startPoint.x, startPoint.y);
        bodyContext.lineTo(endPoint.x, endPoint.y);
        bodyContext.stroke();
        bodyContext.closePath();
    }

    // Determine hand state
    var updateHandState = function (handState, jointPoint) {
        switch (handState) {
            case kinect.HandState.closed:
                drawHand(jointPoint, HANDCLOSEDCOLOR);
                break;

            case kinect.HandState.open:
                drawHand(jointPoint, HANDOPENCOLOR);
                break;

            case kinect.HandState.lasso:
                drawHand(jointPoint, HANDLASSOCOLOR);
                break;
        }
    }

    var drawHand = function (jointPoint, handColor) {
        // draw semi transparent hand cicles
        bodyContext.globalAlpha = 0.75;
        bodyContext.beginPath();
        bodyContext.fillStyle = handColor;
        bodyContext.arc(jointPoint.x, jointPoint.y, HANDSIZE, 0, Math.PI * 2, true);
        bodyContext.fill();
        bodyContext.closePath();
        bodyContext.globalAlpha = 1;
    }

    // Draws clipped edges
    var drawClippedEdges = function (body) {

        var clippedEdges = body.clippedEdges;

        bodyContext.fillStyle = "red";

        if (hasClippedEdges(clippedEdges, kinect.FrameEdges.bottom)) {
            bodyContext.fillRect(0, bodyCanvas.height - CLIPBOUNDSTHICKNESS, bodyCanvas.width, CLIPBOUNDSTHICKNESS);
        }

        if (hasClippedEdges(clippedEdges, kinect.FrameEdges.top)) {
            bodyContext.fillRect(0, 0, bodyCanvas.width, CLIPBOUNDSTHICKNESS);
        }

        if (hasClippedEdges(clippedEdges, kinect.FrameEdges.left)) {
            bodyContext.fillRect(0, 0, CLIPBOUNDSTHICKNESS, bodyCanvas.height);
        }

        if (hasClippedEdges(clippedEdges, kinect.FrameEdges.right)) {
            bodyContext.fillRect(bodyCanvas.width - CLIPBOUNDSTHICKNESS, 0, CLIPBOUNDSTHICKNESS, bodyCanvas.height);
        }
    }

    // Checks if an edge is clipped
    var hasClippedEdges = function (edges, clippedEdge) {
        return ((edges & clippedEdge) != 0);
    }

    // Allocate space for joint locations
    var createJointPoints = function () {
        var jointPoints = new Array();

        for (var i = 0; i < jointCount; ++i) {
            jointPoints.push({ joint: 0, x: 0, y: 0 });
        }

        return jointPoints;
    }

    // Create array of bones
    var populateBones = function () {
        var bones = new Array();

        return bones;
    }

    // Body End

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

                // set body colors for each unique body
                bodyColors = [
                    "red",
                    "orange",
                    "green",
                    "blue",
                    "indigo",
                    "violet"
                ];

                //Body End



                // open the sensor
                sensor.open();

                var jointText = document.getElementById('jointInfo');
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
            if (body != null && body.trackingId !== 0) {
              var t = { bodyId: body.trackingId, object: body, joint: body.joints.lookup(20), active: body.isTracked };
                resultArray.push(t);
            }
        }

        return resultArray;
    };

    app.start();

   
})(window, document, Game);
