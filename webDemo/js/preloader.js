define(['jquery', 'utils'],
    function ($, Utils) {
        console.log("preloader");
        var self = this;
        var deferred = $.Deferred();
        var video = $("#atmosPlayer");
        var starterImg = $("#starterImg");
        var endScreenImg = $("#endScreenImg");
        var downloadBtOffImg = $("#downloadBtOffImg");
        var downloadBtOnImg = $("#downloadBtOnImg");
        var bgMusicPlayer = $("#bgMusicPlayer");
        //gameIdentifiere is set in atmos.html
        var gameid = getUrlParameter('gameid') ? getUrlParameter('gameid') : gameIdentifier;

        logmatic.log('Preloader starts', { 'gameid': gameid, 'loading started': logTimer.startTimer('loadingStart'), 'game ID': gameid});
        $.getJSON(Utils.BASE_URL + gameid, function (allData) {
            logmatic.log('Preloader gets game done', { 'game': allData,  'game ID': gameid});
            //for testing in chrome
            //  video.get(0).src = Utils.VIDEO_BASE_URL + allData.shortTitle + "/videos/medium.mp4";


            //For testing with device

            // if (Utils.getMobileOperatingSystem() === "iOS") {
            //     video.get(0).src = Utils.VIDEO_BASE_URL + allData.shortTitle + "/videos/small/stream.m3u8";
            // } else {
            //     video.get(0).src = Utils.VIDEO_BASE_URL + allData.shortTitle + "/videos/small/stream.m3u8";

            
            // $.get(Utils.VIDEO_BASE_URL + allData.shortTitle + "/videos/small.mp4")
            //                 .done(function() { 
            //                     console.log("done");
            //                     loadSrc("small", allData);
            //                 }).fail(function() { 
            //                     console.log("fail");
            //                     loadSrc("medium", allData);
            //                 });


            // video.get(0).src = "http://mediasvcp5lc0xlx242lz.blob.core.windows.net/baby/Kia-1.mp4";
            // video.get(0).src = "https://ia800201.us.archive.org/12/items/BigBuckBunny_328/BigBuckBunny_512kb.mp4";
            // video.get(0).poster = Utils.VIDEO_BASE_URL + allData.shortTitle + "/load.jpg";
 



            // starterImg.get(0).src = Utils.VIDEO_BASE_URL + allData.shortTitle + "/load.jpg";






            
            // if($(starterImg).is(":visible")){
            //                 console.log("Visible");
            //                 $.get(Utils.VIDEO_BASE_URL + allData.shortTitle + "/videos/small.mp4")
            //                 .done(function() { 
            //                     console.log("done");
            //                     loadSrc("small", allData);
            //                 }).fail(function() { 
            //                     console.log("fail");
            //                     loadSrc("medium", allData);
            //                 });v
            //             }

            starterImg.get(0).src = Utils.VIDEO_BASE_URL + allData.shortTitle + "/load.jpg";
            

            $(starterImg).on('load', function () {
                console.log("starterImg has shawn");
                loadSrc("small", allData);              
                // deferred.resolve(allData);
            });

            // loadSrc("small", allData);
            
            endScreenImg.get(0).src = endPic;
            downloadBtOffImg.get(0).src = downloadBtOff;
            downloadBtOnImg.get(0).src = downloadBtOn;
            
        });

        function getUrlParameter(sParam) {
            var sPageURL = decodeURIComponent(window.location.search.substring(1)),
                sURLVariables = sPageURL.split('&'),
                sParameterName,
                i;

            for (i = 0; i < sURLVariables.length; i++) {
                sParameterName = sURLVariables[i].split('=');

                if (sParameterName[0] === sParam) {
                    return sParameterName[1] === undefined ? true : sParameterName[1];
                }
            }
        };

        function loadSrc(param, allData) {
             video.get(0).src = Utils.VIDEO_BASE_URL + allData.shortTitle + "/videos/" + param + ".mp4";
             console.log("Video source loaded: " + video.get(0).src);
             video.get(0).pause();               //pauses autoplay video
             console.log("autoplay is paused");
             bgMusicPlayer.get(0).src = Utils.VIDEO_BASE_URL + allData.shortTitle + "/sound/bg.mp3";
             deferred.resolve(allData);
        };

        return deferred.promise();
    });
