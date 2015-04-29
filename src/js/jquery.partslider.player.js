(function ($) {
    'use strict';

    /**
     * Player is a modal with transparent background and opacity background effect.
     * Used to pop out images and videos in large sizes when clicked.
     */
    $.fn.partSlideshow.Player = (function () {

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
                        $.each($.fn.partSlideshow.adapters, function (index, item) {
                            var url = $link.attr('href');
                            if (item.match(url)) {
                                that.$slide.data('videoadapter', index);
                            }
                        });

                    });
                }

                if (!that.$slide.data('videoadapter')) {
                    if (console) {
                        console.log("No video adapter was assigned to slide (empty adapter in data attribute).");
                    }
                    return;
                }
                if (typeof $.fn.partSlideshow.adapters[that.$slide.data('videoadapter')].embed === 'undefined') {
                    console.error("Video player for adapter '" + that.$slide.data('videoadapter') + "' was not found. Please implement the 'embed' key in the adapter.");
                    return;
                } else {
                    var $iframe = $.fn.partSlideshow.adapters[that.$slide.data('videoadapter')].embed(that.$a.attr('href'));
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
                    if (e.keyCode === 27) {
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

})(jQuery);