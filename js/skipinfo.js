define('skipinfo', ['knockout'],
    function (ko) {
        return function (gesture) {
            var self = this;
            self.gesture = ko.observable(gesture);
            self.startTime = ko.observable(gesture.attack());
            self.endTime = ko.observable(gesture.target());
            };
        });