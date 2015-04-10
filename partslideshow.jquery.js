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
                        console.log($link);
                    }
                });
            }
        }
    };




    $.fn.partSlideshow = function( options ) {

        // This is the easiest way to have default options.
        var settings = $.extend({
            visibleSlides: 3,
            videoAdapters: [],
            cycleOptions: {}
        }, options );
        _videoAdapters = $.extend(_videoAdapters, settings.videoAdapters);




        this.each(function () {
            slideshowIterator++;
            var $el = $(this);

            var id = "part-slider-" + slideshowIterator;

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



            function resizeSlides () {
                $el.find('.slideshow').cycle('destroy');
                $el.find('.part-slider-inner .slide').css({
                    width: ($('.part-slider-container').outerWidth(true) / settings.visibleSlides) + 'px'
                });

                $el.find('.part-slider-inner .slide-play').css({
                    'margin-top': - ($el.find('.part-slider-inner .slide.video .slide-play').height()/2) + 'px'
                })

                $el.find('.slideshow').cycle($.extend({
                    slides: '> .slide',
                    next: '#'+id+' .cycle-next'
                }, settings.cycleOptions));
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
        });


    };

}( jQuery ));
