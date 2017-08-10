
define('gesturehandler', ['knockout', 'jquery', 'hammer', 'utils', 'gestureinfo', 'tiltdetector', 'gesturetype'],
  function (ko, $, Hammer, Utils, GestureInfo, tiltDetector, GestureType) {


  var gestureHandler = function () {
    console.log("gestureHandler()");

    var self = this,
        windowHeight = null,
        windowWidth = null,
        video = $("#atmosPlayer"),
        hammertime = null,
        lastEventTime = 0;
        //gestureImage = null,
        //gestureHelperImage = null,
        //tiltView = null,
         
    self.holdEnd = ko.observable(),
      self.keeptappingEnd = ko.observable(),
      self.keepTappingAttack = ko.observable(),
      self.currentGestureIndex = ko.observable(0),
      self.currentTimerIndex = ko.observable(0),
      self.actualIndex = ko.observable(0);
      self.isVideoStarted = ko.observable(false),
      self.isVideoCompleted = ko.observable(false),
      self.isPaused = ko.observable(false),
      self.isTimeoutFinished = ko.observable(true),
      self.gestures = ko.observableArray(),
      self.pauseList = ko.observableArray(),
      self.jumpList = ko.observableArray(),
      self.skipList = ko.observableArray(),
      self.gestureInfo = ko.observable(),
      self.timers = ko.observableArray(),
      self.handleGestureTime = ko.observable(),
      self.gameID = ko.observable();
      self.isHolding = ko.observable(false);
      self.userGesturesList = ko.observableArray(),
      self.handleGestureWithEvent = ko.observable(),
      self.preloadGestureImage = ko.observable();
      self.tapCounter = ko.observable(0),
      self.isKeepTapping = ko.observable(false),
      self.keepTappingPeriodicTimer = ko.observable(),
      self.keepTappingInterval = ko.observable(0),
      self.holdTimer = ko.observable(),
      self.orientation = ko.observable(),
      self.pinchinIsIgnored = ko.observable(false),
      self.pinchoutIsIgnored = ko.observable(false),
      self.hideAnimation,
      self.openStore,
      self.openEndScreen,
      self.initMenu;
      self.userGuideTextId = 0;

    self.initHammer = function () {
      console.log("initHammer()");
      windowHeight = $(window).height();
      windowWidth = $(window).width();
      
      //gestureImage = $("#gestureImage");
      //gestureHelperImage = $("#gestureHelperImage");

      hammertime = new Hammer((document.documentElement));
      hammertime.get('tap').set({ time: 1000 });
      hammertime.get('tap').set({ threshold: 50 });
      hammertime.get('swipe').set({ direction: Hammer.DIRECTION_ALL });
      hammertime.get('swipe').set({ evenType: Hammer.EVENT_START });
      hammertime.get('swipe').set({ threshold: 1 });
      hammertime.get('swipe').set({ velocity: 0.1 });
      hammertime.get('pan').set({ direction: Hammer.DIRECTION_ALL });
      hammertime.get('pan').set({ evenType: Hammer.EVENT_START });
      hammertime.get('pan').set({ threshold: 30 });      
      hammertime.get('pinch').set({ enable: true });
      hammertime.get('press').set({ threshold: 1000, time: 1000 });
    };
      
    //To Enable gestures.
    self.enableHammer = function () {
      // $(document).bind("mouseup touchend", pressupHandler);
      hammertime.on('tap', tapHandler);
      hammertime.on('swipe', swipeHandler);
      hammertime.on('doubletap', doubletapHandler);
      // hammertime.on('press', pressHandler);
      // hammertime.on('pressup', pressupHandler);
      hammertime.on('pan', swipeHandler);
      hammertime.on('pincin', pinchinHandler);
      hammertime.on('pinchout', pinchoutHandler);

      console.log("gestures are enabled " + video.get(0).currentTime);
    };

    //To disable gestures.
    self.disableHammer = function () {
      // $(document).unbind( "mouseup touchend", pressupHandler);
      hammertime.off('tap');
      hammertime.off('swipe');
      hammertime.off('doubletap');
      // hammertime.off('press');
      // hammertime.off('pressup');
      hammertime.off('pan');
      hammertime.off('pincin');
      hammertime.off('pinchout');

      console.log("gestures are disabled" + video.get(0).currentTime);
    };

    //Saves interractions of the user 
      function createUserGestures(ev){
          console.log(ev);
          var userGesture = {type:ev.type, x:ev.center.x, y:ev.center.y, timeStamp: video.get(0).currentTime*1000};
          addUserGesture(userGesture);
      }

      function addUserGesture(gesture){
          console.log("addUserGesture()");
          self.userGesturesList().push(gesture);
      }

      //Handles tap events
      function tapHandler(ev) {

        createUserGestures(ev);
       
        var d = new Date();
        var isEventValid = d.getTime() - lastEventTime > 500 ? true : false;    //If 0.5 sec passed since last event

        if (self.gestureInfo()) {
          if (self.currentGestureIndex() < self.gestures().length && self.isVideoStarted() && isEventValid) {
            self.handleGestureTime = d.getTime();
            console.log('tap detected ' + video.get(0).currentTime);
            lastEventTime = d.getTime();
            for (var j = 0; j < self.gestures()[self.currentGestureIndex()].length; j++) {            //Cheks the multiple dimension array
              var gesture = self.gestures()[self.currentGestureIndex()][j];

              var x = ev.center.x, 
                y = ev.center.y;
              //Checks skip, jump, pause gestures
              if ((isGesturePositionOK(gesture, x, y)===false && gesture.fullscreen()=="no") || gesture.type()==GestureType.JUMPSWIPE){
                if(self.gestureInfo().index){                  
                  checkOtherGestureTypes(ev, gesture);
                  };
              }else if(gesture.type() == GestureType.TAP) {
                self.handleGestureWithEvent(ev, gesture);
                console.log('tap');
              } else if (gesture.type() == GestureType.JUMPTAP) {
                console.log('jumptap');
                handleSomeJumpEvent(ev, gesture);
              } else if(gesture.type() == GestureType.ENDSKIP){
                var currentPosition = Math.round(video.get(0).currentTime * 1000);
                if (currentPosition >= gesture.attack() - Utils.GESTURE_LOADING_TIME) {
                  self.openEndScreen();
                  // self.openStore();
                }
              } else if (gesture.type() == GestureType.KEEPTAPPING) {
                self.tapCounter = self.tapCounter + 1;
                if (!self.isKeepTapping()) {
                  self.isKeepTapping(true);

                  self.keepTappingPeriodicTimer(setInterval(function () {
                    var unit = gesture.timer() / 6;
                    if (gesture.show() == "yes") {

                      var src = "/keeptapping0.png";

                      if (self.keepTappingInterval >= unit && self.keepTappingInterval < unit * 2)
                        src = "/keeptapping20.png";
                      else if (self.keepTappingInterval >= unit * 2 && self.keepTappingInterval < unit * 3)
                        src = "/keeptapping40.png";
                      else if (self.keepTappingInterval >= unit * 3 && self.keepTappingInterval < unit * 4)
                        src = "/keeptapping60.png";
                      else if (self.keepTappingInterval >= unit * 4 && self.keepTappingInterval < unit * 5)
                        src = "/keeptapping80.png";
                      else if (self.keepTappingInterval >= unit * 5 && self.keepTappingInterval < unit * 6)
                        src = "/keeptapping100.png";
                      //gestureImage.get(0).src = Utils.GESTURE_IMAGE_BASE_URL + src;
                      //gestureImage.stop().fadeTo(1.0, 100);
                    }
                    self.keepTappingInterval = (video.get(0).currentTime * 1000) - self.keepTappingAttack();
                    if (self.keepTappingInterval % 250 >= 0 && self.keepTappingInterval % 250 <= 5) {
                      var tapRate = self.tapCounter / (self.keepTappingInterval / 250);
                      if (!(tapRate >= 1)) {
                        video.get(0).pause();
                        self.isKeepTapping(false);
                        clearInterval(self.keepTappingPeriodicTimer());
                      }
                    }

                    if (video.get(0).currentTime * 1000 > self.keeptappingEnd()) {
                      self.handleGestureWithEvent(ev, gesture);
                      clearInterval(self.keepTappingPeriodicTimer());
                    }


                  if (video.get(0).currentTime * 1000 > self.keeptappingEnd()) {
                    self.handleGestureWithEvent(ev, gesture);
                    clearInterval(self.keepTappingPeriodicTimer());
                    self.tapCounter = 0;
                  }
                }, 1));

                video.get(0).play();

              }
            } else{
                  // log('Gesture - ' + ev.type + ' - gesture WRONG', {'Game time': logTimer.getTime('gameStart'), 'Wanted gesture': gesture.type(), 'Wanted direction': gesture.direction(), 'Wanted pos-x': gesture.posX(), 'Wanted pos-y': gesture.posY(), 'Current direction': ev.direction, 'Current pos-x': ev.posX, 'Current pos-y': ev.posY, 'Is wrong': 1, 'game ID': self.gameID()});
            }
          }
         }
        }

      };

      function doubletapHandler(ev) {
        if (self.currentGestureIndex() < self.gestures().length && self.isVideoStarted()) {
          for (var j = 0; j < self.gestures()[self.currentGestureIndex()].length; j++) {
              var gesture = self.gestures()[self.currentGestureIndex()][j];
              if (gesture.type() == GestureType.DOUBLETAP) {
                self.handleGestureWithEvent(ev, gesture);                      //*Not tested
              } else if (gesture.type() == GestureType.JUMPDOUBLETAP) {
                handleSomeJumpEvent(ev, gesture);
              }
          }
        }
      };


      function pressHandler(ev) {
        console.log("Hold");
        self.isHolding(true);
        ev.preventDefault();

        if (self.currentGestureIndex() < self.gestures().length && self.isVideoStarted()) {

              var gesture = self.gestures()[self.currentGestureIndex()][0];
              if (gesture.type() == GestureType.HOLD) {
                console.log("hold ok");

                clearInterval(self.holdTimer());
                self.holdTimer(setInterval(function () {

                  if(Number(video.get(0).currentTime * 1000) < gesture.target()){
                        video.get(0).play();
                        self.isPaused(false);                          
                    }

                    if(self.isHolding && Number(video.get(0).currentTime * 1000) > gesture.target()){

                      console.log(" HOLD IS FINISHED "); 
                      
                      self.handleGestureWithEvent(ev, gesture);
                      clearInterval(self.holdTimer());
                      
                    }
                }, 100));


                
                // if (gesture.show() == "yes") {
                //   var unit = gesture.timer() / 6;

                //   self.holdPeriodicTimer(setInterval(function () {
                //     var elapsed = video.get(0).currentTime * 1000 - gesture.attack();
                //     var src = "hold0.png";

                //     if (elapsed >= unit && elapsed < unit * 2)
                //       src = "hold20.png";
                //     else if (elapsed >= unit * 2 && elapsed < unit * 3)
                //       src = "hold40.png";
                //     else if (elapsed >= unit * 3 && elapsed < unit * 4)
                //       src = "hold60.png";
                //     else if (elapsed >= unit * 4 && elapsed < unit * 5)
                //       src = "hold80.png";
                //     else if (elapsed >= unit * 5 && elapsed < unit * 6)
                //       src = "hold100.png";

                //    // gestureImage.get(0).src = Utils.GESTURE_IMAGE_BASE_URL + src;
                //    // gestureImage.stop().fadeTo(1.0, 100);

                //     if (video.get(0).currentTime * 1000 > self.holdEnd()) {
                //       self.hideAnimation();
                //       self.handleGestureWithEvent(ev, gesture);           //*Not tested
                //       clearInterval(self.holdPeriodicTimer());
                //     }
                //   }, 1));
                // }
              }
 
        }
      };

      function pressupHandler(ev) {
        console.log("press up");
        clearInterval(self.holdTimer());
        self.isHolding(false);
        hammertime.on('pan', swipeHandler);
        hammertime.on('swipe', swipeHandler);
        if (self.currentGestureIndex() < self.gestures().length && self.isVideoStarted()) {
          console.log("press up ok");
            var gesture = self.gestures()[self.currentGestureIndex()][0];
            if (gesture.type() == GestureType.HOLD) {
                
                console.log("press up after HOLD");
                console.log( gesture.attack() + "    " + video.get(0).currentTime * 1000 + "    " + gesture.target());
            if(Number(video.get(0).currentTime * 1000) < gesture.target() && Number(video.get(0).currentTime * 1000) > gesture.attack()){
                  video.get(0).pause();
                  self.isPaused(true); 
            }
          }
        }
      };

    //Checks if current gestures direction is equal to the actual events direction
      self.isSwipeDirectionOk = function (ev, direction) {

        switch (ev.direction) {
          case 2:
            console.log('leftswipe');
            return (self.orientation == 1 && (direction == 270 || direction == 200)) || (self.orientation == 0 && (direction == 180 || direction == 100));
          case 4:
            console.log('rightswipe');
            return (self.orientation == 1 && (direction == 90 || direction == 200)) || (self.orientation == 0 && (direction == 0 || direction == 100));
          case 8:
            console.log('upswipe');
            return (self.orientation == 1 && (direction == 0 || direction == 100)) || (self.orientation == 0 && (direction == 270 || direction == 200));
          case 16:
            console.log('downswipe');
            return (self.orientation == 1 && (direction == 180 || direction == 100)) || (self.orientation == 0 && (direction == 90 || direction == 200));
          default:
            return false;
        }
      };  

      function swipeHandler(ev) {
        var d = new Date();
        var isEventValid = d.getTime() - lastEventTime > 500 ? true : false;    //If 0.5 sec passed since last event
        
        if (self.currentGestureIndex() < self.gestures().length && self.isVideoStarted() && isEventValid) {
            self.handleGestureTime = d.getTime();
            console.log('swipe');
            lastEventTime = d.getTime();
            for (var j = 0; j < self.gestures()[self.currentGestureIndex()].length; j++) {
              var gesture = self.gestures()[self.currentGestureIndex()][j];
              
              if(self.isSwipeDirectionOk(ev, gesture.direction())){
                if (gesture.type() === GestureType.SWIPE) {
                      self.handleGestureWithEvent(ev, gesture);                //*Not tested
                } else if (gesture.type() === GestureType.JUMPSWIPE) {
                    handleSomeJumpEvent(ev, gesture);
                }         
              } else {
                  // log('Gesture - ' + ev.type + ' - WRONG', {'Game time': logTimer.getTime('gameStart'), 'Wanted gesture': gesture.type(), 'Wanted direction': gesture.direction(), 'Wanted pos-x': gesture.posX(), 'Wanted pos-y': gesture.posY(), 'Current direction': ev.direction, 'Current pos-x': ev.posX, 'Current pos-y': ev.posY, 'Is wrong': 1, 'game ID': self.gameID()});
              }      
          }
        }
      };



      function pinchoutHandler(ev) {
        if (!self.pinchinIsIgnored()) {
          if (self.currentGestureIndex() < self.gestures().length && self.isVideoStarted()) {
            for (var j = 0; j < self.gestures()[self.currentGestureIndex()].length; j++) {
              var gesture = self.gestures()[self.currentGestureIndex()][j];
              if (gesture.type() == GestureType.PINCHIN) {
                self.pinchinIsIgnored(true);
                self.handleGestureWithEvent(ev, gesture);   //*Not tested
                self.pinchinIsIgnored(false);
              }
            }
          }
        }

      };

      function pinchinHandler(ev) {
        if (!self.pinchoutIsIgnored()) {
          if (self.currentGestureIndex() < self.gestures().length && self.isVideoStarted()) {
            for (var j = 0; j < self.gestures()[self.currentGestureIndex()].length; j++) {
              var gesture = self.gestures()[self.currentGestureIndex()][j];
              if (gesture.type() == GestureType.PINCHOUT) {
                self.pinchoutIsIgnored(true);
                self.handleGestureWithEvent(ev, gesture);     //*Not tested
                self.pinchoutIsIgnored(false);
              }
            }
          }
        }
      };

      //handles skip, pause or jump gesture
      function checkOtherGestureTypes(ev, gesture){
      console.log("checkOtherGestureTypes()");
        var currentPosition = Math.round(video.get(0).currentTime * 1000);
        var x = ev.center.x;
        var y = ev.center.y;

        if(self.skipList().length > 0){
          self.handleSkip(x, y, currentPosition);
        }
        if(self.pauseList().length > 0){
          self.handlePause(x, y, currentPosition);
        }
        if(self.jumpList().length > 0){
          self.handleJump(x, y, currentPosition);
        }
        
      };

      //If there's a skip gesture at the current time when the tap happens -> opens store'
      self.handleSkip = function (x, y, currentPosition) {
        console.log(" skip.starttime: " + self.skipList()[0].startTime() + ' skip.endtime: ' + self.skipList()[0].endTime());
        for (var i = 0; i < self.skipList().length; i++) {
              var skip = self.skipList()[i];
              console.log(skip.startTime() + " now: " + currentPosition + ' ' + (Number(skip.endTime()) + Number(Utils.SKIP_CORRENCT_ENDTIME_SUPPORTER)));
              if (currentPosition >= skip.startTime() && currentPosition <= (Number(skip.endTime()) + Number(Utils.SKIP_CORRENCT_ENDTIME_SUPPORTER))) {
                console.log("skip gesture timing is ok");
                if (skip.gesture().fullscreen() == "yes" || isGesturePositionOK(skip.gesture(), x, y)) {
                  console.log("skip gesture position is ok");
                  self.openStore();
                }
              }
          }
      };

     self.handlePause = function (x, y, currentPosition) {
          for (var i = 0; i < self.pauseList().length; i++) {
            var pause = self.pauseList()[i];
            if (currentPosition >= pause.startTime() && currentPosition <= pause.endTime()) {
              if (pause.gesture().fullscreen() == "yes" || isGesturePositionOK(pause.gesture(), x, y)) {
                if (!self.isPaused()) {
                  video.get(0).pause();
                  self.isPaused = true;
                  clearTimeout(self.timers()[self.currentTimerIndex()]);
                } else {
                  video.get(0).play();
                  self.isPaused(false);
                  var index = self.currentTimerIndex();
                  if (index < self.gestures().length) {
                    var timeout = self.gestures()[index].attack() < Utils.GESTURE_LOADING_TIME ? 0 : self.gestures()[index].attack() - Utils.GESTURE_LOADING_TIME;
                    timeout -= video.get(0).currentTime * 1000;
                    self.timers()[index] = setTimeout(self.timeoutFunc, timeout, index);
                  };
                }
              }
            }
          }
     };

      self.handleJump = function (x, y, currentPosition) {
          for (var i = 0; i < self.jumpList().length; i++) {
            var jump = self.jumpList()[i];
            if (currentPosition >= jump.startTime() && currentPosition <= jump.endTime()) {

              if (jump.gesture().fullscreen() == "yes" || isGesturePositionOK(jump.gesture(), x, y)) {
                video.get(0).currentTime = jump.target() / 1000;
                var index = 0;
                for (var j = 0; j < self.gestures().length; j++) {
                  if (self.gestures()[j].attack() < jump.target()) {
                    index++;
                  }
                }

                for (var j = 0; j < self.timers.length; j++) {
                  clearTimeout(self.timers()[j]);
                }
                if (index < self.gestures().length) {
                  var timeout = self.gestures()[index].attack() < Utils.GESTURE_LOADING_TIME ? 0 : self.gestures()[index].attack() - Utils.GESTURE_LOADING_TIME;
                  timeout -= video.get(0).currentTime * 1000;
                  self.timers()[index] = setTimeout(self.timeoutFunc, timeout, index);
                  self.currentTimerIndex(index);
                };
                self.hideAnimation();
              }
            }
          }
      };

    //Set the videos position to the next target time, checks if gestures position is ok
    function handleSomeJumpEvent(ev, gesture) {
      console.log('handleSomeJumpEvent() ');
      var x = ev.center.x;
      var y = ev.center.y;
      if (gesture !== null) {
        var currentPosition = Math.round(video.get(0).currentTime * 1000);
        console.log(currentPosition + "   ------  " + gesture.attack() + " - " + gesture.target());
        if (currentPosition >= gesture.attack() - Utils.GESTURE_LOADING_TIME) {
            video.get(0).currentTime = gesture.target() / 1000;
            console.log('Current Time after jump: ' + video.get(0).currentTime);
            clearTimeout(self.timers()[self.currentTimerIndex()]);  // Clears Timeout, because if we use a jump event, the video shouldn't pause
            self.handleGestureWithEvent(ev, gesture);
        }else{
          console.log('Nem jó időzítés.')
        }
      }else{
        console.log("Nincs gesztus");
      }
    };

      //Checks if events position(_x, _y) is in the gestures postions given range
      function isGesturePositionOK(gesture, _x, _y) {

        var x = (self.orientation === 0 && (windowWidth < windowHeight)) ? _y : _x,
          y = (self.orientation === 0 && (windowWidth < windowHeight)) ? _x : _y,
          gestSizeFaktor = gesture.gestSize() / 100,
          xFaktor = gesture.posX() / 100,
          yFaktor = gesture.posY() / 100,
          posX = (self.orientation === 0 && (windowWidth < windowHeight)) ? windowHeight * xFaktor : windowWidth * xFaktor,
          posY = (self.orientation === 0 && (windowWidth < windowHeight)) ? windowWidth * (1 - yFaktor) : windowHeight * yFaktor,
          gestSize = (self.orientation === 0 && (windowWidth < windowHeight)) ? (windowWidth * gestSizeFaktor) / 2 : (windowHeight * gestSizeFaktor) / 2;

        return x > posX - gestSize && x < posX + gestSize && y > posY - gestSize && y < posY + gestSize;
      }

      //Calls handle gesture
      self.handleGestureWithEvent = function (event, gesture) {
        console.log('handlesGestureWithEvent()')
        if (event) {
          var x = event.center.x,
            y = event.center.y;
          if (gesture) {
            if (gesture.fullscreen() === "yes" || isGesturePositionOK(gesture, x, y)) {
              // log('Gesture - ' + event.type + ' - CORRECT', { 'Start time': logTimer.startTimer('bufferStart'), 'Game time': logTimer.getTime('gameStart'), 'Is correct': 1, 'game ID': self.gameID()});
              self.handleGesture(gesture);
            } else {
              // log('Gesture - ' + event.type + ' - position WRONG', {'Game time': logTimer.getTime('gameStart'), 'direction': gesture.direction(), 'pos-x': gesture.posX(), 'pos-y': gesture.posY(), 'Is wrong': 1, 'game ID': self.gameID()});
              console.log("rossz pozíció, attack: " + gesture.attack());
            }
          }
        } else {
          //tilt gesture
          self.handleGesture(gesture);
        }
      };


    //Starts the video, sets a timeout till next attack time, called by handleSomeJumpEvent()
    self.handleGesture = function (gesture) {
      console.log("handelGesture()");
        if (gesture && self.gestureInfo().gesture()) {
          // console.log("handle gesture attack: " + gesture.attack());
          $("#handIconDiv").hide(); 
          self.disableHammer();                                                  //Disables gestures till new attack time
          self.isTimeoutFinished(false);
          var index = self.gestureInfo().index();

          if(index == self.gestures().length-1){
          //After the final gesture the video plays till the end, than we can open the Store with a storeClick
            video.get(0).play();
            self.isPaused(false);
          }else{

            //Needed for multiple gesture handling
            //It searches the nearest following attack time and gives the index of it
            var j = self.gestures().length-1;
            console.log(self.gestures()[j][0].attack());
            while((self.gestures()[j][0].attack() - gesture.target()) >= 0){
            index = j;
            j--;
            }

            console.log("current gesture index:" + index);

            // console.log("index: " + index);
            self.gestureInfo().gesture(null);
            self.gestureInfo().index(null);

              console.log(index + " " + self.gestures().length);
              self.currentGestureIndex(index);
              self.currentTimerIndex(index);

              self.actualIndex(self.actualIndex() + 1);
              console.log("NEW ACTUAL INDEX IS: " +  self.actualIndex() );
          };

          //window.removeEventListener('deviceorientation');
          self.hideAnimation();
        }
      };

    //Called at attack time, Creates new gesture, Calls ApllyGesture to pause the video
    self.timeoutFunc = function (index) {
        console.log("timeoutFunc()");
        
        self.gestureInfo(new GestureInfo(index, self.gestures()[index]));         //Creating new gesture      
        console.log('gesztusok száma: ' + self.gestures()[index].length);
        self.isTimeoutFinished(true);
        var minAttack = self.gestures()[index][0].attack();
        var curpos = Math.round(video.get(0).currentTime * 1000);
        var delay = minAttack - curpos - Utils.GESTURE_LOADING_TIME;
        console.log("DELAY " + delay);
        if (delay > 0) {
          setTimeout(function () {
            applyGesture(index);
          }, delay);
        } else{
            applyGesture(index);
        }
      };

      //Pauses the video at the target point
      function applyGesture(index) {
        console.log("ApplyGestures()");
        if(index==0){
          self.initHammer();
        }
        
        self.enableHammer();      //Enables gestures
    
        var curpos = Math.round(video.get(0).currentTime * 1000);

        var minTarget = self.gestures()[index][0].target();
        for(i=0; i<self.gestures()[index].length; i++){
          if(self.gestures()[index][i].target() < minTarget){
            minTarget = self.gestures()[index][i].target();
          }
        }

        var timeout = minTarget - curpos;
        console.log("current position: " + curpos + " target: "+ self.gestures()[index][0].target());
        self.timers()[self.currentTimerIndex()] = setTimeout(function () {    //Sets Timeout till target to stop the video.
          video.get(0).pause();
          self.isPaused(true);
          console.log('video is paused');
          self.showUserGuide(index);
        }, timeout);
      };

      self.setTimerForIndex = function (index) {
        console.log('setTimerForIndex() - index: ' + index);
        console.log('attacK: ' + self.gestures()[index][0].attack());

        var minAttack = self.gestures()[index][0].attack();
        var timeout = minAttack < Utils.GESTURE_LOADING_TIME ? 0 : minAttack - Utils.GESTURE_LOADING_TIME;
        console.log("timeout: " + timeout);
         
        if(self.gestures()[index][0].type() == GestureType.HOLD){
          timeout += Utils.GESTURE_LOADING_TIME;
          self.gestureInfo(new GestureInfo(index, self.gestures()[index]));  

            setTimeout(function(){ 
              self.enableHammer();
              video.get(0).pause();
              self.isPaused(true);

              console.log("video is paused because of HOLD " + video.get(0).currentTime*1000); 
              console.log("hold's attack: " + self.gestures()[index][0].attack()); 
            }
              , timeout);
          }else{ 
              if(timeout > video.get(0).currentTime * 1000){      //For the first gesture
                timeout -= video.get(0).currentTime * 1000;
                self.timers().push(setTimeout(self.timeoutFunc, timeout,index));
              }else{  
                self.timers()[index] = setTimeout(self.timeoutFunc, 0, index);
              }
        }
      };

      self.showUserGuide = function (index) {

        if(index==0){
          $("#userGuideWindow").css('visibility', 'visible');
          
          if(self.orientation == 1){
            $("#userGuideWindow").addClass('pulseAnimation');
          }else{
            $("#userGuideWindow").addClass('pulseAnimationLandscape');
          }

          self.disableHammer();
          changeUserGuideText();

         $('body').one('click touchstart',  function() { 
                    $("#userGuideWindow").remove(); 
                    self.enableHammer();
                    showUserGuideAnimation(index); 
                }); 
                    
        }else {
          showUserGuideAnimation(index); 
        }


      };

    function changeUserGuideText() {

       switch (self.userGuideTextId) {
            case 0:  $("#userGuideText").html("This is a MINIGAME you can PLAY IT!");           
                     self.userGuideTextId++;           
                     break;
            case 1:  $("#userGuideText").html("TAP HERE!");
                     self.userGuideTextId++; 
                     break;
            case 2:  $("#userGuideText").html("TAP the screen to play this MINIGAME");
                    self.userGuideTextId = 0; 
                            break;
        }
        setTimeout(function() {
              changeUserGuideText()
              }, 4000);
    }

    function showUserGuideAnimation(index) {
      var actualGesture = self.gestures()[index][0];
      console.log(actualGesture)

      $("#handIconDiv").show(); 
      if(self.orientation==1){
        $("#handIconDiv").css({top: actualGesture.posY()+'%', left: actualGesture.posX()+'%'});
      }else {
        $("#handIconDiv").css({left: 100-actualGesture.posY()+'%', top: actualGesture.posX()+'%'});
      }
      if(actualGesture.type() == GestureType.TAP || actualGesture.type() == GestureType.JUMPTAP || actualGesture.type() == GestureType.ENDSKIP){

        $("#handIconDiv").removeClass("verticalSwipeAnimation");
        $("#handIconDiv").removeClass("horizontalSwipeAnimation");
        $("#handIconDiv").addClass("tapAnimation");

      }else if(actualGesture.type() == GestureType.SWIPE || actualGesture.type() == GestureType.JUMPSWIPE){

        var actualDirection = actualGesture.direction();

        $("#handIconDiv").removeClass("tapAnimation");

        if((self.orientation == 1 && (actualDirection == 270 || actualDirection == 90 || actualDirection == 200)) || (self.orientation == 0 && (actualDirection == 0 || actualDirection == 180 || actualDirection == 100))){
            $("#handIconDiv").removeClass("verticalSwipeAnimation");
            $("#handIconDiv").addClass("horizontalSwipeAnimation");
        }else{
            $("#handIconDiv").removeClass("horizontalSwipeAnimation");
            $("#handIconDiv").addClass("verticalSwipeAnimation");
        }
      }

    }


//       self.preloadGestureImage = function (gesture) {
//         var gestSrc,
//           gestHelperSrc,
//           tiltSrc;

//         if (gesture.show() === "yes") {
//           switch (gesture.type()) {
//             case GestureType.TAP:
//               gestSrc = Utils.GESTURE_IMAGE_BASE_URL + "tap.png";
//               break;
//             case GestureType.DOUBLETAP:
//               gestSrc = Utils.GESTURE_IMAGE_BASE_URL + "doubletap85.png";
//               break;
//             case GestureType.JUMPTAP:
//               gestSrc = Utils.GESTURE_IMAGE_BASE_URL + "tap.png";
//               break;
//             case GestureType.JUMPDOUBLETAP:
//               gestSrc = Utils.GESTURE_IMAGE_BASE_URL + "doubletap85.png";
//               break;
//             case GestureType.SWIPE:
//               gestSrc = Utils.GESTURE_IMAGE_BASE_URL + "swipe.png";
//               break;
//             case GestureType.JUMPSWIPE:
//               gestSrc = Utils.GESTURE_IMAGE_BASE_URL + "swipe.png";
//               break;
//             case GestureType.KEEPTAPPING:
//               gestSrc = Utils.GESTURE_IMAGE_BASE_URL + "keeptapping.png";
//               break;
//             case GestureType.HOLD:
//               gestSrc = Utils.GESTURE_IMAGE_BASE_URL + "hold.png";
//               break;
//             case GestureType.PINCHIN:
//               gestSrc = Utils.GESTURE_IMAGE_BASE_URL + "pinch.png";
//               gestHelperSrc = Utils.GESTURE_IMAGE_BASE_URL + "pinch.png";
//               break;
//             case GestureType.PINCHOUT:
//               gestSrc = Utils.GESTURE_IMAGE_BASE_URL + "pinch.png";
//               gestHelperSrc = Utils.GESTURE_IMAGE_BASE_URL + "pinch.png";
//               break;
//             case GestureType.LEFTTILT:
//               tiltSrc = Utils.GESTURE_IMAGE_BASE_URL + "tilt.png";
//               break;
//             case GestureType.RIGHTTILT:
//               tiltSrc = Utils.GESTURE_IMAGE_BASE_URL + "tilt.png";
//               break;
//             default:
//               gestSrc = Utils.GESTURE_IMAGE_BASE_URL + "tap.png";
//               break;
//           }
//           gestureImage.attr('src', gestSrc);
//           if (gestHelperSrc != undefined) {
//             gestureHelperImage.attr('src', gestHelperSrc);
//           }
//           if (tiltSrc != undefined) {
//             tiltView.attr('src', tiltSrc);
//           }
//         }
//       }
//     }

  }

  return new gestureHandler();
});
