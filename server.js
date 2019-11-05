let sys = require('sys');
let http = require('http');
let router = require('./router');
let fs = require('fs');


require.extensions['.txt'] = function (module, filename) {
  module.exports = fs.readFileSync(filename, 'utf8');
};

function cssPropertiesParser(cssTxt, isDiff)  {
  let regex = isDiff ? /(?:\+?.*(\.\S+)\s+{)\n(?:.*;\n)*(?:\+ .*;)/gm : /.*(\.\S+)\s+{/gm;

  let properties = [];

  while ((match = regex.exec(cssTxt)) !== null) {
    properties.push(match[1]);
  }
  
  return properties.toString();
}

// Handle your routes here, put static pages in ./public and they will server
router.register('/', function(req, res) {
  res.writeHead(200, {'Content-Type': 'text/plain'});
  res.write('Hello World');
  res.end();
});

// Handle your routes here, put static pages in ./public and they will server
router.register('/parseDiff', function(req, res) {
  let diffText = require('./diff.txt');

  res.writeHead(200, {'Content-Type': 'text/plain'});
  res.write(cssPropertiesParser(diffText, true));
  res.end();
});

router.register('/affectedSmallApps', function(req, res) {
  let diffText = require('./diff.txt');

  let smallApps = require('./smallApps.json');

  res.writeHead(200, {'Content-Type': 'text/html'});
  res.write(
    `<body>${smallApps.reduce((acc, smallApp) => {
      return acc + `<a href="/smallAppCustomCss?name=${smallApp.id}">${smallApp.id}</a><br/>`;
    }, '')}</body>`
  );
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