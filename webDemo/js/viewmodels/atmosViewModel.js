define(['knockout', 'jquery', 'hammer', 'gesturehandler', 'animationmanager', 'utils', 'gesture', 'pauseinfo', 'jumpinfo', 'skipinfo'],
  function (ko, $, Hammer, gestureHandler, animationManager, Utils, Gesture, PauseInfo, JumpInfo, SkipInfo) {

    var video = $("#atmosPlayer"),
      bgMusicPlayer = $("#bgMusicPlayer"),
      startMenu = $("#startMenu"),
      gameIcon = $("#gameIcon"),
      gameTitle = $("#gameTitle"),
      gameSubTitle = $("#subTitle"),
      storeImage = $("#storeImage"),
      endScreenImg = $("#endScreenImg"),
      downloadBtOffImg = $("#downloadBtOffImg"),
      downloadBtOnImg = $("#downloadBtOnImg"),
      installButton = $("#installButton"),
      bufferSpinner = $("#bufferSpinner"),
      shadowWrapper = $("#shadowWrapper"),
      body = $("body"),
      playButton = $("#playButton"),
      isBuffering = false,
      windowHeight = 0,
      windowWidth = 0,
      globalOrientation,
      isMenuOpen = false,
      isStoreClick = false,
      startTime,
      reactionSum = 0,
      reactionNum = 0;

    $(window).resize(function () {
      logmatic.log('Window resize', {'game ID': gestureHandler.gameID()});
      resize();
    }).resize();

    $(window).on("orientationchange", function (obj) {
      logmatic.log('Window orientation change', {'game ID': gestureHandler.gameID()});
      $("#gameIconWrapper").stop().fadeTo(1000, 1.0);
      $("#buttonsWrapper").stop().fadeTo(1000, 1.0);
      $("#atmosPlayer").stop().fadeTo(1000, 1.0);
    });


    $(window).on("pagehide", function () {
      if (!isStoreClick) {
        logmatic.log('Game closed', { 'Game time': logTimer.getTime('gameStart'), 'game ID': gestureHandler.gameID()});
        console.log("Game closed");
        var endTime = new Date();
        var timeDiff = endTime - startTime;
        timeDiff /= 1000;
        var curtime = video.get(0).currentTime;
        var duration = video.get(0).duration;
        var ratio = curtime / duration * 100;
        eventParameters.isGameStarted = gestureHandler.isVideoStarted();
        eventParameters.gameplaySeconds = Math.round(timeDiff % 60);
        eventParameters.gameplayPercentage = Math.round(ratio);
        mixpanel.track("Game closed", eventParameters);
      }
    });

    function resize() {
      windowHeight = $(window).height();
      windowWidth = $(window).width();

      if (globalOrientation === 0) {
        video.css('width', windowHeight);

        var videoWidth = video.width(),
          marginLeftAdjust = (windowWidth - videoWidth) / 2,
          marginTopAdjust = (windowHeight - video.height()) / 2;
        video.css({
          'height': windowWidth,
          'marginLeft': marginLeftAdjust,
          'marginTop': -marginLeftAdjust
        });

        body.css({
          'width': videoWidth
        });
      } else if (globalOrientation === 1) {
        video.css('width', windowWidth);

        var videoWidth = video.width(),
          marginLeftAdjust = (windowWidth - videoWidth) / 2;
        video.css({
          'height': windowHeight,
          'marginLeft': marginLeftAdjust
        });
        body.css({
          'width': videoWidth
        });

      }
    }

    // skipinfo.js
    // function SkipInfo(gesture) {
    //   return {
    //     gesture: ko.observable(gesture),
    //     startTime: ko.observable(gesture.attack()),
    //     endTime: ko.observable(gesture.target()),
    //   };
    // }

    return function atmosViewModel() {
      console.log("atmosViewModel()");
      var self = this;

      self.game = {
        title: ko.observable(),
        shortTitle: ko.observable(),
        subTitle: ko.observable(),
        orientation: ko.observable(),
        playStoreLink: ko.observable(""),
        appStoreLink: ko.observable(""),
        gestures: ko.observableArray(),
        menuPos: ko.observable(),
        videoSrc: ko.observable()
      };
      self.showStream = ko.observable(false);
      self.curTime = ko.observable(true);
      self.orientation = ko.observable();
      self.url = ko.observable();
      self.showInstallBtn = ko.observable(true);
      self.opSystem = Utils.getMobileOperatingSystem();

      //constant variables
      self.OP_ANDROID = "Android";
      self.OP_IOS = "iOS";
      self.PAGE_404 = "error404.html";

      //class declarations
      self.menuWrapperClasses = ko.observableArray();
      self.downloadBtnClasses = ko.observableArray();
      self.infoBtnClasses = ko.observableArray();
      self.streamSpinnerClasses = ko.observableArray();
      self.showInfoBtn = false;
      self.showEmptyStoreImage = ko.observable(false);

      ko.bindingHandlers['class'] = {
        update: function (element, valueAccessor) {
          var currentValue = ko.utils.unwrapObservable(valueAccessor()),
            prevValue = element['__ko__previousClassValue__'],

            // Handles updating adding/removing classes
            addOrRemoveClasses = function (singleValueOrArray, shouldHaveClass) {
              if (Object.prototype.toString.call(singleValueOrArray) === '[object Array]') {
                ko.utils.arrayForEach(singleValueOrArray, function (cssClass) {
                  var value = ko.utils.unwrapObservable(cssClass);
                  ko.utils.toggleDomNodeCssClass(element, value, shouldHaveClass);
                });
              } else if (singleValueOrArray) {
                ko.utils.toggleDomNodeCssClass(element, singleValueOrArray, shouldHaveClass);
              }
            };

          addOrRemoveClasses(prevValue, false);

          addOrRemoveClasses(currentValue, true);

          element['__ko__previousClassValue__'] = currentValue.concat();
        }
      };

      //Starts video and music, Called by Store Click
      function play() {
        console.log('play()');
        mixpanel.track("Game started", eventParameters);
        self.showEmptyStoreImage(true);
        // ??? video.get(0).playbackRate = 0.9;
        console.log(video.get(0).src);
        video.get(0).play();
        bgMusicPlayer.get(0).play();
        gestureHandler.isVideoPlaying(true);
        gestureHandler.isVideoStarted(false);
      }

      self.playClick = function () {
        console.log('playclick');
          // gestureHandler.initHammer();
          // play();
      };

      //Called when strat screen is tapped or video is finished
      self.storeClick = function () {
        if (gestureHandler.isVideoCompleted()) {
          //openStore();
          openEndScreen();
        } else {
          logmatic.log('Play Click', { 'Game time': logTimer.getTime("gameStart"), 'Current time': logTimer.startTimer("playClick"), 'game ID': gestureHandler.gameID() });
          console.log('StoreClick()');
          bufferSpinner.fadeTo(10, 1.0);
          startMenu.stop().fadeTo(0, 0.0);
          playButton.hide();
          gestureHandler.initHammer();
          play();
        }
      };

      self.menuStoreClick = function () {
        openStore();
      }

      function openStore() {
        console.log("openStore()");
        logmatic.log('Open store', { 'Game time': logTimer.getTime('gameStart'), 'store_link': self.game.appStoreLink, 'game ID': gestureHandler.gameID() });
        isStoreClick = true;
        var endTime = new Date();
        var timeDiff = endTime - startTime;
        timeDiff /= 1000;
        var curtime = video.get(0).currentTime;
        var duration = video.get(0).duration;
        var ratio = curtime / duration * 100;
        eventParameters.isGameStarted = gestureHandler.isVideoStarted();
        eventParameters.gameplaySeconds = Math.round(timeDiff % 60);
        eventParameters.gameplayPercentage = Math.round(ratio);
        mixpanel.track("Store click", eventParameters);
        
        if (self.opSystem === self.OP_IOS) {
          if (self.game.appStoreLink) {
            console.log(logTimer.getTime('gameStart'));
            logmatic.log('Open store', { 'current_time': logTimer.getTime('gameStart'), 'store_link': self.game.appStoreLink, 'game ID': gestureHandler.gameID() });
             console.log("ios");
            window.location.href = self.game.appStoreLink;
          } else {
            //404 error
            window.location.href = self.PAGE_404;
          }
        } else if (self.opSystem === self.OP_ANDROID) {
          if (self.game.playStoreLink) {
            console.log(logTimer.getTime('gameStart'));
            logmatic.log('Open store', { 'current_time': logTimer.getTime('gameStart'), 'store_link': self.game.playStoreLink, 'game ID': gestureHandler.gameID() });
             console.log("android");
            document.location = self.game.playStoreLink;
          } else {
            //404 error
            document.location = self.PAGE_404;
            logmatic.log('PAGE_404', { 'current_time': logTimer.getTime('gameStart'), 'game ID': gestureHandler.gameID()});
          }
        } 
      }

      function openEndScreen(){
        console.log("openEndScreen()");
        logmatic.log('openEndScreen', { 'Game time': logTimer.getTime('gameStart'), 'game ID': gestureHandler.gameID() });

        hideInfoMenu();
        
                  if(endPic==0){
                      openStore();
                  }else{    
                      console.log("done");
                      endScreenImg.get(0).style.visibility = 'visible';
                      downloadBtOffImg.css({visibility: 'visible'});
                      $(video).remove();
                      downloadBtOffImg.on('mousedown touchstart', function(event) {
                          downloadBtOnImg.css({visibility: 'visible'});
                          downloadBtOffImg.css({visibility: 'hidden'});
                      });
                      downloadBtOffImg.on('click', function(event) {
                          openStore();
                      });
                      downloadBtOnImg.on('mouseup touchend click', function(event) {
                          openStore();
                      });

                      body.on('mouseup touchend', function(event) {
                        downloadBtOffImg.css({visibility: 'visible'});
                        downloadBtOnImg.css({visibility: 'hidden'});
                      })

                      var endTime = new Date();
                      var timeDiff = endTime - startTime;
                      timeDiff /= 1000;
                      var curtime = video.get(0).currentTime;
                      var duration = video.get(0).duration;
                      var ratio = curtime / duration * 100;
                      eventParameters.isGameStarted = gestureHandler.isVideoStarted();
                      eventParameters.gameplaySeconds = Math.round(timeDiff % 60);
                      eventParameters.gameplayPercentage = Math.round(ratio);
                      mixpanel.track("End screen", eventParameters);

                      $(video).remove();                    
                  }
          
        
      }

      self.goBackClick = function () {
        bgMusicPlayer.get(0).pause();
        if (self.opSystem === self.OP_IOS) {
          window.location.href = 'ios:goBackNatively';
        } else if (self.opSystem === self.OP_ANDROID) {
          document.location = 'android:goBackNatively';
        }
      }

      self.openMenuClick = function () {
        logmatic.log('Open menu', { 'is_menu_open': isMenuOpen ,'current_time': logTimer.getTime('gameStart'), 'game ID': gestureHandler.gameID()});
        if (!isMenuOpen) {
          isMenuOpen = !isMenuOpen;
          openMenu();
        } else {
          initMenu();
        }
      }

      video.get(0).onwaiting = function () {
         if (gestureHandler.isVideoStarted()) {
          console.log("BUFFERING...");
          logmatic.log('Video on waiting', { 'current_time': logTimer.getTime('gameStart'), 'game ID': gestureHandler.gameID()});
          // bufferSpinner.stop().fadeTo(0, 1.0);

           isBuffering = true;
          //  gestureHandler.isPaused(true);
          //  gestureHandler.isVideoPlaying(false);
          //  clearTimeout(gestureHandler.timers()[gestureHandler.currentTimerIndex()]);
          //  self.isTimeoutSet=false;;
        }
      };

      gestureHandler.actualIndex.subscribe(function(e){
        bufferSpinner.stop().fadeTo(0, 0.0);
       //Doesn't run first time, just when the video has started
        if (gestureHandler.isVideoStarted() && video.get(0).currentTime * 1000 > 100) {
          
          if(gestureHandler.isPaused()){
            video.get(0).play();
            console.log('play video');
          }

          gestureHandler.isPaused(false);
          gestureHandler.isVideoPlaying(true);

          var d = new Date();    
          reactionSum += (d.getTime()-gestureHandler.handleGestureTime);
          reactionNum++;
          var d = new Date();
          
          logmatic.log('Buffer Finished', { 'buffer time after gesture': logTimer.getTime('bufferStart'), 'Game time': logTimer.getTime('gameStart'), 'game ID': gestureHandler.gameID()});

          console.log("Reaction Time: " + (d.getTime()-gestureHandler.handleGestureTime) + " Average reaction time: " + reactionSum/reactionNum);

          var index = gestureHandler.currentTimerIndex();     
          console.log('Current index: ' + index + ' out of: ' + gestureHandler.gestures().length);
          if (index < gestureHandler.gestures().length) {
            console.log("Timeout set from handle Gesture: " + index);
             gestureHandler.setTimerForIndex(index);
          }
          else{
            console.log("Noo");
            //After the final gesture the video plays till the end, than we can open the Store with a storeClick
            video.get(0).play();
            logmatic.log('Video play()', { 'current_time': logTimer.getTime()});
            gestureHandler.isPaused(false);
            gestureHandler.isVideoPlaying(true);
            
          }
        }
      });

      //Runs when video is ready to play
      video.get(0).oncanplay = function () {
          console.log('oncanplay()');
          console.log("Video source: " + video.get(0).src);
          if(!gestureHandler.isVideoStarted()){
            logmatic.log('Video can play', { 'ms since loaded': logTimer.getTime('loadingStart'), 'game ID': gestureHandler.gameID(), 'Seconds buffered': video.get(0).buffered.end(0)} );
          }
      };

      //Runs when video is playing
      video.get(0).onplay = function () {
        canPlay();
      };

      //Runs when video is playing
      function canPlay() {
        console.log('canPlay()');
        if(!gestureHandler.isVideoStarted()){
          logmatic.log('Video is playing', { 'ms to play the video after play click': logTimer.getTime('playClick'), 'Game time': logTimer.getTime('gameStart'), 'game ID': gestureHandler.gameID()} );
        }

        if (video.get(0).currentTime * 1000 > 0) {
          //Runs on the very first gesture, sets the first timeout till the first attack time
          if (gestureHandler.currentGestureIndex() === 0 && gestureHandler.isVideoStarted() === false) {
            hidePlayMenu();
            showInfoMenu();
            $("#streamSpinner").stop().fadeTo(500, 1.0);
            console.log('set Timeout till first attack: ' + logTimer.getTime('loadingStart'));
            
            var index = gestureHandler.currentTimerIndex();
            console.log("INDEX :" + index)
            gestureHandler.setTimerForIndex(index);
            gestureHandler.isVideoStarted(true);
            //gestureHandler.preloadGestureImage(gestureHandler.gestures()[0][0]);
            self.showStream(true);
          setTimeout(function () {
            $("#streamSpinner").stop().fadeTo(500, 0.0);
            $("#infoButton").stop().fadeTo(500, 1.0);
            self.showInfoBtn = true;
          }, 2000);
          }; 
        } else {
          setTimeout(canPlay, 100);
        }
      }

      video.get(0).onended = function () {
        logmatic.log('Video on ended', { 'current_time': logTimer.getTime('gameStart'), 'game ID': gestureHandler.gameID()});
        console.log("SPINNER 0");
        bufferSpinner.stop().fadeTo(0, 0.0);
        gestureHandler.isVideoCompleted(true);
        //openStore();
        openEndScreen();
        // showStartMenu();
        hideInfoMenu();
        bgMusicPlayer.get(0).pause();
        $("#starterImg").css({
          'pointer-events': 'all'
        });
      }

      video.get(0).onerror = function (error) {
        logmatic.log('Video on error', { 'error': error, 'current_time': logTimer.getTime('gameStart'), 'game ID': gestureHandler.gameID()});
        console.log("video error");
        bgMusicPlayer.get(0).pause();
      };

      self.gameId = video.data('gameid');

      self.initGame = function (allData) {
        console.log("initGame()");
        self.game.title = allData.title;
        self.game.subTitle = allData.subTitle;
        self.game.shortTitle = allData.shortTitle;
        self.game.orientation = allData.orientation;
        self.game.playStoreLink = allData.playStoreLink;
        self.game.appStoreLink = allData.appStoreLink;
        self.game.gestures = allData.gestures;
        self.game.menuPos = allData.menuPos;
        gestureHandler.gameID(allData.id);

        if (clickUrl !== "") {
          self.game.playStoreLink = clickUrl;
          self.game.appStoreLink = clickUrl;
        } else {
          logmatic.log('Click url is not present', {'game ID': gestureHandler.gameID()});
          console.log("Click url is not present.");
        }

        console.log(self.game);

        startTime = new Date();

        handleOrientation();

        $("#playButton").stop().fadeTo(500, 1.0);

        for (var i = 0; i < allData.gestures.length; i++) {
          var gesture = [];
          for (var j = 0; j < allData.gestures[i].length; j++) {
            gesture.push(new Gesture(allData.gestures[i][j]));
          }
          gestureHandler.gestures().push(gesture);
        }

        //If there is a jump/pause/skip gesture in the gestures list, we pushe a new element to jump/pause/skip list
        console.log("Load jump/pause/skip lists");
        for (var i = 0; i < gestureHandler.gestures().length; i++) {
            for (var j = 0; j < gestureHandler.gestures()[i].length; j++) {
              if (gestureHandler.gestures()[i][j].type() === "jump") {
                gestureHandler.jumpList().push(new JumpInfo(gestureHandler.gestures()[i][j]));
              }
              if (gestureHandler.gestures()[i][j].type() === "pause") {
                gestureHandler.pauseList().push(new PauseInfo(gestureHandler.gestures()[i][j]));
              }
              if (gestureHandler.gestures()[i][j].type() === "skip") {
                gestureHandler.skipList().push(new SkipInfo(gestureHandler.gestures()[i][j]));
              }
            }
        }
        //Deletes the jump/pause/skip gesture from the gestures
        for (var i = 0; i < gestureHandler.gestures().length; i++) {
          for (var j = 0; j < gestureHandler.gestures()[i].length; j++) {
            if (gestureHandler.gestures()[i][j].type() === "jump") {
              gestureHandler.gestures()[i].splice(j, 1);
            }
            if (gestureHandler.gestures()[i][j].type() === "pause") {
              gestureHandler.gestures()[i].splice(j, 1);
            }
            if (gestureHandler.gestures()[i][j].type() === "skip") {
            gestureHandler.gestures()[i].splice(j, 1);
            }
          }
        }

        initGestureHandler();
        //???
        //initAnimationManager();

        //???
        showStartMenu();

        $('#starterWrapper').stop().fadeTo(10, 0.0);
        //???
        initMenu();
      };

      function getSizeForResoultion() {
        if (self.opSystem === self.OP_IOS) {
          if (windowWidth >= 375) {
            return "medium";
          } else if (windowWidth >= 320 && windowWidth < 375) {
            return "small";
          } else {
            return "xsmall";
          }
        } else if (self.opSystem === self.OP_ANDROID) {
          if (windowWidth >= 720) {
            return "medium";
          } else if (windowWidth >= 480 && windowWidth < 720) {
            return "small";
          } else {
            return "xsmall";
          }
        } else {
          return "medium";
        }
      }

      function initAnimationManager() {
        animationManager.orientation = self.orientation;
      }

      function initGestureHandler() {
        gestureHandler.hideAnimation = animationManager.hideAnimation;
        gestureHandler.showInfoMenu = showInfoMenu;
        gestureHandler.initMenu = initMenu;
        gestureHandler.orientation = self.orientation;
        gestureHandler.openStore = openStore;
        gestureHandler.openEndScreen = openEndScreen;
      } 

    function openCustomURLinIFrame(src){
        var rootElm = document.documentElement;
        var newFrameElm = document.createElement("IFRAME");
        newFrameElm.setAttribute("src",src);
        rootElm.appendChild(newFrameElm);
        //remove the frame now
        newFrameElm.parentNode.removeChild(newFrameElm);
    }

    function calliOSFunction(){
        var url = "atmos://didFinishLoad";

        var rootElm = document.documentElement;
        var newFrameElm = document.createElement("IFRAME");
        newFrameElm.setAttribute("src",url);
        console.log(url);
        rootElm.appendChild(newFrameElm);
        //remove the frame now
        newFrameElm.parentNode.removeChild(newFrameElm);
    }

      function showStartMenu() {
        console.log("showStartMenu()");
        if (self.opSystem === self.OP_IOS) {
        calliOSFunction();
        }
        bufferSpinner.stop().fadeTo(0, 0.0);
        $('#starterWrapper').stop().fadeTo(10, 0.0);
        shadowWrapper.stop().fadeTo(500, 0.5);
        gameTitle.get(0).innerHTML = self.game.title;
        gameSubTitle.get(0).innerHTML = self.game.subTitle;
        startMenu.stop().fadeTo(500, 1.0);
      }

      function hidePlayMenu() {
        shadowWrapper.stop().fadeTo(0, 0.0);
        bufferSpinner.stop().fadeTo(0, 0.0);
        $("#starterImg").stop().fadeTo(100, 0.0);
        $("#starterImg").css({
          'pointer-events': 'none'
        });
      }

      var initMenu = function () {
        console.log("initMenu()");
        isMenuOpen = false;
        var menuWrapperCSS = ["inactive"];
        var downloadBtnCSS = ["inactive"];
        var streamBtnCss = ["inactive"];
        var infBtnCSS = ["inactive"];

        if (self.orientation === 0) {

          menuWrapperCSS.push("landscape");
          infBtnCSS.push("landscape");
          streamBtnCss.push("landscape");
          downloadBtnCSS.push("landscape");
          $("#buttonsWrapper").push("landscape");

          if (self.game.menuPos === "bottomright") {
            menuWrapperCSS.push("bottom bottomTransform");
            downloadBtnCSS.push("top");
            infBtnCSS.push("bottomLendscape leftLandscape");
            streamBtnCss.push("bottomLendscape leftLandscape");
          } else if (self.game.menuPos === "bottomleft") {
            menuWrapperCSS.push("top bottomTransform");
            downloadBtnCSS.push("bottom");
            infBtnCSS.push("topLandscape leftLandscape");
            streamBtnCss.push("topLandscape leftLandscape");
          } else if (self.game.menuPos === "topright") {
            menuWrapperCSS.push("bottom bottomTransform");
            downloadBtnCSS.push("top");
            infBtnCSS.push("bottomLandscape rightLandscape");
            streamBtnCss.push("bottomLandscape rightLandscape");
          } else if (self.game.menuPos === "topleft") {
            menuWrapperCSS.push("top bottomTransform");
            downloadBtnCSS.push("top");
            infBtnCSS.push("topLandscape rightLandscape");
            streamBtnCss.push("topLandscape rightLandscape");
          }

        } else if (self.orientation === 1) {
          if (self.game.menuPos === "bottomright") {
            menuWrapperCSS.push("bottom");
            downloadBtnCSS.push("bottom");
            infBtnCSS.push("bottom right");
            streamBtnCss.push("bottom right");
          } else if (self.game.menuPos === "bottomleft") {
            menuWrapperCSS.push("bottom");
            downloadBtnCSS.push("bottom");
            infBtnCSS.push("bottom left");
            streamBtnCss.push("bottom left");
          } else if (self.game.menuPos === "topright") {
            menuWrapperCSS.push("top");
            downloadBtnCSS.push("top");
            infBtnCSS.push("top right");
            streamBtnCss.push("top right");
          } else if (self.game.menuPos === "topleft") {
            menuWrapperCSS.push("top");
            downloadBtnCSS.push("top");
            infBtnCSS.push("top left");
            streamBtnCss.push("top left");
          }
        }

        self.menuWrapperClasses(menuWrapperCSS);
        self.downloadBtnClasses(downloadBtnCSS);
        self.infoBtnClasses(infBtnCSS);
        self.streamSpinnerClasses(streamBtnCss);
      }

      var showInfoMenu = function () {
        if (self.showInfoBtn) {
          $("#infoButton").stop().fadeTo(500, 1.0);
        };
        $("#menuWrapper").stop().fadeTo(500, 0.0);
        $("#infoButton").css({
          'pointer-events': 'auto'
        });
        $("#menuWrapper").css({
          'pointer-events': 'auto'
        });
      }

      function hideInfoMenu() {
        $("#infoButton").stop().fadeTo(500, 0.0);
        $("#menuWrapper").stop().fadeTo(500, 0.0);
        $("#infoButton").css({
          'pointer-events': 'none'
        });
        $("#menuWrapper").css({
          'pointer-events': 'none'
        });
      }

      function openMenu() {

        openStore();
      }

      function handleOrientation() {
        console.log("handleorientation");
        self.orientation = self.game.orientation;
        globalOrientation = self.game.orientation;
        if (self.orientation === 0) {
          video.addClass('landscape');
          startMenu.addClass('landscape');
          $("#gameIconWrapper").addClass('landscape');
          $("#gameIcon").addClass('landscape');
          $("#buttonsWrapper").addClass('landscape');
          $("#storeButtonDiv").addClass('landscape');
          $("#installButtonDiv").addClass('landscape');
          $("#endScreenImg").addClass('landscape');
          $("#downloadBtOffImg").addClass('landscape');
          $("#downloadBtOnImg").addClass('landscape');
        };
        resize();

      }

      // var isTiltIgnored;
      // var tiltEnd;
      // var tiltPeriodTimer;

      // function addTiltDetectorEventListener() {
      //   if (window.DeviceOrientationEvent) {

      //     window.addEventListener('deviceorientation', function () {

      //       var reference = 0;
      //       var threshold = 40;

      //       if (self.game.orientetion === 0) {
      //         var beta = Math.round(event.beta);
      //         if (reference + beta < -threshold) {
      //           onLeftTilt();
      //         } else if (reference + beta > threshold) {
      //           onRightTilt();
      //         } else {
      //           onIdleTilt();
      //         }
      //       } else if (self.game.orientation === 1) {
      //         var g = Math.round(event.gamma);
      //         if (reference + g < -threshold) {
      //           onLeftTilt();
      //         } else if (reference + g > threshold) {
      //           onRightTilt();
      //         } else {
      //           onIdleTilt();
      //         }
      //       }
      //     }, true);
      //   } else {
      //     console.log("NOT SUPPORTED");
      //   }
      // }

      // function onLeftTilt() {
      //   if (gestureHandler.gestureInfo().gesture() !== null) {
      //     if (!isTiltIgnored) {
      //       isTiltIgnored = true;
      //       if (gestureHandler.gestures()[gestureHandler.currentGestureIndex()].type() === "lefttilt") {
      //         gestureHandler.isTimeoutFinished(false);
      //         tiltPeriodTimer = setInterval(function () {
      //           if (video.get(0).currentTime * 1000 > tiltEnd) {
      //             window.removeEventListener('deviceorientation');
      //             clearInterval(tiltPeriodTimer);
      //             gestureHandler.handleGestureWithEvent(null);
      //           }
      //         }, 1);

      //         video.get(0).play();
      //       }
      //     }
      //   }
      // }

      // function onRightTilt() {
      //   if (gestureHandler.gestureInfo().gesture() !== null) {
      //     if (!isTiltIgnored) {
      //       isTiltIgnored = true;
      //       if (gestureHandler.gestures()[gestureHandler.currentGestureIndex()].type() === "righttilt") {
      //         gestureHandler.isTimeoutFinished(false);
      //         tiltPeriodTimer = setInterval(function () {
      //           if (video.get(0).currentTime * 1000 > tiltEnd) {
      //             window.removeEventListener('deviceorientation');
      //             clearInterval(tiltPeriodTimer);
      //             gestureHandler.handleGestureWithEvent(null);
      //           }
      //         }, 1);

      //         video.get(0).play();
      //       }
      //     }
      //   }
      // }

      // function onIdleTilt() {
      //   clearInterval(tiltPeriodTimer);
      //   isTiltIgnored = false;
      //   if (gestureHandler.gestureInfo().gesture() !== null) {
      //     if (gestureHandler.gestures()[gestureHandler.currentGestureIndex()].type() === "lefttilt" || gestureHandler.gestures()[gestureHandler.currentGestureIndex()].type() === "righttilt") {
      //       video.get(0).pause();
      //     }
      //   }
      // }
     };
   });
