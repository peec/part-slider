(function ($) {
    'use strict';

    $.fn.partSlideshow.adapters = {

        /**
         * Youtube
         */
        youtube: {
            regex: /^.*(youtu.be\/|v\/|e\/|u\/\w+\/|embed\/|v=)([^#\&\?]*).*/,
            match: function (url) {
                return url.match(this.regex);
            },
            videoId: function (url) {
                var video_id = url.split('v=')[1];
                var ampersandPosition = video_id.indexOf('&');
                if(ampersandPosition !== -1) {
                    video_id = video_id.substring(0, ampersandPosition);
                }
                return video_id;
            },
            image: function (url, $link) {
                var id = this.videoId(url);
                $link.append($("<img src=\"http://img.youtube.com/vi/"+id+"/maxresdefault.jpg\" />"));
                return $.Deferred().resolve().promise();

            },
            embed: function (url) {
                var id = this.videoId(url);
                return $('<iframe width="560" height="315" src="https://www.youtube.com/embed/'+id+'" frameborder="0" allowfullscreen></iframe>');
            }
        },

        /**
         * Vimeo
         */
        vimeo: {
            regex: /\/\/(?:www\.)?vimeo.com\/([0-9a-z\-_]+)/i,
            match: function (url) {
                return url.match(this.regex);
            },
            videoId: function (url) {
                var matches = this.regex.exec(url);
                return matches && matches[1];
            },
            image: function (url, $link) {
                var $def = $.Deferred();
                var video_id = this.videoId(url);
                $.ajax({
                    type:'GET',
                    url: 'http://vimeo.com/api/v2/video/' + video_id + '.json',
                    jsonp: 'callback',
                    dataType: 'jsonp',
                    success: function(data){
                        var thumbnail_src = data[0].thumbnail_large;
                        $link.append($("<img src='"+thumbnail_src+"' />"));
                        $def.resolve();
                    }
                });
                return $def;
            },
            embed: function (url) {
                var video_id = this.videoId(url);
                return $('<iframe src="//player.vimeo.com/video/'+video_id+'" width="560" height="315" frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen></iframe>');
            }
        },

        /**
         * Kaltura
         * @param settings
         * @returns {{regex: Function, match: Function, videoId: Function, image: Function, embed: Function}}
         */
        kaltura: function (settings) {
            // Configurable by settings so place here.
            return {
                regex: function () {
                    return new RegExp('^'+settings.kaltura.kalturaPortal + '.*\/([0-9]_[0-9a-zA-Z-_]+)(/|$)', 'i');
                },
                match: function (url) {
                    return url.match(this.regex());
                },
                videoId: function (url) {
                    var matches = this.regex().exec(url);
                    return matches && matches[1];
                },
                image: function (url, $link) {
                    // http://www.kaltura.com/p/1484431/thumbnail/entry_id/1_iaju9jvc?width=600
                    var id = this.videoId(url),
                        useUrl = settings.kaltura.imageUrl.replace('{partner_id}', settings.kaltura.partnerId).replace('{entry_id}', id);

                    $link.append($("<img src='"+useUrl+"' />"));
                    return $.Deferred().resolve().promise();
                },
                embed: function (url) {
                    var id = this.videoId(url);
                    var $iframe = $('<iframe src="" width="560" height="395" allowfullscreen webkitallowfullscreen mozAllowFullScreen frameborder="0"></iframe>');
                    $iframe.attr('src', '//cdnapi.kaltura.com/p/'+settings.kaltura.partnerId+'/sp/'+settings.kaltura.partnerId+'00/embedIframeJs/uiconf_id/' + settings.kaltura.uiconfId +
                        '/partner_id/'+settings.kaltura.partnerId+'?' + settings.kaltura.embedArgs.replace('{entry_id}', id));
                    return $iframe;
                }
            };
        }
    };

})(jQuery);