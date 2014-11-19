var api;

jQuery(function($) {

    /* ============================================================ */
    /* Responsive Videos */
    /* ============================================================ */

    $(".post-content").fitVids();

    /* ============================================================ */
    /* Scroll To Top */
    /* ============================================================ */

    $('.js-jump-top').on('click', function(e) {
        e.preventDefault();

        $('html, body').animate({'scrollTop': 0});
    });

    /* ============================================================ */
    /* Ajax Loading */
    /* ============================================================ */

    var History = window.History;
    var loading = false;
    var showIndex = false;
    var $ajaxContainer = $('#ajax-container');
    var $latestPost = $('#latest-post');
    var $postIndex = $('#post-index');

    // Initially hide the index and show the latest post
    $latestPost.show();
    //$postIndex.hide();

    // Show the index if the url has "page" in it (a simple
    // way of checking if we're on a paginated page.)
    /*if (window.location.pathname.indexOf('page') === 1 || window.location.pathname.indexOf('tag') === 1) {
        $latestPost.hide();
        $postIndex.show();
    }*/

    // Check if history is enabled for the browser
    if ( ! History.enabled) {
        return false;
    }

    History.Adapter.bind(window, 'statechange', function() {
        var State = History.getState();

        // Get the requested url and replace the current content
        // with the loaded content
        $.get(State.url, function(result) {
            var $html = $(result);
            var $newContent = $('#ajax-container', $html).contents();

            // Set the title to the requested urls document title
            document.title = $html.filter('title').text();

            $('html, body').animate({'scrollTop': 0});

            $ajaxContainer.fadeOut(500, function() {
                /*$latestPost = $newContent.filter('#latest-post');
                $postIndex = $newContent.filter('#post-index');

                if (showIndex === true) {
                    $latestPost.hide();
                } else {
                    $latestPost.show();
                    $postIndex.hide();
                }*/

                // Re run fitvid.js
                $newContent.fitVids();

                $ajaxContainer.html($newContent);
                moveImagesToGallery();
                $ajaxContainer.fadeIn(500);

                NProgress.done();
                

                loading = false;
                showIndex = false;
            });
        });
    });

    $('body').on('click', '.js-ajax-link, .pagination a, .post-tags a, .post-header a', function(e) {
        e.preventDefault();

        if (loading === false) {
            var currentState = History.getState();
            var url = $(this).attr('href');
            var title = $(this).attr('title') || null;

            $('.post-list .active').removeClass('active');
            $(e.target).addClass('active');

            // If the requested url is not the current states url push
            // the new state and make the ajax call.
            if (url !== currentState.url.replace(/\/$/, "")) {
                loading = true;

                // Check if we need to show the post index after we've
                // loaded the new content
                if ($(this).hasClass('js-show-index') || $(this).parent('.pagination').length > 0) {
                    showIndex = true;
                }

                NProgress.start();

                History.pushState({}, title, url);
            } else {
                // Swap in the latest post or post index as needed
                if ($(this).hasClass('js-show-index')) {
                    $('html, body').animate({'scrollTop': 0});

                    NProgress.start();

                    $latestPost.fadeOut(300, function() {
                        $postIndex.fadeIn(300);
                        NProgress.done();
                    });
                } else {
                    $('html, body').animate({'scrollTop': 0});

                    NProgress.start();

                    $postIndex.fadeOut(300, function() {
                        $latestPost.fadeIn(300);
                        NProgress.done();
                    });
                }
            }
        }
    });
    
    if ( location.pathname !== '/' ) {
        $('#site-canvas > menu').load('/ #site-canvas > menu > li', function() {
            rigEverything();
        });
    }else{
        rigEverything();
    }
    
    function rigEverything(){
        moveImagesToGallery();
        hookImageButtons();
        
        // Toggle Nav or Comments on Click
        $('.toggle-nav').on('tap',function() {
            toggleNav();
        });
        
        $('.toggle-comment').on('tap',function() {
            toggleComment();
        });
        
        // Make sidebar images black and white
        $('.post-list img').each( function (i, image) {
            setBlackAndWhite($(image));
        });
        
        // Make sidebar scrollbar function properly    
       resizePostBar(); //Init scrollbar
        var scrollPane = $('.scroll-pane').jScrollPane(
    		{
                mouseWheelSpeed: 50
    		}
    	);
    	
        api = scrollPane.data('jsp');
        $( window ).load(function() {
            setTimeout(reinitialiseScrollBar, 100);
        });
        
        var debounce;
        $(window).on('resize', function(){ //re-init scrollbar on resizing
            resizePostBar();
            clearTimeout(debounce);
            debounce = setTimeout(reinitialiseScrollBar, 500);
        });
    }
});

    
    
/*========================================
=            CUSTOM FUNCTIONS            =
========================================*/
function toggleNav() {
    
    $('#wrapper').removeClass('show-comments');
    
    if ($('#wrapper').hasClass('show-nav')) {
        $('#wrapper').removeClass('show-nav');
    } else {
        $('#wrapper').addClass('show-nav');
    }
}

function toggleComment() {
    
    $('#wrapper').removeClass('show-nav');
    
    if ($('#wrapper').hasClass('show-comments')) {
        $('#wrapper').removeClass('show-comments');
    } else {
        $('#wrapper').addClass('show-comments');
    }
}
    
function resizePostBar(){
    var windo = $(this); //this = window
    if ($('#site-canvas').width() >= 501) {
        $('#site-canvas').css('height', (windo.height()-62) + 'px');
    }
}
    
function setBlackAndWhite(image){
    var bnbImage = image.clone();
    
    //bnbImage.attr('src', image.attr('src'));
    bnbImage.attr('class', 'bnb-image');
    bnbImage.insertAfter( image );
    image.css('opacity',1);
}

function reinitialiseScrollBar(){
    api.reinitialise();
    $('.post-list .jspPane').css('width','264px');
}

function hookImageButtons(){
    var gallery = $('section.gallery-content');
    var items = gallery.children().length - 1;
    if(gallery.length){
        var buttons = $('#image-menu > div i');
        var currentPosition = 0;
        
        buttons.on('tap',function(event){
            console.log(items);
            if($(event.target).hasClass('previous')){
                currentPosition !== 0 ? (currentPosition += -1) : 0;
            }else{
                currentPosition !== (items) ? (currentPosition += 1) : (items);
            }
            gallery.css('top', (currentPosition * -100) + '%');
        });
        
    }
}

function moveImagesToGallery(){
    var post = $('#ajax-container  footer > div.gallery-description');
    var images = post.find('img');
    var gallery = $('#ajax-container section.gallery-content');
    images.each(function(i, image){
        var imageDiv = $(document.createElement('div'));
        imageDiv.css({
            backgroundSize: 'cover',
            backgroundImage: 'url('+image.getAttribute('src')+')',
            backgroundRepeat: 'no-repeat',
        });
        if(image.hasAttribute('alt') && image.getAttribute('alt').contains('focus')){
            var alt = image.getAttribute('alt');
            var n = alt.indexOf("focus");
            var p = alt.indexOf("%",alt.indexOf("%",n)+1);
            imageDiv.css(
                'background-position', alt.substring(n+6,p+1).replace('x',' ')
            );
        }
        imageDiv.attr({
            title: image.getAttribute('alt'),
            class: 'image'
        });
        image.remove();
        gallery.append(imageDiv);
    });
    
}