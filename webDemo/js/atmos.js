requirejs.config({
  baseUrl: 'js',
  // Path mappings for the logical module names
  paths: {
    knockout: 'libraries/knockout-3.3.0',
    jquery: 'libraries/jquery-1.11.3.min',
    hammer: 'libraries/hammer.min',
    Tween: 'libraries/Tween',
    //tracekit: 'libraries/tracekit',
    //logmaticRum: 'libraries/logmatic-rum.min'
    // boomerang: 'libraries/boomerang',
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
  'pauseinfo', 'jumpinfo', 'skipinfo', 'gesture', 'tiltdetector', 'gesturetype'],// 'logmaticRum', 'tracekit'],
  function (preloader, ko, atmosViewModel, $, Hammer, TWEEN, Utils, GestureInfo, PauseInfo, JumpInfo, SkipInfo, Gesture, TiltDetector, GestureType) {//boomerang, TraceKit) {//, TraceKit, boomerang, logmatic, logmaticRum) {
    console.log("atmos.js - Ad started");
    mixpanel.track("Ad started");

    // BOOMR.init({
    //   // autorun: false
    // });
    
    
    //BOOMR.plugins.RT.startTimer("preload");
    var windowHeight = $(window).height();
    var windowWidth = $(window).width();
    var version = "version_1.0";
    preloader.done(function(allData) {
      //BOOMR.plugins.RT.endTimer("preload");
      logmatic.log('Preloader done', { 'ms to preload': logTimer.getTime('loadingStart'), 'game ID': allData.id });
      var vm=new atmosViewModel();

      vm.initGame(allData);
      vm.version = version;
      ko.applyBindings(vm);

      //BOOMR.page_ready()

      //open in portrait mode, no resize event
      if(windowWidth<windowHeight){
        $("#gameIconWrapper").stop().fadeTo(1000, 1.0);
        $("#buttonsWrapper").stop().fadeTo(1000, 1.0);
        $("#atmosPlayer").stop().fadeTo(1000, 1.0);
      };
    });
  });
