$(document).ready(function(){

  /* fixed background color for div#main in IE => in FF we make CSS3 rgba(0,0,0,.5) */
  if(navigator.userAgent.indexOf('MSIE') != -1) {
     $('#main').css('background','#000').css('opacity',0.5);
  }

  //define messages and "global variables";
  var loading = 'Please wait, loading the world...(can take up 20 seconds - only on the first start)',
      contentLoading = 'Loading content...',
      current, cs; 

 /**
  * if localStorage is supported and the browser has the world,
  * then data cached, use this instead of hummering YQL
  */
  if(localStorage && localStorage.getItem('thewholeworld')) {

     render(JSON.parse(localStorage.getItem('thewholeworld')));

  /* otherwise display a loading message */
  } else {

    $('#list').html('<p class="load">' + loading + '</p>');

    /**
     * This YQL query loads all the children of the element with the
     * WHERE on Earth ID 1 (which is earth) and sort them by name 
     * (for more info check the geoplanet API) http://developer.yahoo.com/geo/geoplanet/
     */
     
     var query = 'select centroid,woeid,name,boundingBox'+
                 ' from geo.places.children(0) where parent_woeid=1 and placetype="country"'+
                 ' | sort(field="name")';  

     var YQL = 'http://query.yahooapis.com/v1/public/yql?q='+ 
                encodeURIComponent(query) + 
               '&diagnostics=false&format=json';

     //Method to grab the JSON
     $.ajax({
         url: YQL,
         cache: false,
         dataType: "json",
         success: function(data) {
             if(localStorage) {
                localStorage.setItem('thewholeworld', JSON.stringify(data));
              }
              render(data); 
         }
     });
     
  }//endif

  /** 
   * Render the information 
   */
  function render(data) {

     /* start a list */
     var aznav = '<ul>',
         out = '<div id="azlists">';
         cs = data.query.results.place;

     var old = ''; 
    /* loop over all the places in the data */
    for(var i=0,j=cs.length;i<j;i++) {
        /*
         * if the first character of the current name is different
         * than tha last one add a new item and a neested list
         * this generates the A-Z navigation and the items.
         */
         var now = cs[i].name.substr(0,1);
         if(now !== old) {
            aznav += '<li><button value="'+ now +'">'+ now +'</button></li>'; 
            out += '<ul id="list'+ now +'">'; 
         }

         //add the name of the location and use a number as the value;
         out += '<li><button value="'+ i +'">'+ cs[i].name +'</button></li>';      
         
         if(i<j-1 && now != cs[i+1].name.substr(0,1)){
             out += '</ul>';
         }

         old = now;
    } 

    aznav += '</ul>';
    out += '</div>'; 

    /* adds a container to host the map and the content and show the results */
    $('#list')
    .hide()
    .html(aznav+out+'<div id="container"></div>')
    .fadeIn('slow');

    /* load the content for the first country and display it */
    showCountry($('#listA button:first')); 

    /* add the class show to the first sub-menu to show it */ 
    current = $('#listA')
    current.addClass('show'); 

    /* use event delegation an all links  inside #list Element */ 
    $('#list').delegate("button","click", function(event){
          event.preventDefault();

          /* if the content of the button is a single character we are in the A-Z navigation and we shift the class 'show'
           * from the last shown sub-menu to the current one.
           */ 
          if($(this).html().length == 1) {

               $(current).removeClass('show').hide();
                 current = $('#list'+$(this).html());
                 current.hide().addClass('show').show('medium');
               $('#list'+$(this).html() + ' button:first').focus();        

          /* otherwise we call the function 'showCountry' */
          } else {
              showCountry($(this));
          }
    });   

  }//end function render;

  function showCountry(elm) {

       /* fade the old container and show a loading message */
       $('#container')
       .fadeOut()
       .html('<p class="load">'+contentLoading+'</p>')
       .fadeIn();

       /*  
        *  get the name of the country the user clicked on and replace 
        *  spaces with the underscore - this is the Wikipedia convention 
        */  
        var name = elm.html().replace(/ /g,'_');

        /*
         * get the information about the country from the data stored from GeoPlanet 
         * this is why I used numbers as the href
         */ 

        var bb = cs[elm.attr('value')];

        var width = $('#main').width() - $('#azlists ul:first').width() - 50;

       /** 
        * use the awesome static maps API for open street map 
        * at http://pafciu17.dev.openstreetmap.org 
        * to show the map using the bounding box data from geoplanet.
        */
        var image = 'http://pafciu17.dev.openstreetmap.org/?module=map&bbox='+ 
                     bb.boundingBox.southWest.longitude+','+
                     bb.boundingBox.northEast.latitude+','+
                     bb.boundingBox.northEast.longitude+','+
                     bb.boundingBox.southWest.latitude+
                     '&points='+bb.centroid.longitude+','+bb.centroid.latitude+
                     ',pointImagePattern:greenI&width='+width+'&height=250';

        /* Add a heading and the image */
        var img = '<h2>' + bb.name + '</h2><div class="img"><img src="'+ image +'" alt="'+ bb.name +'"></div>';

        /*
         * Scrape country content from Wikipedia. Each country web site has a table with short info of the country
         * Get the three following paragraphs!!! 
         */
        var query = 'select * from html where url="http://en.wikipedia.org/wiki/'+ name +
                    '" and xpath="//table/following-sibling::p" limit 3';

           YQL = 'http://query.yahooapis.com/v1/public/yql?q='+
                  encodeURIComponent(query)+'&diagnostics=false&'+
                 'format=xml&callback=?';

         /*
          * Load the data and join the results. Then replace all the /wiki links with working links.
          * If there was no data returned, delete what was coming back from the API (the JSON wrapper).
          */  
          $.getJSON(YQL, function(data){
            /* if we have the data from WikiPedia API then display them */
            if(data.results) {
              data = data.results.join("").replace(/"\/wiki/g,'"http://en.wikipedia.org/wiki"');
            /* otherwise data is empty */ 
            } else {
              data = '';  
            } 
 
            /* hide the container, append and fade for effect */
            $('#container').hide().html(img+data).fadeIn();        

            /* remove all the <sub> elements (WikiPedia footnote links) */
            $('#container sup').remove();
          }); 
  }
});//end wikiworld