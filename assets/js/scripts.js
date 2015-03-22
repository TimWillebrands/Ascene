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

    $('body').on('tap', '.js-ajax-link, .pagination a, .post-tags a, .post-header a, .about-btn a', function(e) {
        e.preventDefault();

        if (loading === false) {
            var currentState = History.getState();
            var url = $(this).attr('href');
            var title = $(this).attr('title') || null;
            

            // If the requested url is not the current states url push
            // the new state and make the ajax call.
            if (!(currentState.url.indexOf(url) > -1)) {
            //if (url !== currentState.url.replace(/\/$/, "")) { // Old unreliable test from legacy code
                loading = true;

                $('.post-list .active').removeClass('active');
                
                var newActiveButton = $(e.target).closest('li');
                newActiveButton.addClass('active');
                
                if (newActiveButton.hasClass('about-btn')){
                    setActiveNavBarButton($("#about"));
                }else if(newActiveButton.hasClass('tag-gallery')){
                    setActiveNavBarButton($("#gallery"));
                }else{ // Assume its a blog? D:
                    setActiveNavBarButton($("#blog"));
                }
                
                if(url.substring(0,8)=="/author/"){
                    $('#site-comments').css('display','none');
                }else{
                    $('#site-comments').css('display','block');
                    $(".fb-comments").attr('data-href', window.location.protocol + "//" + window.location.host + url);
                    FB.XFBML.parse();  
                }
                // Check if we need to show the post index after we've
                // loaded the new content
                if ($(this).hasClass('js-show-index') || $(this).parent('.pagination').length > 0) {
                    showIndex = true;
                }

                NProgress.start();

                History.pushState({}, title, url);
            } /*else { // Legacy code
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
            }*/
        }
    });
    
    if ( location.pathname !== '/' ) { // If not bare url
        $('#site-canvas > menu').load('/ #site-canvas > menu.post-list > li', function() {//Load postbar from main page into gblog/gallery pages, ugly hack
            rigEverything();
            var itemType = $("meta[name='item-type']").attr("content");
            var itemUrl = $("meta[name='item-url']").attr("content");
            if(itemUrl)
                $("a[href='"+itemUrl+"']").parent().addClass("active");
                
            togglePostBarMode(null,itemType);
        });
    }else{
        rigEverything();
    }
    
    function rigEverything(){
        moveImagesToGallery();
        togglePostBarMode();
        
        // Toggle Nav or Comments on Click
        $('.toggle-nav').on('tap',toggleNav);
        $('.toggle-comment').on('tap',toggleComment);
        
        $('.nav-btn').on('tap',function(tap){
            togglePostBarMode(tap);
            toggleNav(true);
        });
        
        // Make sidebar images black and white
        $('.post-list img').each( function (i, image) {
            setBlackAndWhite($(image));
        });
        
        // Make sidebar scrollbar function properly    
        if (window.matchMedia('(min-width: 741px)').matches){ //If in desktop-mode
            resizePostBar(); //Init scrollbar
            /*var scrollPane = $('.scroll-pane').jScrollPane(
        		{
                    mouseWheelSpeed: 50
        		}
        	);
        	
            api = scrollPane.data('jsp');*/
            $( window ).load(function() { //Doesnt fire
                setTimeout(reinitialiseScrollBar, 100);
                $(".scroll-pane").scroller({
                	customClass: "advanced",
                	handleSize: 40
                });
                for (var i = 1; i <= 10; i++) { 
                    setTimeout(reinitialiseScrollBar, i*150);
                }
            });
            /*(function() {
                setTimeout(reinitialiseScrollBar, 100);
                $(".scroll-pane").scroller({
                	customClass: "advanced",
                	trackMargin: 5,
                	handleSize: 40
                });
                for (var i = 1; i <= 10; i++) { 
                    setTimeout(reinitialiseScrollBar, 1*100);
                }
            })();*/
            
            var debounce;
            $(window).on('resize', function(){ //re-init scrollbar on resizing
                resizePostBar();
                clearTimeout(debounce);
                debounce = setTimeout(reinitialiseScrollBar, 500);
            });
        }
    }
    
    /*========================================
    =               FUNCTIONS               =
    ========================================*/
    function togglePostBarMode(tap, manualToggle){ //Setting the blog value to a boolean forces the mode
        if((tap && $(tap.delegateTarget).attr('id')=='blog') || manualToggle == "blog"){
            $(".post-list li.post:not(.tag-gallery)").show();
            $(".post-list li.post.tag-gallery").hide();
            setActiveNavBarButton($("#blog"));
        }else if((tap && $(tap.delegateTarget).attr('id')=='about') || manualToggle == "about"){
            setActiveNavBarButton($("#about"));
        }else{
            $(".post-list li.post:not(.tag-gallery)").hide();
            $(".post-list li.post.tag-gallery").show();
            setActiveNavBarButton($("#gallery"));
        }
        setTimeout(reinitialiseScrollBar, 100);
    }
    
    function setActiveNavBarButton(btn){
        $("#site-menu > menu").find(".active").removeClass("active");
        btn.addClass("active");
    }
    
    function toggleNav(turnOff) {
        $('#wrapper').removeClass('show-comments');
        
        if ($('#wrapper').hasClass('show-nav')) {
            $('#wrapper').removeClass('show-nav');
        } else if(turnOff != null) {
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
    
    function toggleDescNav() {
        console.log("asdeasd");
        var footer = $('.gallery-footer');
        if (footer.hasClass('active')) {
            footer.removeClass('active');
        } else {
            footer.addClass('active');
        }
    }
        
    function resizePostBar(){
        var windo = $(this); //this = window
        if ($('#site-canvas').width() > 740) {
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
        if (window.matchMedia('(min-width: 741px)').matches){ //If in desktop-mode
            //console.log("ASDASDASD");
            //api.reinitialise();
            //$('.post-list .jspPane').css('width','264px');
            $('.scroll-pane').scroller("reset");
        }
    }
    
    function hookImageNavigationButtons(){
        var gallery = $('section.gallery-content');
        var items = gallery.children().length - 1;
        if(gallery.length){
            var menu = $('#image-menu');
            var buttons = $('#image-menu .image-nav ');
            var currentPosition = 0;
            
            buttons.on('tap',function(event){
                var direction = 'left';
                if (window.matchMedia('(min-width: 741px)').matches){ //If in desktop-mode
                    direction = 'top';
                }
                if($(event.target).hasClass('previous')){
                    currentPosition !== 0 ? (currentPosition += -1) : 0;
                    currentPosition === 0 && menu.find('.previous').addClass('disabled');
                    menu.find('.next').removeClass('disabled');
                }else{
                    currentPosition !== (items) ? (currentPosition += 1) : items;
                    currentPosition === items && menu.find('.next').addClass('disabled');
                    menu.find('.previous').removeClass('disabled');
                }
                gallery.css(direction, (currentPosition * -100) + '%');
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
        
        hookImageNavigationButtons();
        $('.description-nav-toggle').on('tap',toggleDescNav);
        
    }
});

    
    
