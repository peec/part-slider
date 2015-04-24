(function ( $ ) {


    /**
     * Iterator for every slideshow spawned on the page..
     */
    var slideshowIterator = 0;


    /**
     * Built in Video Adapters to allow embeding videos as slides.
     */
    var _videoAdapters = {

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
                if(ampersandPosition != -1) {
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


    /**
     * Scales an image based on what dimensions it should have, and centeres it perfectly. This means that images
     * with the wrong aspect ratio also will be displayed just fine.
     *
     * @param $img
     * @param shouldHaveWidth
     * @param shouldHaveHeight
     * @param zoomCenter
     */
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


    /**
     * Player is a modal with transparent background and opacity background effect.
     * Used to pop out images and videos in large sizes when clicked.
     */
    var Player = (function () {

        //
        // PRIVATE API
        //


        /**
         * Fills modal with DOM from the slide or if its a video, the embed player.
         * @constructor
         */
        var FillModal = function () {
            var that = this,
                $o;
            if (that.$slide.hasClass('video')) {
                var $links = that.$a;

                if ($links.length) {
                    $links.each(function () {
                        var $link = $(this);
                        $.each(_videoAdapters, function (index, item) {
                            var url = $link.attr('href');
                            if (item.match(url)) {
                                that.$slide.data('videoadapter', index);
                            }
                        });

                    });
                }

                if (!that.$slide.data('videoadapter')) {
                    console.error("No video adapter was assigned to slide (empty adapter in data attribute).");
                    return;
                }
                if (typeof _videoAdapters[that.$slide.data('videoadapter')].embed === 'undefined') {
                    console.error("Video player for adapter '" + that.$slide.data('videoadapter') + "' was not found. Please implement the 'embed' key in the adapter.");
                    return;
                } else {
                    var $iframe = _videoAdapters[that.$slide.data('videoadapter')].embed(that.$a.attr('href'));
                    $o = $('<div class="part-slider-video-wrapper"></div>');
                    $o.html($iframe);
                }
            } else {
                var $img = that.$slide.find('img');
                $o = $('<img />');
                $o.attr('src', $img.attr('src'));
            }
            var $wrap = $('<div class="part-slider-overlay-inner"></div>');
            $wrap.append($o);

            // Append .info's if any.
            var $infos = that.$slide.find('.info').clone(false);
            if ($infos.length) {
                $wrap.append($infos);
            }
            // Add the wrap object to the players inner part.
            var html = $wrap;
            var $el = $('<div class="part-slider-overlay part-slider-player"></div>').html(html);
            that.$container.append($el);
        };


        /**
         * Events
         * @returns {{mouseCloseEvent: Function, closeEvent: Function, popStateEvent: Function, resize: Function, bind: Function, unbind: Function}}
         * @constructor
         */
        var Events = function () {
            var that = this;


            function requestClose () {
                if (window.history && window.history.pushState) {
                    window.history.back();
                } else {
                    that.destroy();
                }
            }

            return {
                mouseCloseEvent: function(event) {
                    if (!$(event.target).closest('.part-slider-overlay-inner').length) {
                        requestClose();
                    }
                },
                closeEvent: function(e) {
                    if (e.keyCode == 27) {
                        requestClose();
                    }
                },
                popStateEvent: function() {
                    var hashLocation = location.hash;
                    var hashSplit = hashLocation.split("#!/");
                    var hashName = hashSplit[1];

                    if (hashName !== '') {
                        var hash = window.location.hash;
                        if (hash === '') {
                            that.destroy();
                        }
                    }
                },
                resize: function () {
                    var $wrap = that.$container.find('.part-slider-overlay-inner');

                    $wrap.css({'max-width': that.playerMaxWidth + 'px'});
                    // Since video iframes have 0 width..
                    var ww =  $(window).width(),
                        w = ww < that.playerMaxWidth ? ww : that.playerMaxWidth;
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
                },
                bind: function () {
                    var eventThat  = this;
                    // We use setTimeout because else the click fires at first when we try open
                    // the player - which is not correct, so move it back in callstack..
                    setTimeout(function() { $(document).on('click', eventThat.mouseCloseEvent);}, 1);
                    $(document).keyup(this.closeEvent);
                    $(window).resize(this.resize);

                    if (window.history && window.history.pushState) {
                        $(window).on('popstate', this.popStateEvent);
                        window.history.pushState('forward', null, '#previewslide');
                    }

                },
                unbind: function() {
                    $(document).unbind("keyup", this.closeEvent);
                    $(document).unbind("click", this.mouseCloseEvent);
                    $(window).unbind("resize", this.resize);
                    $(window).unbind('popstate', this.popStateEvent);
                }
            };
        };

        return function ($container, $slide, $a, playerMaxWidth) {
            this.$container = $container;
            this.$slide = $slide;
            this.$a = $a;
            this.playerMaxWidth = playerMaxWidth;

            var events = Events.apply(this);

            this.destroy = function  () {
                events.unbind();
                this.$container.find('.part-slider-player').remove();
            };

            this.play = function  () {
                this.destroy();
                FillModal.apply(this);
                events.resize();
                events.bind();
            };
        };
    })();






    $.fn.partSlideshow = function( options ) {

        /**
         * Default settings.
         */
        var defaultSettings = {

            // How many slides to show at the time.
            visibleSlides: 3,

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

        // Allow to add video adapters (and override ).
        _videoAdapters = $.extend(_videoAdapters, settings.videoAdapters);

        // Check for videoAdapters as callables, call these with supplied settings..
        $.each(_videoAdapters, function (index, adapter) {
            if (typeof adapter === 'function') {
                _videoAdapters[index] = adapter.call({}, settings);
            }
        });


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
            $cycleWrapper.find('.slideshow').html($el.clone(false).html());
            $el.empty();


            $cycleWrapper.find('.part-slider-inner .slide.video').each(function () {
                var $slide = $(this);
                var $overlay = $('<div class="slide-play"><span class="fa-stack fa-4x slide-icon-size"><i class="fa fa-circle fa-stack-2x slide-icon-background"></i><i class="fa fa-play fa-stack-1x slide-icon"></i></span></div>');
                $slide.find("a").append($overlay);
            });

            var thumbnailPromises = [];
            // Video embed
            // Preprocess slides
            $cycleWrapper.find('.slide').each(function () {
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
                                    thumbnailPromises.push(item.image(url, $link));
                                }
                            }
                        });

                    });
                }
            });



            $.when.apply($,thumbnailPromises).then(function() {

                var copy = $cycleWrapper.clone(false);

                // For responsiveness.
                function resizeSlides () {

                    // Free up mem.
                    if ($el.find('.slideshow').length) {
                        $el.find('.slideshow').cycle('destroy');
                    }

                    $el.html(copy.clone(false));

                    if (settings.aspectRatio) {
                        $el.find('.slide img').load(function () {
                            scaleImg($(this), shouldHaveWidth, shouldHaveHeight, settings.zoomCenter);
                        });
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

                    $el.trigger('part-slider:initialized');

                }

                resizeSlides();

                $el.on( 'cycle-next', function( event, opts ) {
                    $el.find('.slide img').each(function () {
                        scaleImg($(this), shouldHaveWidth, shouldHaveHeight, settings.zoomCenter);
                    });
                });

                $(window).resize(resizeSlides);
            });


            var playerEvent = function (e) {
                e.preventDefault();
                var $a = $(this), $slide = $a.parents('.slide');
                new Player($el, $slide, $a, settings.playerMaxWidth).play();
            };

            $el.on('click','.slide a[data-modal]', playerEvent);




        });


    };

}( jQuery ));
