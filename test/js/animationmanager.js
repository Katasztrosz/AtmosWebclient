define('animationmanager', ['knockout', 'jquery', 'Tween', 'requestanimationframe'],
function(ko, $, TWEEN, requestAnimationFrame) {

  var animationManager = function() {

    const GESTURE_IMAGE_BASE_URL = "http://atmosplay.com/webclient/assets/images/gestures/";

    var self = this;
    var gestureImage = $("#gestureImage"),
        gestureHelperImage = $("#gestureHelperImage"),
        tiltView = $("#tiltView"),
        windowHeight = $(window).height(),
        windowWidth = $(window).width();

    self.showAnimation = ko.observable();
    self.hideAnimation = ko.observable();
    self.orientation = ko.observable();
    var tweenAnimation,
        tweenHelperAnimation,
        tweenTiltAnimation;

    $.fn.animateRotate = function(fromAngle, angle, duration, easing, complete) {
        var args = $.speed(duration, easing, complete);
        var step = args.step;
        return this.each(function(i, e) {
          args.step = function(now) {
            $.style(e, 'transform', 'rotate(' + now + 'deg)');
            if (step) return step.apply(this, arguments);
          };

          $({deg: fromAngle}).stop().animate({deg: angle}, args);
        });
    };

    $.fn.preloadGestureImages = function() {
      this.each(function(){
          $('#gestureImage')[0].src = GESTURE_IMAGE_BASE_URL + this;
      });
    }

    $.fn.preloadGestureHelperImages = function() {
      this.each(function(){
          $('#gestureHelperImage')[0].src = GESTURE_IMAGE_BASE_URL + this;
      });
    }

    $.fn.preloadTiltImages = function() {
      this.each(function(){
          $('#tiltView')[0].src = GESTURE_IMAGE_BASE_URL + this;
      });
    }

    function getGestPos(gesture) {

        var gestSizeFaktor = gesture.gestSize() / 100,
        xFaktor = gesture.posX() / 100,
        yFaktor = gesture.posY() / 100,
        posX = self.orientation == 0 ? windowHeight * xFaktor : windowWidth * xFaktor,
        posY = self.orientation == 0 ? windowWidth * (1 - yFaktor) : windowHeight * yFaktor,
        gestSize = self.orientation == 0 ? (windowWidth * gestSizeFaktor) : (windowHeight * gestSizeFaktor);

        return [posX, posY, gestSize];
    }

    self.showAnimation = function(gesture) {

      animate(500);

      handleOrientationAndSize(gesture);

      if (gesture.type() == "tap" || gesture.type() == "doubletap" || gesture.type() == "jumptap") {
        setTapAnimation(gesture);
      } else if (gesture.type() == "swipe" || gesture.type() == "jumpswipe") {
        if ((self.orientation == 1 && gesture.direction() == 0) || (self.orientation == 0 && gesture.direction() == 270)) {
          //swipe up
          setSwipeAnimation("up");
        } else if ((self.orientation == 1 && gesture.direction() == 90) || (self.orientation == 0 && gesture.direction() == 0)) {
          //swipe right
          setSwipeAnimation("right");
        } else if ((self.orientation == 1 && gesture.direction() == 180) || (self.orientation == 0 && gesture.direction() == 90)) {
          //swipe down
          setSwipeAnimation("down");
        } else if ((self.orientation == 1 && gesture.direction() == 270) || (self.orientation == 0 && gesture.direction() == 180)) {
          //swipe left
          setSwipeAnimation("left");
        }

      } else if (gesture.type() == "pinchin") {
        setPinchInAnimation();
      } else if (gesture.type() == "pinchout") {
        setPinchOutAnimation();
      } else if (gesture.type() == "lefttilt") {
        setTiltAnimation("left");
      } else if (gesture.type() == "righttilt") {
        setTiltAnimation("right");
      } else if (gesture.type() == "keeptapping") {
        showKeepTapping(gesture);
      } else if (gesture.type() == "hold") {
        showHold(gesture);
      }
    }

    function handleOrientationAndSize(gesture) {

      var gestPos = getGestPos(gesture),
      posX = gestPos[0],
      posY = gestPos[1],
      gestSize = gestPos[2],
      halfGestSize = gestSize / 2.0;

      gestureImage.width(gestSize);
      gestureImage.height(gestSize);

      if (self.orientation == 0) {
        var degrees = "90";
        gestureImage.css({'-webkit-transform' : 'rotate('+ degrees +'deg)',
        '-moz-transform' : 'rotate('+ degrees +'deg)',
        '-ms-transform' : 'rotate('+ degrees +'deg)',
        'transform' : 'rotate('+ degrees +'deg)'});
        var top = posX - halfGestSize + "px",
        left = (posY - halfGestSize) + "px";
        gestureImage.css({top: top, left: left, position:'absolute'});
      } else {
        var top = posY - halfGestSize + "px",
        left = posX - halfGestSize + "px";
        gestureImage.css({top: top, left: left, position:'absolute'});
      }

      if (gesture.type() == "pinchin" || gesture.type() == "pinchout") {
        gestureHelperImage.width(gestSize);
        gestureHelperImage.height(gestSize);

        if (self.orientation == 0) {
          var degrees = "90";
          gestureHelperImage.css({'-webkit-transform' : 'rotate('+ degrees +'deg)',
          '-moz-transform' : 'rotate('+ degrees +'deg)',
          '-ms-transform' : 'rotate('+ degrees +'deg)',
          'transform' : 'rotate('+ degrees +'deg)'});
          var top = posX - halfGestSize + "px",
          left = (posY - halfGestSize) + "px";
          gestureHelperImage.css({top: top, left: left, position:'absolute'});
        } else {
          var top = posY - halfGestSize + "px",
          left = posX - halfGestSize + "px";
          gestureHelperImage.css({top: top, left: left, position:'absolute'});
        }
      }

      if (gesture.type() == "lefttilt" || gesture.type() == "righttilt") {
        tiltView.width(gestSize);
        tiltView.height(gestSize);

        if (self.orientation == 0) {
          var degrees = "90";
          tiltView.css({'-webkit-transform' : 'rotate('+ degrees +'deg)',
          '-moz-transform' : 'rotate('+ degrees +'deg)',
          '-ms-transform' : 'rotate('+ degrees +'deg)',
          'transform' : 'rotate('+ degrees +'deg)'});

          tiltView.css({margin: "auto 0", left: "0px", top: "0px", bottom: "0px", position:'absolute'});
        } else {
          var top = posY - halfGestSize + "px",
          left = posX - halfGestSize + "px";
          tiltView.css({margin: "0 auto", left: "0px", bottom: "0px", right: "0px", position:'absolute'});
        }
      }
    }

    function setTapAnimation(gesture) {
      if (gesture.type() == "doubletap") {
        var src = GESTURE_IMAGE_BASE_URL + "doubletap85.png";
        gestureImage.attr('src', src );
      } else {
        var src = GESTURE_IMAGE_BASE_URL + "tap.png";
        gestureImage.attr('src', src );
      }

      alphaAnimationTo100();
    }

    function alphaAnimationTo80() {
      gestureImage.stop().fadeTo(500, 0.8, alphaAnimationTo100);
    }

    function alphaAnimationTo100() {
      gestureImage.stop().fadeTo(500, 1.0, alphaAnimationTo80);
    }

    function showKeepTapping(gesture) {

      gestureImage.get(0).src = GESTURE_IMAGE_BASE_URL + "/keeptapping0.png";
      gestureImage.stop().fadeTo(1.0, 100);
    }

    function showHold(gesture) {

      gestureImage.get(0).src = GESTURE_IMAGE_BASE_URL + "hold0.png";
      gestureImage.stop().fadeTo(1.0, 100);
    }

    function moveLeftPositive() {
      var coords = { top: parseInt(gestureImage.get(0).style.top), left: parseInt(gestureImage.get(0).style.left) };
      var diff = coords.left * 3;
      tweenAnimation = new TWEEN.Tween(coords)
          .to({ top: coords.top, left: diff }, 1000)
					.easing(TWEEN.Easing.Cubic.InOut)
          .onUpdate(function() {
            updateGestureImage( gestureImage.get(0), this );
          })
          .onComplete(function() {
            moveLeftNegativeInstantly();
          })
          .start();
    }

    function moveLeftNegative() {
      var coords = { top: parseInt(gestureImage.get(0).style.top), left: parseInt(gestureImage.get(0).style.left) };
      var diff = coords.left / 3;
      tweenAnimation = new TWEEN.Tween(coords)
          .to({ top: coords.top, left: diff }, 1000)
					.easing(TWEEN.Easing.Cubic.InOut)
          .onUpdate(function() {
            updateGestureImage( gestureImage.get(0), this );
          })
          .onComplete(function() {
            moveLeftPositiveInstantly();
          })
          .start();
    }

    function moveTopPositive() {
      var coords = { top: parseInt(gestureImage.get(0).style.top), left: parseInt(gestureImage.get(0).style.left) };
      var diff = coords.top * 2;
      tweenAnimation = new TWEEN.Tween(coords)
          .to({ top: diff, left: coords.left }, 1000)
					.easing(TWEEN.Easing.Cubic.InOut)
          .onUpdate(function() {
            updateGestureImage( gestureImage.get(0), this );
          })
          .onComplete(function() {
            moveTopNegativeInstantly();
          })
          .start();
    }

    function moveTopNegative() {
      var coords = { top: parseInt(gestureImage.get(0).style.top), left: parseInt(gestureImage.get(0).style.left) };
      var diff = coords.top / 2;
      tweenAnimation = new TWEEN.Tween(coords)
          .to({ top: diff, left: coords.left }, 1000)
					.easing(TWEEN.Easing.Cubic.InOut)
          .onUpdate(function() {
            updateGestureImage( gestureImage.get(0), this );
          })
          .onComplete(function() {
            moveTopPositiveInstantly();
          })
          .start();
    }

    function moveTopLeftNegative() {
      var coords = { top: parseInt(gestureImage.get(0).style.top), left: parseInt(gestureImage.get(0).style.left) };
      var topDiff = coords.top / 1.5;
      var leftDiff = coords.left / 1.5;
      tweenAnimation = new TWEEN.Tween(coords)
          .to({ top: topDiff, left: leftDiff }, 1000)
					.easing(TWEEN.Easing.Cubic.InOut)
          .onUpdate(function() {
            updateGestureImage( gestureImage.get(0), this );
          })
          .onComplete(function() {
            moveTopLeftPositiveInstantly();
          })
          .start();
    }

    function moveTopLeftPositive() {
      var coords = { top: parseInt(gestureHelperImage.get(0).style.top), left: parseInt(gestureHelperImage.get(0).style.left) };
      var topDiff = coords.top * 1.5;
      var leftDiff = coords.left * 1.5;
      tweenHelperAnimation = new TWEEN.Tween(coords)
          .to({ top: topDiff, left: leftDiff }, 1000)
					.easing(TWEEN.Easing.Cubic.InOut)
          .onUpdate(function() {
            updateGestureImage( gestureHelperImage.get(0), this );
          })
          .onComplete(function() {
            moveTopLeftNegativeInstantly();
          })
          .start();
    }

    function moveLeftPositiveInstantly() {
      var coords = { top: parseInt(gestureImage.get(0).style.top), left: parseInt(gestureImage.get(0).style.left) };
      var diff = coords.left * 3;
      tweenAnimation = new TWEEN.Tween(coords)
          .to({ top: coords.top, left: diff }, 0)
					.easing(TWEEN.Easing.Cubic.InOut)
          .onUpdate(function() {
            updateGestureImage( gestureImage.get(0), this );
          })
          .onComplete(function() {
            moveLeftNegative();
          })
          .start();
    }

    function moveLeftNegativeInstantly() {
      var coords = { top: parseInt(gestureImage.get(0).style.top), left: parseInt(gestureImage.get(0).style.left) };
      var diff = coords.left / 3;
      tweenAnimation = new TWEEN.Tween(coords)
          .to({ top: coords.top, left: diff }, 0)
					.easing(TWEEN.Easing.Cubic.InOut)
          .onUpdate(function() {
            updateGestureImage( gestureImage.get(0), this );
          })
          .onComplete(function() {
            moveLeftPositive();
          })
          .start();
    }

    function moveTopPositiveInstantly() {
      var coords = { top: parseInt(gestureImage.get(0).style.top), left: parseInt(gestureImage.get(0).style.left) };
      var diff = coords.top * 2;
      tweenAnimation = new TWEEN.Tween(coords)
          .to({ top: diff, left: coords.left }, 0)
					.easing(TWEEN.Easing.Cubic.InOut)
          .onUpdate(function() {
            updateGestureImage( gestureImage.get(0), this );
          })
          .onComplete(function() {
            moveTopNegative();
          })
          .start();
    }

    function moveTopNegativeInstantly() {
      var coords = { top: parseInt(gestureImage.get(0).style.top), left: parseInt(gestureImage.get(0).style.left) };
      var diff = coords.top / 2;
      tweenAnimation = new TWEEN.Tween(coords)
          .to({ top: diff, left: coords.left }, 0)
					.easing(TWEEN.Easing.Cubic.InOut)
          .onUpdate(function() {
            updateGestureImage( gestureImage.get(0), this );
          })
          .onComplete(function() {
            moveTopPositive();
          })
          .start();
    }

    function moveTopLeftPositiveInstantly() {
      var coords = { top: parseInt(gestureImage.get(0).style.top), left: parseInt(gestureImage.get(0).style.left) };
      var topDiff = coords.top * 1.5;
      var leftDiff = coords.left * 1.5;
      tweenAnimation = new TWEEN.Tween(coords)
          .to({ top: topDiff, left: leftDiff }, 0)
					.easing(TWEEN.Easing.Cubic.InOut)
          .onUpdate(function() {
            updateGestureImage( gestureImage.get(0), this );
          })
          .onComplete(function() {
            moveTopLeftNegative();
          })
          .start();
    }

    function moveTopLeftNegativeInstantly() {
      var coords = { top: parseInt(gestureHelperImage.get(0).style.top), left: parseInt(gestureHelperImage.get(0).style.left) };
      var topDiff = coords.top / 1.5;
      var leftDiff = coords.left / 1.5;
      tweenHelperAnimation = new TWEEN.Tween(coords)
          .to({ top: topDiff, left: leftDiff }, 0)
					.easing(TWEEN.Easing.Cubic.InOut)
          .onUpdate(function() {
            updateGestureImage( gestureHelperImage.get(0), this );
          })
          .onComplete(function() {
            moveTopLeftPositive();
          })
          .start();
    }

    function initUpSwipe() {
      var coords = { top: parseInt(gestureImage.get(0).style.top), left: parseInt(gestureImage.get(0).style.left) };
      var diff = coords.top * 1.5;
      tweenAnimation = new TWEEN.Tween(coords)
          .to({ top: diff, left: coords.left }, 0)
					.easing(TWEEN.Easing.Cubic.InOut)
          .onUpdate(function() {
            updateGestureImage( gestureImage.get(0), this );
          })
          .onComplete(function() {
            moveTopNegative();
          })
          .start();
    }

    function initRightSwipe() {
      var coords = { top: parseInt(gestureImage.get(0).style.top), left: parseInt(gestureImage.get(0).style.left) };
      var diff = coords.left / 2;
      tweenAnimation = new TWEEN.Tween(coords)
          .to({ top: coords.top, left: diff }, 0)
					.easing(TWEEN.Easing.Cubic.InOut)
          .onUpdate(function() {
            updateGestureImage( gestureImage.get(0), this );
          })
          .onComplete(function() {
            moveLeftPositive();
          })
          .start();
    }

    function initLeftSwipe() {
      var coords = { top: parseInt(gestureImage.get(0).style.top), left: parseInt(gestureImage.get(0).style.left) };
      var diff = coords.left * 1.5;
      tweenAnimation = new TWEEN.Tween(coords)
          .to({ top: coords.top, left: diff }, 0)
					.easing(TWEEN.Easing.Cubic.InOut)
          .onUpdate(function() {
            updateGestureImage( gestureImage.get(0), this );
          })
          .onComplete(function() {
            moveLeftNegative();
          })
          .start();
    }

    function initDownSwipe() {
      var coords = { top: parseInt(gestureImage.get(0).style.top), left: parseInt(gestureImage.get(0).style.left) };
      var diff = coords.top / 1.5;
      tweenAnimation = new TWEEN.Tween(coords)
          .to({ top: diff, left: coords.left }, 0)
					.easing(TWEEN.Easing.Cubic.InOut)
          .onUpdate(function() {
            updateGestureImage( gestureImage.get(0), this );
          })
          .onComplete(function() {
            moveTopPositive();
          })
          .start();
    }

    function initPinchIn() {
      moveTopLeftNegative();
      moveTopLeftPositive();
    }

    function initPinchOut() {
      moveTopLeftNegativeInstantly();
      moveTopLeftPositiveInstantly();
    }

    function setSwipeAnimation(direction) {

      var src = GESTURE_IMAGE_BASE_URL + "swipe.png";
      gestureImage.attr('src', src );
      gestureImage.stop().fadeTo(100, 1.0);

      // Animation animation;
      switch (direction) {
        case "up":
          initUpSwipe();
          break;
        case "right":
          initRightSwipe();
          break;
        case "down":
          initDownSwipe();
          break;
        case "left":
          initLeftSwipe();
          break;
        default:
          initUpSwipe();
          break;
      }
    }

    function animate(time) {
      requestAnimationFrame.reqAnimFrame();
      TWEEN.update(time);
    }
    function updateGestureImage(box, params ) {
			var field,
				s = box.style;
			for (field in params) {
				s[field] = params[field] + "px";
			}
		}

    function setPinchInAnimation() {
      var src = GESTURE_IMAGE_BASE_URL + "pinch.png";
      gestureImage.attr('src', src );
      gestureHelperImage.attr('src', src );

      gestureImage.stop().fadeTo(100, 1.0);
      gestureHelperImage.stop().fadeTo(100, 1.0);

      initPinchIn();
    }

    function setPinchOutAnimation() {
      var src = GESTURE_IMAGE_BASE_URL + "pinch.png";
      gestureImage.attr('src', src );
      gestureHelperImage.attr('src', src );

      gestureImage.stop().fadeTo(100, 1.0);
      gestureHelperImage.stop().fadeTo(100, 1.0);

      initPinchOut();
    }

    function rotateImage( box, params ) {
			var s = box.style,
				transform = 'rotate(' + Math.floor( params.rotation ) + 'deg)';
			s.webkitTransform = transform;
			s.mozTransform = transform;
			s.transform = transform;
		}

    function tiltRight40Degrees() {
      var rotation = { rotation: 0 };
      var degrees = 40;
      tweenTiltAnimation = new TWEEN.Tween(rotation)
          .to({ rotation: degrees }, 500)
          .onUpdate(function() {
            rotateImage( tiltView.get(0), this );
          })
          .onComplete(function() {
            tiltRight30Degrees();
          })
          .start();
    }

    function tiltRight30Degrees() {
      var rotation = { rotation: 40 };
      var degrees = 25;
      tweenTiltAnimation = new TWEEN.Tween(rotation)
          .to({ rotation: degrees }, 500)
          .onUpdate(function() {
            rotateImage( tiltView.get(0), this );
          })
          .onComplete(function() {
            tiltRightBack40Degrees();
          })
          .start();
    }

    function tiltRightBack40Degrees() {
      var rotation = { rotation: 25 };
      var degrees = 40;
      tweenTiltAnimation = new TWEEN.Tween(rotation)
          .to({ rotation: degrees }, 500)
          .onUpdate(function() {
            rotateImage( tiltView.get(0), this );
          })
          .onComplete(function() {
            tiltRight30Degrees();
          })
          .start();
    }

    function tiltLeft40Degrees() {
      var rotation = { rotation: 0 };
      var degrees = -40;
      tweenTiltAnimation = new TWEEN.Tween(rotation)
          .to({ rotation: degrees }, 500)
          .onUpdate(function() {
            rotateImage( tiltView.get(0), this );
          })
          .onComplete(function() {
            tiltLeft30Degrees();
          })
          .start();
    }

    function tiltLeft30Degrees() {
      var rotation = { rotation: -40 };
      var degrees = -25;
      tweenTiltAnimation = new TWEEN.Tween(rotation)
          .to({ rotation: degrees }, 500)
          .onUpdate(function() {
            rotateImage( tiltView.get(0), this );
          })
          .onComplete(function() {
            tiltLeftBack40Degrees();
          })
          .start();
    }

    function tiltLeftBack40Degrees() {
      var rotation = { rotation: -25 };
      var degrees = -40;
      tweenTiltAnimation = new TWEEN.Tween(rotation)
          .to({ rotation: degrees }, 500)
          .onUpdate(function() {
            rotateImage( tiltView.get(0), this );
          })
          .onComplete(function() {
            tiltLeft30Degrees();
          })
          .start();
    }

    function setTiltAnimation(direction) {
      var src = GESTURE_IMAGE_BASE_URL + "tilt.png";
      tiltView.attr('src', src );

      tiltView.stop().fadeTo(100, 1.0);

      if (direction == "left") {
        tiltLeft40Degrees();
      } else {
        tiltRight40Degrees();
      }
    }

    self.hideAnimation = function() {
      if (tweenAnimation != null) {
        tweenAnimation.stop();
      }
      if (tweenHelperAnimation != null) {
        tweenHelperAnimation.stop();
      }
      gestureImage.stop();
      gestureHelperImage.stop();

      gestureImage.css({"opacity": "0.0"});
      gestureHelperImage.css({"opacity": "0.0"});

      tiltView.clearQueue().stop(true, false);

      if (tweenTiltAnimation != null) {
        tweenTiltAnimation.stop();
      }
      tiltView.css({
           transform: 'rotate(0deg)'
         });
      var src = GESTURE_IMAGE_BASE_URL + "tiltend.png";
      tiltView.attr('src', src );
      setTimeout(function () {
        tiltView.stop().fadeTo(100, 0.0);
      }, 500);
    }

  }

  return new animationManager();

});
