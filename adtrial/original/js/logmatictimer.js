function Timer() {

      var self = this;

      var startTimes = new Object(); // or var map = {};
    
      self.startTimer = function(key){
        var d = new Date();
        startTimes[key] = d.getTime(); 
        return d.getHours() + ":" + d.getMinutes() + ":" + d.getSeconds();

      }

      self.getTime = function(key){
        var d = new Date(); 
        return d.getTime() - startTimes[key];

      }
}

var logTimer = new Timer();
