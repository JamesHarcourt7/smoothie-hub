
// Input handling functions
function sanitise (input) {
  return decodeURI(input.substring(1))
}

// Account handling functions
function AddUser (username, passHash) {
  fs.appendFileSync("database.csv", username + "," + passHash + "\n")
}
function CheckUser (username, passHash) {
  db = fs.readFileSync("database.csv", 'utf8').split('\n')
  for(var i = 0; i < db.length; i++) {
    linesplit = db[i].split(',')
    console.log(linesplit)
    if(username == linesplit[0] && passHash == linesplit[1]) return true
  }
  return false
}
function DoesUserExist (username) {
  db = fs.readFileSync("database.csv", 'utf8').split('\n')
  for(var i = 0; i < db.length; i++) {
    if(username == db[i].split(',')[0]) return true
  }
  return false
}

// Libraries, constant variables, other shite
const http = require('http')
const fs = require('fs')
var port = 8000

console.log("Initialising...")

// Server function
http.createServer( function(req, res) {
	var request = req.url.substring(1)
	console.log("request: " + req.url)
	res.writeHead(200, {'Content-Type': 'text:html'})
  request = sanitise(req.url)

  // Determine if the request made is for an account
  if(request.includes("account")) {
    // Account information requested
    if(request.includes("create")) {
      // Create account: /account/create/[username]/[hashed password]
      split = request.split('/')
      username = split[2]
      passHash = split[3]
      AddUser(username, passHash)
      res.end("success")
    }
    if(request.includes("verify")) {
      split = request.split('/')
      username = split[2]
      passHash = split[3]
      res.end("" + CheckUser(username, passHash))
    }
    if(request.includes("queryexistence")) {
      res.end("" + DoesUserExist(request.split('/')[2]))
    }
  } else {
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
  }
}).listen(port);

console.log("Server listening")
