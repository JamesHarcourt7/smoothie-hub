
const http = require('http')
const fs = require('fs')
var port = 8000

console.log("Initialising...")

function sanitise (input) {
  return decodeURI(input.substring(1))
}

http.createServer( function(req, res) {
	var request = req.url.substring(1)
	console.log("request: " + req.url)
	res.writeHead(200, {'Content-Type': 'text:html'})
  request = sanitise(req.url)

  // Determine whether to load a file or a resource
  if(fs.existsSync(request) || fs.existsSync(request + '.htm')) {
    if(!request.split('/')[0].includes("_files") && !request.includes(".")) {
      console.log("\t> Serving HTML from request")
      fs.createReadStream(request + '.htm').pipe(res)
    } else {
      console.log("\t> Serving file from request")
      fs.createReadStream(request).pipe(res)
    }
  } else {
    res.end("404")
  }
}).listen(port);

console.log("Server listening")
