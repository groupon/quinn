'use strict';

var React = require('react');

var PhotoPage = React.createClass({
  renderPhoto: function(photo) {
    return React.DOM.div({ key: photo.id }, [
      React.DOM.h3({ key: 'title' }, photo.title),
      React.DOM.img({
        key: 'thumb',
        src: [
          'http://farm', photo.farm, '.static.flickr.com/',
          photo.server, '/', photo.id, '_', photo.secret, '_m.jpg'
        ].join('')
      })
    ]);
  },

  render: function() {
    var photos = this.props.flickrData.photo;
    return React.DOM.div(null, photos.map(this.renderPhoto));
  }
});

module.exports = PhotoPage;
