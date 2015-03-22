const BACKGROUND_COLOR = '#000000';
const INFERREDBONETHICKNESS = 1;
const TRACKEDBONETHICKNESS = 4;
const COLORS = [
  [255, 255, 255],
  [255, 0, 0],
  [0, 255, 0],
  [0, 0, 255],
  [255, 255, 0],
  [255, 0, 255],
  [0, 255, 255]
];

export class KinectBodyRenderer {
  constructor(context, kinect) {
    let bones = [];

    // torso
    bones.push({ jointStart: kinect.JointType.head, jointEnd: kinect.JointType.neck });
    bones.push({ jointStart: kinect.JointType.neck, jointEnd: kinect.JointType.spineShoulder });
    bones.push({ jointStart: kinect.JointType.spineShoulder, jointEnd: kinect.JointType.spineMid });
    bones.push({ jointStart: kinect.JointType.spineMid, jointEnd: kinect.JointType.spineBase });
    bones.push({ jointStart: kinect.JointType.spineShoulder, jointEnd: kinect.JointType.shoulderRight });
    bones.push({ jointStart: kinect.JointType.spineShoulder, jointEnd: kinect.JointType.shoulderLeft });
    bones.push({ jointStart: kinect.JointType.spineBase, jointEnd: kinect.JointType.hipRight });
    bones.push({ jointStart: kinect.JointType.spineBase, jointEnd: kinect.JointType.hipLeft });

    // right arm
    bones.push({ jointStart: kinect.JointType.shoulderRight, jointEnd: kinect.JointType.elbowRight });
    bones.push({ jointStart: kinect.JointType.elbowRight, jointEnd: kinect.JointType.wristRight });
    bones.push({ jointStart: kinect.JointType.wristRight, jointEnd: kinect.JointType.handRight });
    bones.push({ jointStart: kinect.JointType.handRight, jointEnd: kinect.JointType.handTipRight });
    bones.push({ jointStart: kinect.JointType.wristRight, jointEnd: kinect.JointType.thumbRight });

    // left arm
    bones.push({ jointStart: kinect.JointType.shoulderLeft, jointEnd: kinect.JointType.elbowLeft });
    bones.push({ jointStart: kinect.JointType.elbowLeft, jointEnd: kinect.JointType.wristLeft });
    bones.push({ jointStart: kinect.JointType.wristLeft, jointEnd: kinect.JointType.handLeft });
    bones.push({ jointStart: kinect.JointType.handLeft, jointEnd: kinect.JointType.handTipLeft });
    bones.push({ jointStart: kinect.JointType.wristLeft, jointEnd: kinect.JointType.thumbLeft });

    // right leg
    bones.push({ jointStart: kinect.JointType.hipRight, jointEnd: kinect.JointType.kneeRight });
    bones.push({ jointStart: kinect.JointType.kneeRight, jointEnd: kinect.JointType.ankleRight });
    bones.push({ jointStart: kinect.JointType.ankleRight, jointEnd: kinect.JointType.footRight });

    // left leg
    bones.push({ jointStart: kinect.JointType.hipLeft, jointEnd: kinect.JointType.kneeLeft });
    bones.push({ jointStart: kinect.JointType.kneeLeft, jointEnd: kinect.JointType.ankleLeft });
    bones.push({ jointStart: kinect.JointType.ankleLeft, jointEnd: kinect.JointType.footLeft });

    this.context = context;
    this.bones = bones;
    this.kinect = kinect;

    this.jointPointsCache = [];
    for (let i = 0; i < this.kinect.Body.jointCount; i++) {
      this.jointPointsCache.push({ joint: 0, x: 0, y: 0 });
    }
  }


  clear(width, height) {
    let context = this.context;

    context.clearRect(0, 0, width, height);
    context.fillStyle = BACKGROUND_COLOR;
    context.fillRect(0, 0, width, height);
  }


  renderBodiesFromPlayers(players) {
    let self = this;

    _.forEach(players, function (player) {
      let joints = player.rawObject.joints;
      if (KinectImageProcessor.BodyHelper.processJointLocations(joints, self.jointPointsCache)) {
        self.renderBody(joints, self.jointPointsCache, COLORS[player.color]);
      }
    });
  }


  renderBody(joints, jointPoints, color) {
    let bones = this.bones;

    // draw all bones
    for (var boneIndex = 0; boneIndex < bones.length; ++boneIndex) {
      var boneStart = bones[boneIndex].jointStart;
      var boneEnd = bones[boneIndex].jointEnd;

      var joint0 = joints.lookup(boneStart);
      var joint1 = joints.lookup(boneEnd);

      // don't do anything if either joint is not tracked
      if ((joint0.trackingState === this.kinect.TrackingState.notTracked) ||
          (joint1.trackingState === this.kinect.TrackingState.notTracked)) {
        return;
      }

      // all bone lines are inferred thickness unless both joints are tracked
      var boneThickness = INFERREDBONETHICKNESS;
      if ((joint0.trackingState === this.kinect.TrackingState.tracked) &&
          (joint1.trackingState === this.kinect.TrackingState.tracked)) {
        boneThickness = TRACKEDBONETHICKNESS;
      }

      var bodyColor = 'rgb(' + color[0] + ',' + color[1] + ',' + color[2] + ')';
      this.drawBone(jointPoints[boneStart], jointPoints[boneEnd], boneThickness, bodyColor);
    }
  }


  drawBone(startPoint, endPoint, boneThickness, boneColor) {
    this.context.beginPath();
    this.context.strokeStyle = boneColor;
    this.context.lineWidth = boneThickness;
    this.context.moveTo(startPoint.x, startPoint.y);
    this.context.lineTo(endPoint.x, endPoint.y);
    this.context.stroke();
    this.context.closePath();
  }
}
