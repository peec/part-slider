# Part Slider

[![Build Status](https://travis-ci.org/peec/part-slider.png?branch=master)](https://travis-ci.org/peec/part-slider)


A slideshow plugin for jQuery, minimal effort to get it working.

**Why is it named Part Slider**

The idea is to have a slideshow that shows X amount of images, the last one is "partly" showed so the user is tempted
to click on the Next arrow to see more.


## HOW DOES IT LOOK:

You may take a look (by default)?: See [This screenshot](https://raw.github.com/peec/part-slider/master/example/images/screenshot.png).


### FEATURES

- Advanced slideshow that shows parts of images on the sides.
- Supports: youtube, vimeo vids.
- Extensible: customize cycle2 options, add video adapters to support more movies!
- Allows to use another thumbnail then the vimeo / youtube onces.
- Modular design
- Responsive.
- Built on top of cycle2.
- Simple HTML syntax

### SUPPORTED VIDEO ADAPTERS

- YouTube
- Vimeo
- Kaltura



### DEPENDENCIES

- JQuery
- Cycle2
- Font-awesome


### INSTALLATION:

**Install via bower:**

```
bower install jquery-partslider
```

Include libraries in your HTML head section:

```html
    <script src="../bower_components/jQuery/dist/jquery.min.js"></script>
    <script src="../bower_components/jquery-cycle2/build/jquery.cycle2.js"></script>
    <script src="../bower_components/jquery-cycle2/build/plugin/jquery.cycle2.carousel.min.js"></script>
    <script src="../bower_components/jquery-cycle2/build/plugin/jquery.cycle2.swipe.min.js"></script>
    <link rel="stylesheet" href="../bower_components/components-font-awesome/css/font-awesome.min.css">
    <script src="../dist/jquery.partslider.js"></script>
    <link rel="stylesheet" href="../dist/jquery.partslider.css" type="text/css" />
```


**Install manually:**

1. Download this repository via git or zip.
1. Include jQuery and Cycle2 + Cycle2 Carousel plugin .
1. Include dist/jquery.partslider.min.css and dist/jquery.partslider.min.js.



## DOCUMENTATION


### The HTML

Slider container should have the class `part-slider` to inherit the standard styles.

```
<div class="part-slider" id="my-id">
</div>
```



**Adding image slides that can be opened in a modal.**

```
<div class="part-slider" id="my-id">
    <div class="slide">
        <a data-modal href="images/1.jpg">
            <img src="images/1.jpg">
        </a>
    </div>
</div>
```


- All slides are wrapped in a div with the class `slide`.
- Notice the `data-modal` on the `a`-tag this tells part-slider to open the href in a modal.


**Showing info on the slide (overlay)**

```
<div class="slide">
    <a data-modal href="images/1.jpg">
        <img src="images/1.jpg">

        <div class="info">
            <p>Hello World!</p>
        </div>
    </a>
</div>
```

- Add info overlay by using `.info` class.


**Adding a youtube video, with thumbnail from the video itself**


```
<div class="slide video">
    <a data-modal href="https://www.youtube.com/watch?v=sZ6JjgYLick">
    </a>
</div>
```

- Videos should have class `slide video`
- href should be the direct link to the video.
- `data-modal` lets the user play the video when its clicked.


**Adding a youtube video, with a custom thumbnail**


```
<div class="slide video">
    <a data-modal href="https://www.youtube.com/watch?v=sZ6JjgYLick">
        <img src="images/1.png" />
    </a>
</div>
```

- The thumbnail is now custom and not from the youtube video itself. Good if you want to customize the thumbnails.



### JavaScript Options


You can initialize a slideshow easily:


```
<script>
    $(function () {
        $('.part-slider').partSlideshow({
            visibleSlides: 3, // How many slides to show in slider..
            aspectRatio: 4/3  // e.g. 4/3 or 16/9 etc.
        });
    });
</script>
```

Available options:


```
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
    },

    // Stretches left / right to a containers element.
    stretchToContainer: false
};

```




#### Kaltura support

For kaltura support you will need to customize the options to your kaltura portal. If you don't have access to the
admin dashboard you can easily get all these details from the kaltura portal by inspecting the source code.

```
<script>
$(function () {
    $('.part-slider').partSlideshow({
        visibleSlides: 3,
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
    });
});
</script>
```

#### Adding custom video adapters

You can add video adapters to support more video providers then the built in onces. Adding these are pretty simple.


This is an example of how to forexample override the vimeo adapter.

```
var MyCustomAdapters = {
    vimeo: {
        regex: /\/\/(?:www\.)?vimeo.com\/([0-9a-z\-_]+)/i,
        // Required function.
        // Should return true if this adapter should be used for the specific video URL. See regex above for example.
        match: function (url) {
            return url.match(this.regex);
        },
        // Required function.
        // Task: append <img> tag to $link jqueryObject, based on the "url" of the video.
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
        // Required function.
        // Task: Return JQuery Object that consist of an iframe. Should return it based on "url" of the video.
        embed: function (url) {
            var video_id = this.videoId(url);
            return $('<iframe src="//player.vimeo.com/video/'+video_id+'" width="560" height="315" frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen></iframe>');
        },
        videoId: function (url) {
            var matches = this.regex.exec(url);
            return matches && matches[1];
        }
    }
};


// Initialize your slideshow with videoAdapters argument.
$('.part-slider').partSlideshow({
    videoAdapters: MyCustomAdapters
});

```


#### Responsive slide elements

Add custom size adapters to customize how many visible slides it should be per screen width.

```

<script>
    $(function () {
        $('.part-slider').partSlideshow({
            visibleSlides: 3, // How many slides to show in slider..
            // Adapters overrides visibleSlides if match is true.
            visibleSlidesAdapters: [
                {match: function(screenWidth){ return screenWidth < 620 && w screenWidth 300; }, slides: 1}
            ]
        });
    });
</script>

```


#### Manual refresh of slideshow

If you resize the slideshow manually with some javascript after page initialization, you will need to refresh the slideshow dimension and calculations.

Use the `refresh` command like so.

```javascript
// Do some resizing of .part-slideshow
$('.part-slider').partSlideshow("refresh");
```


