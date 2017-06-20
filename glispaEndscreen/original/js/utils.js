define('utils', ['knockout'],
function(ko) {

  var Utils = function() {

      var self = this;

      self.ENDPOINT = 'https://api.atmosplay.com/';
      self.GESTURE_LOADING_TIME = 500;
      self.SKIP_CORRENCT_ENDTIME_SUPPORTER = 100;
      self.GESTURE_IMAGE_BASE_URL = "https://atmosplay.com/webclient/assets/images/gestures/";
      self.IMAGE_BASE_URL = "https://atmosplay.com/webclient/assets/images/";
      self.BASE_URL = self.ENDPOINT + "game/";
      self.VIDEO_BASE_URL = "https://demos.atmosplay.com/";
      // self.VIDEO_BASE_URL = "https://s3.eu-central-1.amazonaws.com/atmosplay-frankfurt/";
      // self.VIDEO_BASE_URL = "https://storage.googleapis.com/atmosplay/";
      // self.VIDEO_BASE_URL = "https://s3-us-west-2.amazonaws.com/atmosplay/";
      
      self.GAME_ID = 229;

      self.getMobileOperatingSystem = function() {
        var userAgent = navigator.userAgent || navigator.vendor || window.opera;

        if( userAgent.match( /iPad/i ) || userAgent.match( /iPhone/i ) || userAgent.match( /iPod/i ) )
        {
          return 'iOS';

        }
        else if( userAgent.match( /Android/i ) )
        {

          return 'Android';
        }
        else
        {
          return 'unknown';
        }
      }
  };

  return new Utils();
});
