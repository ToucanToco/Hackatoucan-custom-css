const sys = require('sys');
const http = require('http');
const router = require('./router');
const fs = require('fs');
const url = require('url');
const request = require('request');
const axios = require('axios');

require.extensions['.txt'] = function (module, filename) {
  module.exports = fs.readFileSync(filename, 'utf8');
};

function cssPropertiesParser(cssTxt, isDiff)  {
  let regex = undefined;
  if (!isDiff) {
    regex = /(?:(\.[^.{ ,]+)\s*(?:{|,))/gm

    let properties = [];
  
    while ((match = regex.exec(cssTxt)) !== null) {
      properties.push(match[1]);
    }
  
    return properties;
  } else {
    let properties = [];
    let cssRegex = /.*(?:\.scss|\.css)\n@@.+@@\n(\s*|[^/]*)(?:diff|$)/gm
    regex = /(?:\+?.*(\.[^{,.]+)\s+(?:{|,))\n(?:(?:\s|[^.])*\n)*(?:\+ .*;)(?:\s|[^}])+}/gm
    while ((css = cssRegex.exec(cssTxt)) !== null) { 
      if (css && css[1]) {
        while ((match = regex.exec(css[1])) !== null) {
          properties.push(match[1]);
        }
      }
    }
    return properties;
  }
}

// Handle your routes here, put static pages in ./public and they will server
router.register('/', function(req, res) {
  res.writeHead(200, {'Content-Type': 'text/plain'});
  res.write('Hello World');
  res.end();
});

router.register('/file', function(req, res) {
  let diffText = require('./diff.txt');

  res.writeHead(200, {'Content-Type': 'text/plain'});
  res.write(diffText);
  res.end();
});

router.register('/diff', function(req, res) {
  let diffText = require('./diff.txt');

  res.writeHead(200, {'Content-Type': 'text/plain'});
  res.write(cssPropertiesParser(diffText, true).toString());
  res.end();
});

router.register('/smallApps', function(req, res) {

  let smallApps = require('./smallApps.json');

  res.writeHead(200, {'Content-Type': 'text/html'});
  res.write(
    `<body>${smallApps.reduce((acc, smallApp) => {
      return acc + `<a href="/customCss?name=${smallApp.id}">${smallApp.id}</a><br/>`;
    }, '')}</body>`
  );
  res.end();
});

router.register('/customCss', function(req, res) {
  const res2 = res;
  if (req.method === 'GET') {
    const currentUrl = new url.parse(req.url);
    const params = /.+name=(.+$)/.exec(currentUrl.search);

    if (params && params[1]) {
      const smallAppId = params[1];
      request(`https://api-demo-staging.toucantoco.com/${smallAppId}/assets/styles/variables`, {}, (err, res, body) =>
        {
          if (err) {return console.log(err);}
          res2.writeHead(200, {'Content-Type': 'application/json'});
          res2.write(body);
          res2.end();
        }
      );

    } else {
      res.writeHead(200, {'Content-Type': 'text/html'});
      res.write(`invalid param: ${currentUrl.search}`);
      res.end();
    }
  }
});

router.register('/compareCss', function(req, res) {
  let smallApps = require('./smallApps.json');
  let diffText = require('./diff.txt');

  let diffPropsArray = cssPropertiesParser(diffText, true)
  
  axios.all(smallApps.map((smallApp) => axios.get(`https://api-demo-staging.toucantoco.com/${smallApp.id}/assets/styles/variables`))).then((resp) =>
  {
    let finalText = ``;
    resp.forEach((data, index) => {
      if (data.data && data.data.specific) {
        let properties = cssPropertiesParser(data.data.specific, false);
        
        if (properties.length) {

          let currentText = '';
          for (let property of properties) {
            if (diffPropsArray.some((diffProp) => diffProp === property)) {

              if (finalText === ``) {
                finalText = `This PR impacts:`;
              }

              if (currentText === '') {
                currentText = `<a style="display: block; margin: 10px 5px;margin-top: 20px;" href="https://demo-staging.toucantoco.com/${smallApps[index].id}" target="_blank" >${smallApps[index].id}</a>`
              }

              currentText += `<div style="color: black; margin: 5px 10px;">${property}</div>`;
            }
          }

          finalText += currentText;
        }
      }
    })

    if (finalText === ``) {
      finalText = `This PR has no impact on any custom CSS (I Hope !)`;
    }

    res.writeHead(200, {'Content-Type': 'text/html'});
    res.write(finalText);
    res.end();
  }).catch(err => {
    console.log(err);
  })
});

// We need a server which relies on our router
var server = http.createServer(function (req, res) {
  handler = router.route(req);
  handler.process(req, res);
});

// Start it up
server.listen(8000);
sys.puts('Server running');