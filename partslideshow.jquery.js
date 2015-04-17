(function ( $ ) {

    var slideshowIterator = 0;

    var _videoAdapters = {
        youtube: {
            regex: /^.*(youtu.be\/|v\/|e\/|u\/\w+\/|embed\/|v=)([^#\&\?]*).*/,
            match: function (url) {
                return url.match(this.regex);
            },
            videoId: function (url) {
                var video_id = url.split('v=')[1];
                var ampersandPosition = video_id.indexOf('&');
                if(ampersandPosition != -1) {
                    video_id = video_id.substring(0, ampersandPosition);
                }
                return video_id;
            },
            image: function (url, $link) {
                var id = this.videoId(url);
                $link.append($("<img src=\"http://img.youtube.com/vi/"+id+"/maxresdefault.jpg\" />"));
            },
            embed: function (url) {

            }
        },
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
                var video_id = this.videoId(url);
                $.ajax({
                    type:'GET',
                    url: 'http://vimeo.com/api/v2/video/' + video_id + '.json',
                    jsonp: 'callback',
                    dataType: 'jsonp',
                    success: function(data){
                        var thumbnail_src = data[0].thumbnail_large;
                        $link.append($("<img src='"+thumbnail_src+"' />"));
                    }
                });
            }
        }
    };




    $.fn.partSlideshow = function( options ) {

        var defaultSettings = {

            // How many slides to show at the time.
            visibleSlides: 3,

            // Video adapters.
            videoAdapters: [],

            // Cycle options ( see cycle documentation API for available options ).
            cycleOptions: {},

            // How should we crop the images? Examples: 16/9 , 4/3 , 1 etc.
            // Set to 0 to disable auto crop / zoom effects.
            aspectRatio: 16/9,

            // Zooms to center if images was cropped, false to disable
            zoomCenter: true,

            // Kaltura video adapter options. Set the correct partner ID and kalturaPortal name.
            kaltura: {
                // Your unique partner ID
                partnerId: '1484431',
                // Where are your videos located? This will be used to replace video urls to actual preview images.
                kalturaPortal: 'https://uia.mediaspace.kaltura.com',
                // Image url, only change if kaltura changed format of thumbnail API.
                imageUrl: 'http://www.kaltura.com/p/{partner_id}/thumbnail/entry_id/{entry_id}?src_h=1080&width=1920' // src_x=0&src=y=0&src_w=1920&
            }
        };


        // This is the easiest way to have default options.
        var settings = $.extend(defaultSettings, options);
        _videoAdapters = $.extend(_videoAdapters, settings.videoAdapters);

        // Configurable by settings so place here.
        _videoAdapters['kaltura'] = {
            regex: function () {
                return new RegExp('^'+settings.kaltura.kalturaPortal + '.*\/([0-9]_[0-9a-zA-Z-_]+)$', 'i');
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
            }
        };



        this.each(function () {
            slideshowIterator++;
            var $el = $(this);

            var id = "part-slider-" + slideshowIterator,
                cycleInitialized = false,
                shouldHaveHeight = 0,
                shouldHaveWidth = 0;

            $el.prop('id', id);

            var $cycleWrapper = $('<div class="part-slider-container">'+
                '<div class="part-slider-inner">'+
                '<div class="slideshow" data-cycle-fx=carousel data-cycle-timeout=0 data-cycle-carousel-visible=1>'+
                '</div>'+
                '<a href="#" class="cycle-next"><i class="fa fa-chevron-right"></i></a>' +
                '</div></div>');



            $cycleWrapper.find('.slideshow').append($el.html());
            $el.html($cycleWrapper);



            // Video embed
            // Preprocess slides
            $el.find('.slide').each(function () {
                var $slide = $(this),
                    $links = $slide.find('a');

                if ($links.length) {
                    $links.each(function () {
                        var $link = $(this);
                        $.each(_videoAdapters, function (index, item) {
                            var url = $link.attr('href');
                            if (item.match(url)) {
                                var $image = $link.find('img');
                                if (!$image.length) {
                                    item.image(url, $link);
                                }
                            }
                        });
                    });
                }
            });

            function scaleImg($img) {

                var h = $img.height(), w = $img.width();
                var aspect = $img[0].naturalWidth / $img[0].naturalHeight; // IE8+.
                if (h < shouldHaveHeight) {
                    while(h < shouldHaveHeight) {
                        h += 1;
                        w += aspect;
                    }
                    $img.width(w);
                }

                if (settings.zoomCenter) {
                    if ($img.height() > shouldHaveHeight) {
                        var diff = -($img.height() - shouldHaveHeight);
                        $img.css({'margin-top': (diff/2)+'px'});
                    }

                    if ($img.width() > shouldHaveWidth) {
                        var diff = -($img.width() - shouldHaveWidth);
                        $img.css({'margin-left': (diff/2)+'px'});
                    }
                }
            }



            function resizeSlides () {
                if (cycleInitialized) {
                    $el.find('.slideshow').cycle('destroy');
                }

                shouldHaveWidth = $el.find('.part-slider-container').outerWidth(true) / settings.visibleSlides;

                var css = {
                    width: shouldHaveWidth + 'px'
                };

                if (settings.aspectRatio) {
                    shouldHaveHeight = shouldHaveWidth / settings.aspectRatio;
                    css['height'] = parseInt(shouldHaveHeight, 10) + 'px';
                }

                var $slide = $el.find('.part-slider-inner .slide');
                $slide.css(css);

                $el.find('.part-slider-inner .slide-play').css({
                    'margin-top': - ($el.find('.part-slider-inner .slide.video .slide-play').height()/2) + 'px'
                });

                $el.find('.slideshow').cycle($.extend({
                    slides: '> .slide',
                    next: '#'+id+' .cycle-next',
                    log: false,
                    autoWidth: 0
                }, settings.cycleOptions));

                if (cycleInitialized && settings.aspectRatio) {
                    $el.find('.slide img').each(function () {
                        scaleImg($(this));
                    });
                }

                cycleInitialized = true;
            }

            function addDynamicTags () {
                $el.find('.part-slider-inner .slide.video').each(function () {
                    var $slide = $(this);
                    var $overlay = $('<div class="slide-play"><span class="fa-stack fa-4x slide-icon-size"><i class="fa fa-circle fa-stack-2x slide-icon-background"></i><i class="fa fa-play fa-stack-1x slide-icon"></i></span></div>');
                    $slide.find("a").append($overlay);
                });
            }


            $(window).resize(resizeSlides);
            addDynamicTags();
            resizeSlides();
            if (settings.aspectRatio) {
                $el.find('.slide img').load(function () {
                    scaleImg($(this));
                });
            }

        });


    };

}( jQuery ));
