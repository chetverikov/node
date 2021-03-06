'use strict';
var common = require('../common');
var assert = require('assert');

if (!common.hasCrypto) {
  common.skip('missing crypto');
  return;
}
var tls = require('tls');

var fs = require('fs');
var path = require('path');

var options = {
  key: fs.readFileSync(path.join(common.fixturesDir, 'test_key.pem')),
  cert: fs.readFileSync(path.join(common.fixturesDir, 'test_cert.pem'))
};

var connectCount = 0;

var server = tls.createServer(options, function(socket) {
  ++connectCount;
  socket.on('data', function(data) {
    console.error(data.toString());
    assert.equal(data, 'ok');
  });
}).listen(0, function() {
  unauthorized();
});

function unauthorized() {
  var socket = tls.connect({
    port: server.address().port,
    servername: 'localhost',
    rejectUnauthorized: false
  }, function() {
    assert(!socket.authorized);
    socket.end();
    rejectUnauthorized();
  });
  socket.on('error', function(err) {
    assert(false);
  });
  socket.write('ok');
}

function rejectUnauthorized() {
  var socket = tls.connect(server.address().port, {
    servername: 'localhost'
  }, function() {
    assert(false);
  });
  socket.on('error', function(err) {
    console.error(err);
    authorized();
  });
  socket.write('ng');
}

function authorized() {
  var socket = tls.connect(server.address().port, {
    ca: [fs.readFileSync(path.join(common.fixturesDir, 'test_cert.pem'))],
    servername: 'localhost'
  }, function() {
    assert(socket.authorized);
    socket.end();
    server.close();
  });
  socket.on('error', function(err) {
    assert(false);
  });
  socket.write('ok');
}

process.on('exit', function() {
  assert.equal(connectCount, 3);
});
