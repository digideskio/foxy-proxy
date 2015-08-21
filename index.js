const http = require('http');
const request = require('request');
const path = require('path');
const fs = require('fs');
const argv = require('yargs')
  .default('host', '127.0.0.1')
  .argv;

const scheme = 'http://';
const port = argv.port || (argv.host === '127.0.0.1' ? 8000 : 80);
let destinationUrl = argv.url || scheme + argv.host + ':' + port;
const logPath = argv.log && path.join(__dirname, argv.log)
const logStream = logPath ? fs.createWriteStream(logPath) :
  process.stdout;

http.createServer((req, res) => {
  const { headers } = req;

  logStream.write(`Request received at: ${req.url} \n`);
  req.pipe(res);
  for (let header in headers) {
    res.setHeader(header, headers[header]);
  }
}).listen(8000);

http.createServer((req, res) => {
  const { headers, url, method } = req;
  const downstreamResponse = req.pipe(request({
    headers: headers,
    url: `${headers['x-destination-url'] || destinationUrl}${url}`,
    method: method
  }));

  logStream.write(`Proxying request to: ${destinationUrl}${url} \n`);
  logStream.write(`Request headers: ${JSON.stringify(headers)} \n`);
  downstreamResponse.pipe(logStream, { end: false });
  downstreamResponse.pipe(res);
}).listen(8001);