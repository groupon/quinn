'use strict';

var QS = require('querystring');
var Http = require('http');
var Bluebird = require('bluebird');

exports.getInterestingPhotos = function getInterestingPhotos() {
  return new Bluebird(function(resolve, reject) {
    var query = {
      method: 'flickr.interestingness.getList',
      'per_page': 20,
      format: 'json',
      'api_key': 'ca4dd89d3dfaeaf075144c3fdec76756',
      nojsoncallback: 1
    };
    var httpOpts = {
      host: 'www.flickr.com',
      path: '/services/rest?' + QS.stringify(query)
    };

    Http.request(httpOpts, function(response) {
      response.on('error', reject);

      var body = '';
      response.on('data', function(chunk) {
        body += chunk.toString('utf8');
      });
      response.on('end', function() {
        try {
          var parsed = JSON.parse(body);
          resolve(parsed.photos);
        } catch (err) {
          reject(err);
        }
      });
    })
    .on('error', reject)
    .end();
  });
};
