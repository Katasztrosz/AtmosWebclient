requirejs.config({
  baseUrl: 'js',
  // Path mappings for the logical module names
  paths: {
    knockout: 'libraries/knockout-3.3.0',
    jquery: 'libraries/jquery-1.11.3.min',
    hammer: 'libraries/hammer.min',
    Tween: 'libraries/Tween',
  },
  // Shim configurations for modules that do not expose AMD
  shim: {
    'jquery': {
      exports: ['jQuery', '$']
    },
    'hammer': {
      exports: ['Hammer']
    }
  }
});


require(['preloader', 'knockout', 'viewmodels/atmosViewModel', 'jquery', 'hammer', 'Tween', 'utils', 'gestureinfo',
  'pauseinfo', 'jumpinfo', 'skipinfo', 'gesture', 'tiltdetector', 'gesturetype'],
  function (preloader, ko, atmosViewModel, $, Hammer, TWEEN, Utils, GestureInfo, PauseInfo, JumpInfo, SkipInfo, Gesture, TiltDetector, GestureType) {
    console.log("atmos.js - Ad started");
    mixpanel.track("Ad started");

    // To disable "pull-to-refresh" effect present in some webviews.
    // Especially Crosswalk 12 and above (Chromium 41+) runtimes.
    var lastTouchY = 0 ;
    var maybePreventPullToRefresh = false ;

    // Pull-to-refresh will only trigger if the scroll begins when the
    // document's Y offset is zero.

    var touchstartHandler = function(e) {
        if( e.touches.length != 1 ) {             
            return ;
        }
        lastTouchY = e.touches[0].clientY ;
        maybePreventPullToRefresh = (window.pageYOffset === 0) ;
    };

    // To suppress pull-to-refresh it is sufficient to preventDefault the
    // first overscrolling touchmove.
    var touchmoveHandler = function(e) {
        var touchY = e.touches[0].clientY ;
        var touchYDelta = touchY - lastTouchY ;
        lastTouchY = touchY ;

        if (maybePreventPullToRefresh) {
            maybePreventPullToRefresh = false ;
                e.preventDefault() ;
                return ;
        }
    };

    document.addEventListener('touchstart', touchstartHandler, false) ;
    document.addEventListener('touchmove', touchmoveHandler, false) ;

    
    var windowHeight = $(window).height();
    var windowWidth = $(window).width();
    var version = "version_1.0";
    preloader.done(function(allData) {
      logmatic.log('Preloader done', { 'ms to preload': logTimer.getTime('loadingStart'), 'game ID': allData.id });
      var vm=new atmosViewModel();
      vm.initGame(allData);
      vm.version = version;
      ko.applyBindings(vm);

      //open in portrait mode, no resize event
      if(windowWidth<windowHeight){
        $("#gameIconWrapper").stop().fadeTo(1000, 1.0);
        $("#buttonsWrapper").stop().fadeTo(1000, 1.0);
        $("#atmosPlayer").stop().fadeTo(1000, 1.0);
      };
    });
  });
