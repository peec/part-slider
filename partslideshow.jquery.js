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
                var id = this.videoId(url);
                return $('<iframe width="560" height="315" src="https://www.youtube.com/embed/'+id+'" frameborder="0" allowfullscreen></iframe>');
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
            },
            embed: function (url) {
                var video_id = this.videoId(url);
                return $('<iframe src="//player.vimeo.com/video/'+video_id+'" width="560" height="315" frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen></iframe>');
            }
        }
    };



    function scaleImg($img, shouldHaveWidth, shouldHaveHeight, zoomCenter) {

        var h = $img.height(), w = $img.width();
        var aspect = $img[0].naturalWidth / $img[0].naturalHeight; // IE8+.
        if (h < shouldHaveHeight) {
            while(h < shouldHaveHeight) {
                h += 1;
                w += aspect;
            }
            $img.width(w);
        }

        if (zoomCenter) {
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


    function destroyPlayerContainer ($container) {
        $container.find('.part-slider-player').remove();
        
    }

    function createPlayerContainer ($container, $slide, $a, playerMaxWidth) { 
        var $o;
        destroyPlayerContainer($container);



        if ($slide.hasClass('video')) {
                var $links = $a;

                if ($links.length) {
                    $links.each(function () {
                        var $link = $(this);
                        $.each(_videoAdapters, function (index, item) {
                            var url = $link.attr('href');
                            if (item.match(url)) {
                                $slide.data('videoadapter', index);
                            }
                        });

                    });
                }
       
            if (!$slide.data('videoadapter')) {
                console.error("No video adapter was assigned to slide (empty adapter in data attribute).");
                return;
            }
            if (typeof _videoAdapters[$slide.data('videoadapter')].embed === 'undefined') {
                console.error("Video player for adapter '" + $slide.data('videoadapter') + "' was not found. Please implement the 'embed' key in the adapter.");
                return;
            } else {
                var $iframe = _videoAdapters[$slide.data('videoadapter')].embed($a.attr('href'));
                $o = $('<div class="part-slider-video-wrapper"></div>');
                $o.html($iframe);
            }
        } else {
            var $img = $slide.find('img');
            $o = $('<img />');
            $o.attr('src', $img.attr('src'));
        }
        var $wrap = $('<div class="part-slider-overlay-inner"></div>');
        var html = $wrap.html($o);
        var $el = $('<div class="part-slider-overlay part-slider-player"></div>').html(html);
        $container.append($el);


        var closeEvent = function(e) {
            if (e.keyCode == 27) {
                closePlayer();
            } 
        };


        var mouseCloseEvent = function(event) {
            if (!$(event.target).closest('.part-slider-overlay-inner').length) {
                closePlayer();
            }
        };

        var popState = function() {
            var hashLocation = location.hash;
            var hashSplit = hashLocation.split("#!/");
            var hashName = hashSplit[1];

            if (hashName !== '') {
                var hash = window.location.hash;
                if (hash === '') {
                    unbindAndClose();
                }
            }
        };

        function unbindAndClose () {
            destroyPlayerContainer($container);
            $(document).unbind("keyup", closeEvent);
            $(document).unbind("click", mouseCloseEvent);
            $(window).unbind("resize", resizePlayer);
            $(window).unbind('popstate', popState);
        }

        function closePlayer() {
            if (window.history && window.history.pushState) {
                window.history.back();
            } else {
                unbindAndClose();
            }
        }

        if (window.history && window.history.pushState) {
            $(window).on('popstate', popState);
            window.history.pushState('forward', null, '#previewslide');
        }



        function resizePlayer () {
            $wrap.css({'max-width': playerMaxWidth + 'px'});
            // Since video iframes have 0 width.. 
            var ww =  $(window).width(),
                w = ww < playerMaxWidth ? ww : playerMaxWidth;
            // Deal with iframes...
            $wrap.width(w);

            $wrap.css({
                'margin-top': -($wrap.height()/2) + 'px'
            }); 
            if ($(document).width() > $wrap.width()) {
                $wrap.css({
                    'left': '50%',
                    'margin-left': -($wrap.width()/2) + 'px'
                });
            } else {
                $wrap.css({
                    'left': '0',
                    'margin-left': '0px'
                });
            }
        }
        resizePlayer();

        // We use setTimeout because else the click fires at first when we try open
        // the player - which is not correct, so move it back in callstack..
        setTimeout(function() { $(document).on('click', mouseCloseEvent);}, 1);
        $(document).keyup(closeEvent);
        $(window).resize(resizePlayer);
    }


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

            // Player max width when clicking on images / video thumbnails.
            // Will be scaled down when in mobile view etc.
            // Effective when screens are larger then 800 width!
            playerMaxWidth: 800,

            // Zooms to center if images was cropped, false to disable
            zoomCenter: true,

            // Kaltura video adapter options. Set the correct partner ID and kalturaPortal name.
            kaltura: {
                // Your unique partner ID, see https://knowledge.kaltura.com/embedding-kaltura-media-players-your-site
                partnerId: '1484431',
                // for an actual player id, see https://knowledge.kaltura.com/embedding-kaltura-media-players-your-site
                uiconfId: '28551341',
                // Where are your videos located? This will be used to replace video urls to actual preview images.
                kalturaPortal: 'https://uia.mediaspace.kaltura.com',
                // Image url, only change if kaltura changed format of thumbnail API.
                imageUrl: 'http://www.kaltura.com/p/{partner_id}/thumbnail/entry_id/{entry_id}?src_h=1080&width=1920', // src_x=0&src=y=0&src_w=1920&
                embedArgs: 'iframeembed=true&playerId=kplayer&entry_id={entry_id}&flashvars[streamerType]=auto'
            }
        };

        // This is the easiest way to have default options.
        var settings = $.extend(defaultSettings, options);


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
            },
            embed: function (url) {
                var id = this.videoId(url);
                var $iframe = $('<iframe src="" width="560" height="395" allowfullscreen webkitallowfullscreen mozAllowFullScreen frameborder="0"></iframe>');               
                $iframe.attr('src', '//cdnapi.kaltura.com/p/'+settings.kaltura.partnerId+'/sp/'+settings.kaltura.partnerId+'00/embedIframeJs/uiconf_id/' + settings.kaltura.uiconfId + 
                                    '/partner_id/'+settings.kaltura.partnerId+'?' + settings.kaltura.embedArgs.replace('{entry_id}', id));
                return $iframe;
            }
        };

        // Allow to add video adapters (and override ).
        _videoAdapters = $.extend(_videoAdapters, settings.videoAdapters);



        this.each(function () {
            slideshowIterator++;
            var $el = $(this);

            var id = "part-slider-" + slideshowIterator,
                cycleInitialized = false,
                shouldHaveHeight = 0,
                shouldHaveWidth = 0;

            $el.prop('id', id);

            // Wrap object in some more appropriate divs.
            var $cycleWrapper = $('<div class="part-slider-container">'+
                '<div class="part-slider-inner">'+
                '<div class="slideshow" data-cycle-fx=carousel data-cycle-timeout=0 data-cycle-carousel-visible=1>'+
                '</div>'+
                '<a href="#" class="cycle-next"><span class="cycle-next-icon"></span></a>' +
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


            $el.on('click','.slide a[data-modal]', function (e) {
                e.preventDefault();
                var $a = $(this), $slide = $a.parents('.slide');
                createPlayerContainer($el, $slide, $a, settings.playerMaxWidth);
            });



            // For responsiveness.
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

                var $slides = $el.find('.part-slider-inner .slide');
                $slides.css(css);

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
                        scaleImg($(this), shouldHaveWidth, shouldHaveHeight, settings.zoomCenter);
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

            $el.on( 'cycle-next', function( event, opts ) {
                $el.find('.slide img').each(function () {
                    scaleImg($(this), shouldHaveWidth, shouldHaveHeight, settings.zoomCenter);
                });
            });

            if (settings.aspectRatio) {
                $el.find('.slide img').load(function () {
                    scaleImg($(this), shouldHaveWidth, shouldHaveHeight, settings.zoomCenter);
                });
            }

        });


    };

}( jQuery ));
