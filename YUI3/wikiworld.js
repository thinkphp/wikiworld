YUI().use('node','anim','io','json-parse','json-stringify', function(Y){

  /* fixed background color for div#main in IE => in FF we make CSS3 rgba(0,0,0,.5) */
  if(navigator.userAgent.indexOf('MSIE') != -1) {
     Y.one('#main').setStyles({'background':'#000','opacity':'0.5'});
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

    Y.one('#list').set('innerHTML','<p class="load">' + loading + '</p>');

    /**
     * This YQL query loads all the children of the element with the
     * WHERE on Earth ID 1 (which is earth) and sort them by name 
     * (for more info check the geoplanet API) http://developer.yahoo.com/geo/geoplanet/
     */
     
     var callback = {
         on: {
             success: function(x,o) {
                if(localStorage) {
                   localStorage.setItem('thewholeworld', o.responseText);
                 }
                 render(Y.JSON.parse(o.responseText)); 
             },
             failure: function(x,o) {
                 if(window.console) {console.log('async call failed!');}
             }
         }
     };

     Y.io('cross-domain.php', callback);
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

    /* Added a container to host the map and the content and show the results */
    Y.one('#list').set('innerHTML', aznav+out+'<div id="container"></div>').setStyle('opacity',0);
    new Y.Anim({
               node: '#list',
               to: {opacity: 1} 
               }).run(); 

    /* Load the content for the first country and display it */
     showCountry(Y.one('#listA button')); 

    /* add the class show to the first sub-menu to show it */ 
    current = Y.one('#listA').addClass('show'); 

    current.focus();


    /* use event delegation an all links  inside #list Element */ 

    Y.delegate('click',function(event){
          /* if the content of the button is a single character we are in the A-Z navigation and we shift the class 'show'
           * from the last shown sub-menu to the current one.
           */ 
          event.preventDefault();
          if(this.get('innerHTML').length == 1) {
                 current.removeClass('show');
                 current = Y.one('#list'+this.get('innerHTML')).addClass('show');
          } else {
                 showCountry(this);
          }

    },'#list','button');

  }//end function render

  function showCountry(elm) {

       /* Fade the old container and show a loading message */
       Y.one('#container').set('innerHTML','<p class="load">'+contentLoading+'</p>').setStyle('opacity',0);
       new Y.Anim({node: '#container',
                   to:{opacity:1}
                 }).run();  

       /*  
        *  get the name of the country the user clicked on and replace 
        *  spaces with the underscore - this is the Wikipedia convention 
        */  
        var name = elm.get('innerHTML').replace(/ /g,'_');

        /*
         * get the information about the country from the data stored from GeoPlanet 
         * this is why I used numbers as the href
         */ 

        var bb = cs[elm.get('value')];

        var width = Y.one('#main').getStyle('width').replace('px','') - Y.one('#listA').getStyle('width').replace('px','') - 50;

       /* Use the awesome static maps API for open street map at  http://pafciu17.dev.openstreetmap.org 
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
        var callback = {
           on: {
              success: function(x,o) {
                var data = o.responseText;
                if(data){                  
                   data = data.replace(/"\/wiki/g,'"http://en.wikipedia.org/wiki"');
                   Y.one('#container').set('innerHTML',img+data).setStyle('opacity',0);
                   new Y.Anim({
                       node: '#container',
                       to: {opacity: 1} 
                   }).run(); 
                   Y.all('#container sup').remove(); 
                }//end if data
              },
              failure: function(x,o) {
                  if(window.console) {console.log('async call failed!');}
              }
         }
     };
      var uri = 'wikipedia.php?location='+ name; 
      Y.io(uri, callback);
  }
});//end wikiworld