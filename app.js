var http = require('http');
var fs = require('fs');
var mime = require('mime');

function proxy(clientReq, clientRes) {
    var proxyRequest = http.request({
        host: clientReq.headers['host'].split(':')[0],
        port: clientReq.headers['host'].split(':')[1] || 80,
        path: clientReq.url,
        method: clientReq.method,
        headers: clientReq.headers
    }, function (proxyResponse) {
        clientRes.writeHead(proxyResponse.statusCode, proxyResponse.headers);
        proxyResponse.pipe(clientRes);
    });
    clientReq.pipe(proxyRequest);
}

function sendFile(path, response) {
    fs.stat(path, function(err, stats) {
        response.writeHead(200,  {
            "content-type": mime.lookup(path),
            "content-length": stats.size
        });
        fs.createReadStream(path).pipe(response);
    });
}

http.createServer(function (req, res) {
    var path = req.url.indexOf(req.headers.host) > -1 ? req.url.split(req.headers.host)[1] : req.url;
    if (path[0] == '/') path = path.substr(1);
    fs.exists(path, function (exists) {
        console.log(path, exists)
        if (exists) {
            sendFile(path, res);
        } else {
            proxy(req, res);
        }
    });

}).listen(3000);

console.log("Server running at 3000 port.");