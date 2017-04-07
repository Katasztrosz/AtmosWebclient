define('gesture', ['knockout'],
    function (ko) {
        return function (data) {
            var self = this;
            self.type = ko.observable(data.type);
            self.attack = ko.observable(data.attack);
            self.timeout = ko.observable(data.timeout);
            self.show = ko.observable(data.show);
            self.fullscreen = ko.observable(data.fullscreen);
            self.posX = ko.observable(data['pos-x']);
            self.posY = ko.observable(data['pos-y']);
            self.gestSize = ko.observable(data['gest-size']);
            self.direction = ko.observable(data.direction);
            self.timer = ko.observable(data.timer);
            self.target = ko.observable(data.target);
            self.loop = ko.observable(data.loop);
        };
    });