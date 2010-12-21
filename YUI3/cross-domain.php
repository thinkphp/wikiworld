<?php

header('content-type: json/application');

$query = 'select centroid,woeid,name,boundingBox'.
           ' from geo.places.children(0) where parent_woeid=1 and placetype="country"'.
           ' | sort(field="name")';

$YQL = 'http://query.yahooapis.com/v1/public/yql?q='.
                urlencode($query). 
               '&diagnostics=false&format=json';

echo get($YQL);  

function get($url) {
          $ch = curl_init();
          curl_setopt($ch,CURLOPT_URL,$url);
          curl_setopt($ch,CURLOPT_RETURNTRANSFER,1);
          curl_setopt($ch,CURLOPT_CONNECTTIMEOUT,2);
          $data = curl_exec($ch);
          if(empty($data)) {
            return 'System internal error or timeout!';
          } else {
            return $data;   
          } 
}
?>