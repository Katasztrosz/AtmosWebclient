define(['jquery', 'utils'],
    function ($, Utils) {
        console.log("preloader");
        var self = this;
        var deferred = $.Deferred();
        var video = $("#atmosPlayer");
        var starterImg = $("#starterImg");
        var startMenu = $("#startMenu");
        var starterWrapper = $("#starterWrapper");
        var endScreenImg = $("#endScreenImg");
        var downloadBtOffImg = $("#downloadBtOffImg");
        var downloadBtOnImg = $("#downloadBtOnImg");
        var bgMusicPlayer = $("#bgMusicPlayer");
        var gameid = getUrlParameter('gameid') ? getUrlParameter('gameid') : gameIdentifier;
        // gameIdentifier is set in atmos.html

        logmatic.log('Preloader starts', { 'gameid': gameid, 'loading started': logTimer.startTimer('loadingStart'), 'game ID': gameid});
        $.getJSON(Utils.BASE_URL + gameid, function (allData) {
            logmatic.log('Preloader gets game done', { 'game': allData,  'game ID': gameid});

            
            starterImg.get(0).src = Utils.VIDEO_BASE_URL + allData.shortTitle + "/load.jpg";

            $(starterImg).on('load', function () {
                console.log("starterImg has shawn");
                loadSrc("small", allData);              
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

            if (typeof atmosVideoUrl != 'undefined' && atmosVideoUrl != 0 && atmosVideoUrl !="${atmos_video_url}"){
                video.get(0).src = atmosVideoUrl;
            }else{
                video.get(0).src = Utils.VIDEO_BASE_URL + allData.shortTitle + "/videos/" + param + ".mp4";
            }
             
             console.log("Video source loaded: " + video.get(0).src);
             video.get(0).pause();               //pauses autoplay video
             console.log("autoplay is paused");
             bgMusicPlayer.get(0).src = Utils.VIDEO_BASE_URL + allData.shortTitle + "/sound/bg.mp3";
             deferred.resolve(allData);
        };

        return deferred.promise();
    });
