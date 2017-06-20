define('gestureinfo', ['knockout'],
    function (ko) {
        return function (index, gesture) {
            var self = this;
            self.index = ko.observable(index);
            self.gesture = ko.observableArray(gesture);
        };
    });