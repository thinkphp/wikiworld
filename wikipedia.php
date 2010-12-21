<?php
$location = ( $_GET['location'] && isset($_GET['location']) ) ? $_GET['location'] : 'Romania';
/*
* Scrape country content from Wikipedia. Each country web site has a table with short info of the country
* Get the three following paragraphs!!! 
*/
$query = 'select * from html where url="http://en.wikipedia.org/wiki/'. $location .
         '" and xpath="//table/following-sibling::p" limit 3';

$YQL = 'http://query.yahooapis.com/v1/public/yql?q='.
       urlencode($query).'&diagnostics=false&'.
       'format=xml';

echo get($YQL);  

function get($url) {
          $ch = curl_init();
          curl_setopt($ch,CURLOPT_URL,$url);
          curl_setopt($ch,CURLOPT_RETURNTRANSFER,1);
          curl_setopt($ch,CURLOPT_CONNECTTIMEOUT,2);
          $data = curl_exec($ch);
          $data = preg_replace('/<\?.*?>/','',$data);
          $data = preg_replace('/<\!--.*-->/','',$data);
          $data = preg_replace('/.*?<results>/','',$data);
          $data = preg_replace('/<\/results>.*/','',$data);
          if(empty($data)) {
            return 'System internal error or timeout!';
          } else {
            return $data;   
          } 
}
?>