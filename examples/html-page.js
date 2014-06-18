/**
 * @jsx React.DOM
 */
'use strict';

import {resolve} from 'bluebird';
import React from 'react';

import respond from 'quinn-respond';
import {BufferBody} from 'quinn-respond';

function loadPost(postId) {
  return resolve({
    title: '10 reasons to use quinn that will blow your mind',
    postId: postId
  });
}

var PostView = React.createClass({
  render: function() {
    var post = this.props.model;
    return React.DOM.div(null, [
      React.DOM.h1(null, 'Post Viewer v3.7.9'),
      React.DOM.h2(null, post.title)
    ]);
  }
});

function HTML5Header(options) {
  return new BufferBody( // Terrible pseudo code below:
    '<!DOCTYPE html><html><head>' +
    '<!-- ' + options.styles + ' -->' +
    '<!-- ' + options.meta + ' -->' +
    '</head><body class="body-classes-from-options">'
  );
}

function toHtmlBodyStream(body) {
  // If it's a react component: render; then just normal respond logic
  return new BufferBody(String(body));
}

function HTML5Footer(options) {
  return new BufferBody( // Terrible pseudo code below:
    '<!-- ' + options.scripts + ' -->' +
    '</body>'
  );
}

function combinedStream(streams) {
  // ~= combined-stream
  return new BufferBody('many streams: ' + streams.length);
}

function HTML5Layout(body, options) {
  // Knows how to render an html5 page
  // Perfect case:
  // * toBuffer() on the returned stream should only return the inner component
  // * toJSON() should return the page model
  // Terrible pseudo code below:
  return respond(combinedStream([
      HTML5Header(options),
      toHtmlBodyStream(body),
      HTML5Footer(options)
    ]))
    .header('Content-Type', 'text/html; charset=utf-8');
}

function MyFancyLayout(body, options) {
  // Apply some defaults to options, wrap the body, then call the layout.
  // We could also fetch something from the interwebz and return a promise
  // here, rendering the body later on.
  return HTML5Layout(body, options);
}

export function showPost(req, params) {
  return MyFancyLayout(
    // First argument: the body; component or string or stream
    loadPost(params.postId).then(
      post => PostView({ model: post })
    ),
    // Second argument: options for the layout (and the responder)
    {
      // bufferBody tells the renderer that we want to wait until the body is
      // fully available before we render the head.
      // Otherwise we might start sending a response (headers/statusCode)
      // without knowing that the page is likely to be renderable.
      // One alternative is to do the promise resolution at the top level and
      // just use a plain old value as the body.
      // If you know the exact moment when you can give a go/no-go for
      // rendering the page (e.g. you have fallbacks for everything else), then
      // it's possible to set bufferBody to false.
      bufferBody: true,
      scripts: [ /* ... */ ],
      styles: [ /* ... */ ],
      meta: { /* ... */ }
    }
  ).status(418);
}
