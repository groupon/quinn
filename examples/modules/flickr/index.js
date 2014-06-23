'use strict';

var respond = require('quinn-respond');
var router = require('quinn-router');
var route = router.route;
var render = require('quinn-render');

var getInterestingPhotos = require('./service').getInterestingPhotos;
var PhotoPage = require('./components/photo-page');

exports.handler = route(function(router) {
  var GET = router.GET;

  GET('/flickr.json', function() {
    return respond.json(getInterestingPhotos());
  });

  GET('/flickr', function() {
    return render(PhotoPage, {
      // All promises in the render context are resolved automatically
      flickrData: getInterestingPhotos()
    }, {
      // These are render/layout options

      // This would disable layout and just render the component
      // layout: false

      // Ends up in the <title> tag
      pageTitle: 'Interesting Flickr Photos',

      // Will be used for body classes and html lang attributes
      lang: 'en',
      locale: 'en_US',

      // rtl/ltr body class + dir attribute
      rtl: false
    });
  });
});
