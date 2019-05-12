'use strict';

const http = require('http');
const assert = require('assert');

const Gofer = require('gofer');

function withTestApp(app) {
  before(function(done) {
    const self = this;
    self.server = http.createServer(app).listen(0, function() {
      self.baseUrl = 'http://127.0.0.1:' + self.server.address().port;
      self.client = new Gofer({
        globalDefaults: { baseUrl: self.baseUrl }
      });
      done();
    });
  });

  return {
    describeRequest: describeRequest,
    assertStatusCode: assertStatusCode,
    itSends: itSends,
    itContains: itContains
  };
}

function describeRequest(method, uri, fn) {
  describe(`${method} ${uri}`, function() {
    before(function() {
      const self = this;
      return this.client.fetch({
        method: method,
        uri: uri,
        maxStatusCode: 600
      }).getResponse().then(function(res) {
        self.response = res;
      });
    });

    fn();
  });
}

function assertStatusCode(statusCode) {
  before('verify statusCode', function() {
    assert.equal(this.response.statusCode, statusCode);
  });
}

function itSends(body) {
  it(`sends ${JSON.stringify(body)}`, function() {
    assert.equal(this.response.body, body);
  });
}

function itContains(body) {
  it(`sends text including ${JSON.stringify(body)}`, function() {
    console.log(this.response.body);
    assert.notEqual(this.response.body.indexOf(body), -1);
  });
}

module.exports = withTestApp;
