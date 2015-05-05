
(function ( $ ) {
    'use strict';

    var slideshowIterator = 0,

        /**
         * Holds instances of $.fn.partSlideshow.Slideshow, where key is the elements ID.
         * Makes it possible to run commands on the instance.
         * @type {{}}
         */
        Instances = {};



    $.fn.partSlideshow = function( options ) {

        if (typeof options === "string") {
            return this.each(function () {
                var $el = $(this), id = $el.attr('id');

                if (typeof Instances[id] === 'undefined') {
                    console.error("partSlideshow was not initialized, must be initialized before '" + options + "' is used.");
                    return;
                }

                // Run command.
                switch(options) {
                    case "refresh":
                        Instances[id].refresh();
                        break;
                }
            });
        }

        /**
         * Default settings.
         */
        var defaultSettings = {

            // How many slides to show at the time.
            visibleSlides: 3,


            // Responsive adapters for visible slide amount,
            // Example to add to this array: {match: function(w){ return w < 620 && w > 300; }, slides: 1}
            visibleSlidesAdapters: [],

            // Makes the last of the visible slides in viewport to be partly shown.
            // Teaser effect to make users click next to see the full image / slide / video.
            teaserSlidePercent: 50,

            // rotate slides, when end of slide start on new when next button is clicked.
            rotate: true,

            // Video adapters.
            videoAdapters: {},

            // Cycle options ( see cycle documentation API for available options ).
            cycleOptions: {},

            // How should we crop the images? Examples: 16/9 , 4/3 , 1 etc.
            // Set to 0 to disable auto crop / zoom effects.
            aspectRatio: 16/9,

            // Player max width when clicking on images / video thumbnails.
            // Will be scaled down when in mobile view etc.
            // Effective when screens are larger then 800 width!
            playerMaxWidth: 800,

            // Zooms to center if images was cropped, false to disable
            zoomCenter: true,

            // Kaltura video adapters options. Set the correct partner ID and kalturaPortal name.
            kaltura: {
                'uia_mediaspace': {
                    // Your unique partner ID, see https://knowledge.kaltura.com/embedding-kaltura-media-players-your-site
                    partnerId: '1484431',
                    // for an actual player id, see https://knowledge.kaltura.com/embedding-kaltura-media-players-your-site
                    uiconfId: '28551341',
                    // Where are your videos located? This will be used to replace video urls to actual preview images.
                    kalturaPortal: 'https://uia.mediaspace.kaltura.com',
                    // Image url, only change if kaltura changed format of thumbnail API.
                    imageUrl: 'http://www.kaltura.com/p/{partner_id}/thumbnail/entry_id/{entry_id}?src_h=1080&width=1920', // src_x=0&src=y=0&src_w=1920&
                    embedArgs: 'iframeembed=true&playerId=kplayer&entry_id={entry_id}&flashvars[streamerType]=auto',
                    iframeDomain: '//cdnapi.kaltura.com'
                },
                'uia_video': {
                    // Your unique partner ID, see https://knowledge.kaltura.com/embedding-kaltura-media-players-your-site
                    partnerId: '101',
                    // for an actual player id, see https://knowledge.kaltura.com/embedding-kaltura-media-players-your-site
                    uiconfId: '23448251',
                    // Where are your videos located? This will be used to replace video urls to actual preview images.
                    kalturaPortal: 'https://video.uia.no',
                    // Image url, only change if kaltura changed format of thumbnail API.
                    imageUrl: 'https://kaltura.uia.no/p/101/thumbnail/entry_id/{entry_id}?src_h=1080&width=1920', // src_x=0&src=y=0&src_w=1920&
                    embedArgs: 'iframeembed=true&playerId=kaltura_player&entry_id={entry_id}&flashvars[streamerType]=auto',
                    iframeDomain: '//kaltura.uia.no'
                }
            },

            // Stretches left / right to a containers element.
            stretchToContainer: false
        };


        // This is the easiest way to have default options.
        var settings = $.extend(defaultSettings, options);

        // Allow to add video adapters (and override ).
        $.fn.partSlideshow.adapters = $.extend($.fn.partSlideshow.adapters, settings.videoAdapters);

        // Check for videoAdapters as callables, call these with supplied settings..
        $.each($.fn.partSlideshow.adapters, function (index, adapter) {
            if (typeof adapter === 'function') {
                delete $.fn.partSlideshow.adapters[index];
                adapter.apply({}, [settings, $.fn.partSlideshow.adapters]);
            }
        });

        return this.each(function () {
            slideshowIterator++;
            var $el = $(this);
            var obj = $.fn.partSlideshow.Slideshow($el, settings, slideshowIterator);
            obj.start();
            Instances[$el.attr('id')] = obj;
        });
    };

}( jQuery ));
