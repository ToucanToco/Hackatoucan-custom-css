var sys = require('sys');
var http = require('http');
var router = require('./router');

// Handle your routes here, put static pages in ./public and they will server
router.register('/', function(req, res) {
  res.writeHead(200, {'Content-Type': 'text/plain'});
  res.write('Hello World');
  res.end();
});

// Handle your routes here, put static pages in ./public and they will server
router.register('/payload', function(req, res) {


  res.writeHead(200, {'Content-Type': 'text/plain'});
  res.write('Hello Payload');
  res.end();
});

// We need a server which relies on our router
var server = http.createServer(function (req, res) {
  handler = router.route(req);
  handler.process(req, res);
});

// Start it up
server.listen(8000);
sys.puts('Server running');