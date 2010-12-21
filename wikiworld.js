/* when the DOM is loaded then begin */
window.addEvent('domready', function() {

  /* fixed background color #main for IE => CSS3 rgba(0,0,0,.5) */
  if(Browser.ie) {
     $('main').setStyles({'background':'#000','opacity':'0.5'});
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

    $('list').set('html', '<p class="load">' + loading + '</p>');

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

     /* using JSONP to handle the json */
     new Request.JSONP({
         url: YQL,
         onSuccess: function(data){
             if(localStorage) {
                localStorage.setItem('thewholeworld', JSON.stringify(data));
              }
              render(data); 
         } 
     }).send();
     
  }//endif

  /** 
   * Render the information 
   * @param Object data (JSON) the data with all infos about world in format json received from service. 
   * @return void.
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

         /* add the name of the location and use a number as the value; */
         out += '<li><button value="'+ i +'">'+ cs[i].name +'</button></li>';      
         
         if(i<j-1 && now != cs[i+1].name.substr(0,1)){
             out += '</ul>';
         }

         old = now;
    } 
    aznav += '</ul>';
    out += '</div>'; 

    /* add a container to host the map and content wikipedia and show the results plus effect fade in */
    $('list').fade('hide').set('html', aznav+out+'<div id="container"></div>').fade('in');

    /* get first sub-menu and make it current */
    current = $('listA');

    /* add the class 'show' to the first sub-menu to show it*/
    current.addClass('show');      
    
    /* load the content for the first country and display it */
    showCountry($$('#listA button')[0]);

    /*
     * Use event delegation on all links inside the #list element
     */
    $('list').addEvent('click', function(event){
           /* prevent default */
           if(event) {
              event.stop(); 
           }
           /* get the target element */
           var target = event.target;

           /** 
            * if the target is button then go ahead 
            * if the content of the button is a single character that means we are in the A-Z navigation
            * and we are shift the 'show' class from the last shown sub-menu to the current one.
            */
           if(target.nodeName.toLowerCase() == 'button') {
               if(target.get('html').length == 1) {
                  current.removeClass('show');
                  current = $('list' + target.get('html'));
                  current.fade('hide').addClass('show').fade('in');
               /* otherwise we call the showCountry function passing the clicked button */
               } else {
                  showCountry(target);
               }
           }
    }); 

  }//end function render

  /**
   * show info about country
   * @param elm Element - the button you've clicked or passed in initialize.
   * @return void.
   */
  function showCountry(elm) {

       /* fade the old container and show a loading message */
       $('container')
       .fade('out')
       .set('html','<p class="load">'+contentLoading+'</p>')
       .fade('in');

       /**  
        *  get the name of the country the user clicked on and replace 
        *  spaces with the underscore - this is the Wikipedia convention;
        */  
        var name = elm.get('html').replace(/ /g,'_');

        /**
         * get the information about the country from the data stored from GeoPlanet 
         * this is why I used numbers as the href
         */ 

        /* get attribute 'value' for this button */
        var bb = cs[elm.get('value')];

        /* compute the width distance */
        var width = $('main').getStyle('width').toInt() - $$('#azlists ul')[0].getStyle('width').toInt() - 50;
        /* if navigation agent is IE then fixed width */
        if(Browser.ie || Browser.opera) {
            width = 600;
        }//endif

       /** 
        * Use the awesome static maps API for open street map 
        * @ http://pafciu17.dev.openstreetmap.org 
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
                  encodeURIComponent(query);
         /*
          * Load the data and join the results. Then replace all the /wiki links with working links.
          * If there was no data returned, delete what was coming back from the API (the JSON wrapper).
          * 
          */  
          new Request.JSONP({
              url: YQL,
              data: {
                diagnostics: false,
                format: 'xml'   
              }, 
              onSuccess: function(data) {
                  if(window.console) {console.log(data);} 
                  if(data.results) {
                     data = data.results.join("").replace(/"\/wiki/g,'"http://en.wikipedia.org/wiki');
                  } else {
                     data = '';
                  }
                 /* hide the container, append the content and fade out for Effect */
                 $('container') 
                 .fade('hide')
                 .set('html',img + data)
                 .fade('in');

                 /* remove all the <sub> elements (WikiPedia footnote links) */
                 $$('#container sup').destroy();
              }              
          }).send(); 
  }//end function showCountry

});//end wikiworld
