define('gesturetype', ['knockout'],
    function (ko) {
        var GestureType = {
            TAP: "tap",
            DOUBLETAP: "doubletap",
            JUMPTAP: "jumptap",
            JUMPSWIPE: "jumpswipe",
            JUMPDOUBLETAP: "jumpdoubletap",
            SWIPE: "swipe",
            KEEPTAPPING: "keeptapping",
            HOLD: "hold",
            PINCHIN: "pinchin",
            PINCHOUT: "pinchout",
            LEFTTILT: "lefttilt",
            RIGHTTILT: "righttilt",
            JUMP: "jump",
            PAUSE: "pause",
            SKIP: "skip",
            ENDSKIP: "endskip"
        }

        return GestureType;
    });