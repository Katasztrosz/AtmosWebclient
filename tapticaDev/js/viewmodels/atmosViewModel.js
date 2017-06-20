define(['knockout', 'jquery', 'hammer', 'gesturehandler', 'animationmanager', 'utils', 'gesture', 'pauseinfo', 'jumpinfo', 'skipinfo'],
  function (ko, $, Hammer, gestureHandler, animationManager, Utils, Gesture, PauseInfo, JumpInfo, SkipInfo) {

    var video = $("#atmosPlayer"),
      bgMusicPlayer = $("#bgMusicPlayer"),
      startMenu = $("#startMenu"),
      starterImg = $("#starterImg"),
      //finishMenu = $("#finishMenu"),
      rotateMenu = $("#rotateMenu"),
      gameIcon = $("#gameIcon"),
      gameTitle = $("#gameTitle"),
      finishMessage = $("#finishMessage");
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
      windowHeight = 0,
      windowWidth = 0,
      isMenuOpen = false,
      isStoreClick = false,
      isEndscreen = false;
      reactionSum = 0,
      reactionNum = 0;
      var startTime = 0;
      var globalOrientation;

    $(window).resize(function () {
      logmatic.log('Window resize', {'game ID': gestureHandler.gameID()});
      resize();
    }).resize();

    $(window).on("orientationchange", function (obj) {
      logmatic.log('Window orientation change', {'game ID': gestureHandler.gameID()});
      $("#gameIconWrapper").stop().fadeTo(1000, 1.0);
      $("#buttonsWrapper").stop().fadeTo(1000, 1.0);
      $("#atmosPlayer").stop().fadeTo(1000, 1.0);

      handleRotation();

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

    var showRotateMessage = function () {
        video.hide();
        rotateMenu.fadeTo(50, 1.0);
        if(gestureHandler.isVideoStarted()){
          $("#infoButton").fadeTo(0, 0.0);
          gestureHandler.disableHammer();  
          if(isEndscreen){
            endScreenImg.hide();
            downloadBtOffImg.hide();
          }   
        }
        else{
          shadowWrapper.hide();
          starterImg.hide();
          startMenu.fadeTo(0, 0.0);
        }
    }

    var hideRotateMessage = function () {
        video.show();
        rotateMenu.fadeTo(0, 0.0);
        if(gestureHandler.isVideoStarted()){
          $("#infoButton").fadeTo(500, 1.0);
          gestureHandler.enableHammer();
          if(isEndscreen){
            endScreenImg.show();
            downloadBtOffImg.show();
          }  
        }
        else{  
          shadowWrapper.show();
          starterImg.show();    
          startMenu.fadeTo(50, 1.0);    
        }
    }

    var handleRotation = function () {
        console.log("handleRotation()");
        
        console.log(window.orientation);
        console.log(gestureHandler.orientation);

        switch (window.orientation) {  
        case 0:  
        case 180:  
            if(gestureHandler.orientation === 1){
              hideRotateMessage();
            
            }else{
              showRotateMessage();
            }
            break; 
        case -90: 
        case 90: 
          
            if(gestureHandler.orientation === 1){
              showRotateMEssage();

            }else{
              $("#atmosPlayer").css({
                //   "transform": "rotate(180deg)",
                  "width": "100vw",
                  "height": "100vh",
                  "display": "block",
                  "margin": "auto"
                });
              hideRotateMessage();
            }       
            break;  
        }
      }

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
        mixpanel.track("Game started", eventParameters);;
        video.get(0).play();
        bgMusicPlayer.get(0).play();
        gestureHandler.isVideoPlaying(true);
        gestureHandler.isVideoStarted(false);
      }

      //Called when strat screen is tapped or video is finished
      self.storeClick = function () {
        if (gestureHandler.isVideoCompleted()) {
          // openEndScreen();
          openStore();
        } else {
          logmatic.log('Play Click', { 'Game time': logTimer.getTime("gameStart"), 'Current time': logTimer.startTimer("playClick"), 'game ID': gestureHandler.gameID() });
          console.log('StoreClick()');
          bufferSpinner.addClass('on');
          bufferSpinner.fadeTo(10, 1.0);
          startMenu.remove();
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

        isEndscreen = true;

        hideInfoMenu();
        
                  if(endPic==0){
                      showFinishMenu();
                  }else{    
                      console.log("done");
                      endScreenImg.get(0).style.visibility = 'visible';
                      downloadBtOffImg.css({visibility: 'visible'});
                      $(video).remove();
                      setTimeout(function(){
                        downloadBtOffImg.on('mousedown touchstart', function(event) {
                          console.log('touchstart on off');
                            downloadBtOnImg.css({visibility: 'visible'});
                            downloadBtOffImg.css({visibility: 'hidden'});
                        });
                        downloadBtOffImg.on('click', function(event) {
                          console.log('click on off');
                            openStore();
                        });
                        downloadBtOnImg.on('mouseup touchend click', function(event) {
                          console.log('touchend on on');
                            openStore();
                        });

                        body.on('mouseup touchend', function(event) {
                          console.log('touchend on body');
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
                  },500);                       
                  }
          
        
      }

      // function showFinishMenu(){
      //   console.log('showFinishMenu()');
      //   gestureHandler.disableHammer();
      //   finishMenu.fadeTo(50, 1.0);
      //   shadowWrapper.fadeTo(500, 0.5); 
      //   setTimeout(function(){
      //     document.body.addEventListener('click',  function() { openStore();}); 
      //     document.body.addEventListener('touchstart',  function() { openStore();});       
      //   }, 200);
         
      // }

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
          openStore();
        } else {
          initMenu();
        }
      }

      video.get(0).onwaiting = function () {
         if (gestureHandler.isVideoStarted()) {
          console.log("BUFFERING...");
          logmatic.log('Video on waiting', { 'current_time': logTimer.getTime('gameStart'), 'game ID': gestureHandler.gameID()});
        }
      };

      gestureHandler.actualIndex.subscribe(function(e){
       bufferSpinner.removeClass('on');
       bufferSpinner.fadeTo(0, 0.0);
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

            if (((window.orientation == 0 || window.orientation == 180) && gestureHandler.orientation === 1 ) || ((window.orientation == 90 || window.orientation == -90) && gestureHandler.orientation === 0 )){
              showInfoMenu();
            }
            console.log('set Timeout till first attack: ' + logTimer.getTime('loadingStart'));
            
            var index = gestureHandler.currentTimerIndex();
            console.log("INDEX :" + index)
            console.log("ISVIDEOSTARTED");
            gestureHandler.setTimerForIndex(index);
            gestureHandler.isVideoStarted(true);
            //gestureHandler.preloadGestureImage(gestureHandler.gestures()[0][0]);
          }; 
        } else {
          setTimeout(canPlay, 100);
        }
      }

      video.get(0).onended = function () {
        logmatic.log('Video on ended', { 'current_time': logTimer.getTime('gameStart'), 'game ID': gestureHandler.gameID()});
        gestureHandler.isVideoCompleted(true);
        // openEndScreen();
        openStore();
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
        showStartMenu();
        initMenu();

        handleRotation();
     
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
        $('#starterWrapper').fadeTo(10, 0.0);
        shadowWrapper.fadeTo(500, 0.5);
        gameTitle.get(0).innerHTML = self.game.title;
        gameSubTitle.get(0).innerHTML = self.game.subTitle;
        // finishMessage.get(0).innerHTML = self.game.finishMessage
        startMenu.fadeTo(500, 1.0);
      }

      function hidePlayMenu() {
        shadowWrapper.fadeTo(50, 0);
        bufferSpinner.removeClass('on');
        bufferSpinner.stop().fadeTo(0, 0.0);
        $("#starterImg").remove();
      }

      var initMenu = function () {
        console.log("initMenu()");
        isMenuOpen = false;
        var menuWrapperCSS = ["inactive"];
        var downloadBtnCSS = ["inactive"];
        var infBtnCSS = ["inactive"];

        // if (self.orientation === 0) {

        //   menuWrapperCSS.push("landscape");
        //   // infBtnCSS.push("landscape");
 
        //   // downloadBtnCSS.push("landscape");
        //   // $("#buttonsWrapper").push("landscape");

        //   if (self.game.menuPos === "bottomright") {
        //     menuWrapperCSS.push("bottom bottomTransform");
        //     downloadBtnCSS.push("top");
        //     infBtnCSS.push("bottomLendscape leftLandscape");
        //   } else if (self.game.menuPos === "bottomleft") {
        //     menuWrapperCSS.push("top bottomTransform");
        //     downloadBtnCSS.push("bottom");
        //     infBtnCSS.push("topLandscape leftLandscape");
        //   } else if (self.game.menuPos === "topright") {
        //     menuWrapperCSS.push("bottom bottomTransform");
        //     downloadBtnCSS.push("top");
        //     infBtnCSS.push("bottomLandscape rightLandscape");
        //   } else if (self.game.menuPos === "topleft") {
        //     menuWrapperCSS.push("top bottomTransform");
        //     downloadBtnCSS.push("top");
        //     infBtnCSS.push("topLandscape rightLandscape");
        //   }

        // } else if (self.orientation === 1) {
          if (self.game.menuPos === "bottomright") {
            menuWrapperCSS.push("bottom");
            downloadBtnCSS.push("bottom");
            infBtnCSS.push("bottom right");
          } else if (self.game.menuPos === "bottomleft") {
            menuWrapperCSS.push("bottom");
            downloadBtnCSS.push("bottom");
            infBtnCSS.push("bottom left");
          } else if (self.game.menuPos === "topright") {
            menuWrapperCSS.push("top");
            downloadBtnCSS.push("top");
            infBtnCSS.push("top right");
          } else if (self.game.menuPos === "topleft") {
            menuWrapperCSS.push("top");
            downloadBtnCSS.push("top");
            infBtnCSS.push("top left");
          }
        // }

        self.menuWrapperClasses(menuWrapperCSS);
        self.downloadBtnClasses(downloadBtnCSS);
        self.infoBtnClasses(infBtnCSS);
      }

      var showInfoMenu = function () {
        $("#infoButton").fadeTo(500, 1.0);
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

      function handleOrientation() {
        console.log("handleorientation");
        self.orientation = self.game.orientation;
        globalOrientation = self.game.orientation;
        if (self.orientation === 0) {
          // video.addClass('landscape');
          // startMenu.addClass('landscape');
          // finishMenu.addClass('landscape');
          // $("#endScreenImg").addClass('landscape');
          // $("#downloadBtOffImg").addClass('landscape');
          // $("#downloadBtOnImg").addClass('landscape');
          $("#gameIconWrapper").addClass('landscape');
          $("#buttonsWrapper").addClass('landscape');
          $("#storeButtonDiv").addClass('landscape');
          $("#installButtonDiv").addClass('landscape');
        };
        resize();

      }

     };
   });
