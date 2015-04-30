(function ($) {
    'use strict';



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

        var h = $img.height(), w = $img.width(), diff;
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
                diff = -($img.height() - shouldHaveHeight);
                $img.css({'margin-top': (diff/2)+'px'});
            }

            if ($img.width() > shouldHaveWidth) {
                diff = -($img.width() - shouldHaveWidth);
                $img.css({'margin-left': (diff/2)+'px'});
            }
        }
    }


    $.fn.partSlideshow.Slideshow = (function () {

        function prepareDOM ($el) {
            // Wrap object in some more appropriate divs.
            var $cycleWrapper = $('<div class="part-slider-container">'+
                '<div class="part-slider-inner">'+
                '<div class="slideshow" data-cycle-fx=carousel data-cycle-timeout=0 data-cycle-carousel-visible=1>'+
                '</div>'+
                '<a href="#" class="cycle-prev"><span class="cycle-prev-icon"></span></a>' +
                '<a href="#" class="cycle-next"><span class="cycle-next-icon"></span></a>' +
                '</div></div>');
            $cycleWrapper.find('.slideshow').html($el.clone(false).html());
            $el.empty();


            $cycleWrapper.find('.part-slider-inner .slide.video').each(function () {
                var $slide = $(this);
                var $overlay = $('<div class="slide-play">' +
                    '<span class="slide-icon-size">' +
                    '<i class="slide-icon"></i>' +
                    '</span></div>');
                $slide.find("a").append($overlay);
            });

            return $cycleWrapper;
        }

        function requestThumbnails ($cycleWrapper) {
            var thumbnailPromises = [];
            // Video embed
            // Preprocess slides
            $cycleWrapper.find('.slide').each(function () {
                var $slide = $(this),
                    $links = $slide.find('a');

                if ($links.length) {
                    $links.each(function () {
                        var $link = $(this);
                        $.each($.fn.partSlideshow.adapters, function (index, item) {
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
            return thumbnailPromises;
        }



        return function ($el, settings, slideshowIterator) {


            var id = "part-slider-" + slideshowIterator,
                cycleInitialized = false,
                shouldHaveHeight = 0,
                shouldHaveWidth = 0,
                copy,
                visibleSlides = settings.visibleSlides;

            var Events = {
                playerEvent: function (e) {
                    e.preventDefault();
                    var $a = $(this), $slide = $a.parents('.slide');
                    new $.fn.partSlideshow.Player($el, $slide, $a, settings.playerMaxWidth).play();
                },
                cycleScaleImages: function( ) {
                    $el.find('.slide img').each(function () {
                        scaleImg($(this), shouldHaveWidth, shouldHaveHeight, settings.zoomCenter);
                    });
                },
                cycleNext: function (event, opts) {
                    // console.log(opts.slideCount + " - " + opts.nextSlide);
                    // console.log(opts.currSlide+visibleSlides);
                    if (opts.carouselVisible && !opts.allowWrap) {

                        if (opts.currSlide === 0) {
                            $el.find('.cycle-prev').hide();
                        } else {
                            $el.find('.cycle-prev').show();
                        }
                        if (opts.currSlide+visibleSlides > opts.slideCount) {
                            $el.find('.cycle-next').hide();
                        } else {
                            $el.find('.cycle-next').show();
                        }
                    } else {
                        $el.find('.cycle-prev').show();
                    }
                },
                resizeSlides:  function (triggerEvent) {

                    // Free up mem.
                    if ($el.find('.slideshow').length) {
                        $el.find('.slideshow').cycle('destroy');
                    }

                    $el.html(copy.clone(false));

                    visibleSlides = settings.visibleSlides;
                    // Calc visible slides adapter..
                    $.each(settings.visibleSlidesAdapters, function (index, adapter) {
                        if (adapter.match($(window).width())) {
                            visibleSlides = adapter.slides;
                        }
                    });

                    // Set width on the containeroverflow unit.
                    if (settings.teaserSlidePercent) {
                        var containerOverflowWidth = ($el.width() + (($el.width() / visibleSlides) * (settings.teaserSlidePercent / 100)));
                        $el.find('.part-slider-container').css({width: containerOverflowWidth + "px"});
                    }

                    // Find out what width per slide.
                    shouldHaveWidth = $el.find('.part-slider-container').outerWidth(true) / visibleSlides;

                    var css = {
                        width: shouldHaveWidth + 'px'
                    };

                    if (settings.aspectRatio) {
                        shouldHaveHeight = shouldHaveWidth / settings.aspectRatio;
                        css['height'] = parseInt(shouldHaveHeight, 10) + 'px';
                    }

                    // Lets find all the slides.
                    var $slides = $el.find('.part-slider-inner .slide');

                    // Set fixed width / heights on each slide. They should all have equal heights.
                    $slides.css(css);

                    // Align play icon on vids.
                    $el.find('.part-slider-inner .slide-play').css({
                        'margin-top': - ($el.find('.part-slider-inner .slide.video .slide-play').height()/2) + 'px'
                    });

                    // Init CYCLE
                    var cycleOpts = $.extend({
                        slides: '> .slide:not(.static)',
                        next: '#'+id+' .cycle-next',
                        prev: '#'+id+' .cycle-prev',
                        log: false,
                        autoWidth: 0
                    }, settings.cycleOptions);

                    if (!settings.rotate) {
                        cycleOpts = $.extend(cycleOpts, {
                            allowWrap: false,
                            carouselVisible: visibleSlides - 1
                        });
                    }

                    $el.find('.slideshow').cycle(cycleOpts);

                    // If cycle was initied, scale images.
                    if (cycleInitialized && settings.aspectRatio) {
                        $el.find('.slide img').each(function () {
                            scaleImg($(this), shouldHaveWidth, shouldHaveHeight, settings.zoomCenter);
                        });
                    }

                    // Yes its now done.
                    cycleInitialized = true;


                    // When images are loaded, scale them and crop.
                    if (settings.aspectRatio) {
                        $el.find('.slide img').load(function () {
                            scaleImg($(this), shouldHaveWidth, shouldHaveHeight, settings.zoomCenter);
                        });
                    }

                    if (triggerEvent !== "notrigger") {
                        $el.trigger('part-slider:refresh');
                    }
                },
                containerStretchCycleNext: function () {
                    var windowW = $('body').innerWidth(), sW = settings.stretchToContainer.width();
                    var m = -((windowW - sW) / 2);
                    $el.css({'padding-left': -m + 'px'}); // note positive (-- = + )....
                    $el.css({'margin-left': m + 'px'});
                },
                containerStretchEventRefresh: function () {
                    var windowW = $('body').innerWidth(), sW = settings.stretchToContainer.width();
                    var m = -((windowW - sW) / 2);
                    $el.css({'margin-right': m + 'px'});


                    $el.partSlideshow('refresh');

                    var paddingRight = m;
                    if (paddingRight >= -25 && paddingRight <= 25) {
                        paddingRight = -25;
                    }


                    // Call-stack move back or it will fail..
                    setTimeout(function () { $el.find('.cycle-next').css({'padding-right': (-(paddingRight)) + 'px'}); }, 1);
                    setTimeout(function () { $el.find('.cycle-prev').css({'padding-left': (-(m)) + 'px'}); }, 1);
                },
                bind: function () {
                    // Listen on events.
                    $el.on( 'cycle-next', Events.cycleScaleImages);
                    $el.on( 'cycle-next', Events.cycleNext);
                    $el.on( 'cycle-prev', Events.cycleNext);
                    $el.on( 'cycle-prev', Events.cycleScaleImages);
                    $(window).resize(Events.resizeSlides);
                    $el.on('click','.slide a[data-modal]', Events.playerEvent);

                    if (settings.stretchToContainer) {
                        $(document).on('cycle-next','.part-slider .slideshow', Events.containerStretchCycleNext);
                        $el.on('part-slider:refresh', Events.containerStretchEventRefresh);
                        $el.css({'width': 'auto'});
                    }
                }
            };

            return {
                start: function  () {
                    $el.prop('id', "part-slider-" + slideshowIterator);

                    var $cycleWrapper = prepareDOM($el);
                    var thumbnailPromises = requestThumbnails($cycleWrapper);

                    $.when.apply($,thumbnailPromises).then(function () {
                        copy = $cycleWrapper.clone(false);
                        Events.resizeSlides();
                        // Triger custom event.
                        $el.trigger('part-slider:initialized');
                    });
                    Events.bind();
                },
                refresh: function  () {
                    Events.resizeSlides("notrigger");
                },
                stop: function () {
                    // todo
                    // hardly necessary but could be..
                }
            };
        };
    })();

})(jQuery);