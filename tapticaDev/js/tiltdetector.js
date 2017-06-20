define('tiltdetector', ['knockout', 'jquery'],
  function (ko, $) {

    var tiltDetector = function () {
      var isTiltIgnored;
      var tiltEnd;
      var tiltPeriodTimer;

      function addTiltDetectorEventListener() {
        if (window.DeviceOrientationEvent) {

          window.addEventListener('deviceorientation', function () {
            var reference = 0;
            var threshold = 40;

            if (self.game.orientetion === 0) {
              var beta = Math.round(event.beta);
              if (reference + beta < -threshold) {
                onLeftTilt();
              } else if (reference + beta > threshold) {
                onRightTilt();
              } else {
                onIdleTilt();
              }
            } else if (self.game.orientation === 1) {
              var g = Math.round(event.gamma);
              if (reference + g < -threshold) {
                onLeftTilt();
              } else if (reference + g > threshold) {
                onRightTilt();
              } else {
                onIdleTilt();
              }
            }
          }, true);
        } else {
          console.log("NOT SUPPORTED");
        }
      }

      function onLeftTilt() {
        if (gestureHandler.gestureInfo().gesture() !== null) {
          if (!isTiltIgnored) {
            isTiltIgnored = true;
            if (gestureHandler.gestures()[gestureHandler.currentGestureIndex()][0].type() === "lefttilt") {
              gestureHandler.isTimeoutFinished(false);
              tiltPeriodTimer = setInterval(function () {
                if (video.get(0).currentTime * 1000 > tiltEnd) {
                  window.removeEventListener('deviceorientation');
                  clearInterval(tiltPeriodTimer);
                  gestureHandler.handleGestureWithEvent(null);
                }
              }, 1);

              video.get(0).play();
            }
          }
        }
      }

      function onRightTilt() {
        if (gestureHandler.gestureInfo().gesture() !== null) {
          if (!isTiltIgnored) {
            isTiltIgnored = true;
            if (gestureHandler.gestures()[gestureHandler.currentGestureIndex()][0].type() === "righttilt") {
              gestureHandler.isTimeoutFinished(false);
              tiltPeriodTimer = setInterval(function () {
                if (video.get(0).currentTime * 1000 > tiltEnd) {
                  window.removeEventListener('deviceorientation');
                  clearInterval(tiltPeriodTimer);
                  gestureHandler.handleGestureWithEvent(null);
                }
              }, 1);

              video.get(0).play();
            }
          }
        }
      }

      function onIdleTilt() {
        clearInterval(tiltPeriodTimer);
        isTiltIgnored = false;
        if (gestureHandler.gestureInfo().gesture() !== null) {
          if (gestureHandler.gestures()[gestureHandler.currentGestureIndex()][0].type() === "lefttilt" || gestureHandler.gestures()[gestureHandler.currentGestureIndex()][0].type() === "righttilt") {
            video.get(0).pause();
          }
        }
      }
    };
    return new tiltDetector();

  });
