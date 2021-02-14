
// Classes
class Post {
  constructor(username, filename, description, ingredients, title)  {
    this.username = username; this.filename = filename; this.description = description; this.ingredients = ingredients; this.title = title;
  }
  totalRating = 0
  numRatings = 0
  raters = Array(0)
  getRating () {
    if(this.numRatings == 0) return 0
    return this.totalRating / this.numRatings
  }
  hasRated (username) {
    for(var i = 0; i < this.raters.length; i++) {
      console.log("Does \"" + this.raters[i] + "==\"" + username + "\"?" + (this.raters[i] == username))
      if(this.raters[i] == username) return true
    }
    return false
  }
  get id () {
    return this.filename.substring(0, this.filename.length - 4)
  }
}
class User {
  constructor(username, hashedPassword, bio, postsRated, postsSeen) {
    this.username = username; this.hashedPassword = hashedPassword; this.bio = bio; this.postsRated = postsRated; this.postsSeen = postsSeen
    if(this.postsRated == undefined || this.postsRated.length == 0) this.postsRated = new Array(0)
    if(postsSeen == undefined) this.postsSeen = new Array(0)
  }
  hasRated (postID) {
    for (var i = 0; i < this.postsRated.length; i++) {
      console.log("Does \"" + this.postsRated[i] + "==\"" + postID + "\"?" + (this.postsRated[i] == postID))
      if(this.postsRated[i] == postID) return true
    }
    return false
  }
}

// Input handling functions
function sanitise (input) {
  return decodeURI(input.substring(1))
}
function CheckUserInput (input) {
  if(Array.isArray(input)) {
    out = new Array(0)
    for(var i = 0; i < input.length; i++) {
      out.push(CheckItem(input))
    }
    return out
  } else {
    return CheckItem(input)
  }
}
function CheckItem(input) {return CheckItem(input, 5000)}
checkAllowed = "QWERTYUIOPASDFGHJKLZXCVBNMqwertyuiopasdfghjklzxcvbnm1234567890,._-:£><=!()[]&\' "
function CheckItem (input, length) {
  if(input == undefined) return input
  if(input.length > length) return input.substring(0, length)
  for(var i = 0; i < input.length; i++) {
    if(!checkAllowed.includes(input[i])) input = input.replace(input[i], " ")
  }
  return input
}

// Account handling functions
function AddUser (username, passHash) {
  //fs.appendFileSync("database.csv", username + "," + passHash + "\n")
  users.push(new User(username, passHash, "", new Array(0)))
  saveUsers()
}
function CheckUser (username, passHash) {
  //db = fs.readFileSync("database.csv", 'utf8').split('\n')
  console.log("Checking \"" + username + "\",\"" + passHash + "\"")
  for(var i = 0; i < users.length; i++) {
    // linesplit = db[i].split(',')
    // console.log(linesplit)
    // if(username == linesplit[0] && passHash == linesplit[1]) return true
    if(username == users[i].username && passHash == users[i].hashedPassword) return true
  }
  return false
}
function DoesUserExist (username) {
  for(var i = 0; i < users.length; i++) {
    if(username == users[i].username) return true
  }
  return false
}
function CreateAccount(req, res) {
  var uploadForm = new fm.IncomingForm()
  uploadForm.parse(req, function (error, fields, files) {

    fields.username = CheckUserInput(fields.username)

    if(DoesUserExist(fields.username)) {
        res.end("<h1><b>failure - user already exists</b></h1>")
        return
    }
    AddUser(fields.username, fields.passHash)
    pfpFilename = fields.username + ".jpg"
    var newDir = __dirname + "/pfp/"
    if(!fs.existsSync(newDir)) {
      fs.mkdirSync(newDir)
    }
    if(files.pfp != undefined && files.pfp.size > 0) {
      var oldPath = files.pfp.path
      fs.rename(oldPath, newDir + pfpFilename, function (err) {
        if (error) throw error
      });
    } else {
      console.log("Copying " + __dirname + '/example_pfp.jpg' + " to " + (newDir + pfpFilename))
      fs.copyFileSync(__dirname + '/example_pfp.jpg', newDir + pfpFilename)
    }
    res.writeHead(302, {'Location': '/login.html'});
    res.end();
  });
}
function loadUsers() {
  userBuffer = JSON.parse(fs.readFileSync('users.json'))
  for(var i = 0; i < userBuffer.length; i++) {
    users.push(new User(userBuffer[i].username, userBuffer[i].hashedPassword, userBuffer[i].bio, userBuffer[i].postsRated))
  }
  saveUsers()
}
function saveUsers() {
  console.log("\t\t(Saving users)")
  fs.writeFileSync("users.json", JSON.stringify(users, null, 3))
}
function getUserIndex(username) {
  for(var i = 0; i < users.length; i++) {
    if(users[i].username == username) return i
  }
  return 0
}
function UpdateProfileInfo (req, res) {
  var uploadForm = new fm.IncomingForm()
  uploadForm.parse(req, function(error, fields, files) {
    username = fields.username
    if(fields.newBio != undefined && fields.newBio.length > 0) {
      fields.newBio = CheckUserInput(fields.newBio)
      users[getUserIndex(username)].bio = fields.newBio
      saveUsers()
    }
    if(files.changePFP != undefined && files.changePFP.size>0) {
      oldPath = files.changePFP.path
      pfpFilename = username + ".jpg"
      newDir = __dirname + "/pfp/"
      if(!fs.existsSync(newDir)) {
        fs.mkdirSync(newDir)
      }
      fs.rename(oldPath, newDir + pfpFilename, function (err) {
        if (error) res.end(error)
      });
    }
    res.writeHead(302, {'Location': '/profile?' + username});
    res.end()
  })
}

// Post handling functions
const idLetterBank1 = "BCDFGHJKLMNPRSTVWZ"
const idLetterBank2 = "AEIOUY"
function generatePostId(username) {
  a = ""
  for(var i = 0; i < 5; i++) {
    a += i%2 == 0 ? idLetterBank1[Math.floor(Math.random() * (idLetterBank1.length - 1))] : idLetterBank2[Math.floor(Math.random() * (idLetterBank2.length - 1))]
  }
  a += Math.floor(Math.random() * 1000)
  return doesPostExist(username, a) ? generatePostId(username) : a
}
function doesPostExist(username, id) {
  return fs.existsSync('/posts/'+username+'/'+id+'.jpg')
}
function enregisterPost(username, filename, description, ingredients, title) {
  //fs.appendFileSync("posts.csv", username+","+filename+","+description+'\n')
  posts.push(new Post(username, filename, description, ingredients, title))
  postsDict[filename.substring(0, filename.length-4)] = posts.length - 1
  savePosts()
}
function MakePost(req, res) {
  var uploadForm = new fm.IncomingForm()
  uploadForm.parse(req, function (error, fields, files) {

    fields.username = CheckUserInput(fields.username)
    fields.postDescription = CheckUserInput(fields.postDescription)
    fields.postIngredients = CheckUserInput(fields.postIngredients)
    fields.postTitle = CheckUserInput(fields.postTitle)

    var oldPath = files.postImage.path
    var username = fields.username
    postFilename = username + generatePostId(username) + ".jpg"
    var newDir = __dirname + "/posts/" + username + "/"
    if(!fs.existsSync(newDir)) {
      fs.mkdirSync(newDir)
    }
    console.log("Moving file to: " + newDir + postFilename)
    fs.rename(oldPath, newDir + postFilename, function (err) {
      if (error) throw error
      // you may respond with another html page
      res.writeHead(200, {'Content-Type': 'text:html'})
      res.write('<p>File uploaded and moved!</p>')
      res.write('<embed src=\'/posts/' + username + '/'+postFilename+'\'>')
      res.write('<a href=\'/home.html\'>Back to home</a>')
      res.end()
      //console.log(fields)
      enregisterPost(username, postFilename, fields.postDescription, fields.postIngredients, fields.postTitle)
    });
  });
}
function savePosts() {console.log("\t\t(Saving posts)");fs.writeFileSync("posts.json", JSON.stringify(posts, null, 3))}
function loadAndAuditPosts () {
  posts = JSON.parse(fs.readFileSync('posts.json'))
  for(var i = 0; i < posts.length; i++) {
    if(!fs.existsSync(__dirname + '/posts/' + posts[i].username + '/' + posts[i].filename)) {
      console.log("Pruning post from " + posts[i].username + ": " + posts[i].filename)
      console.log(__dirname + '/posts/' + posts[i].username + '/' + posts[i].filename)
      posts[i] = undefined
    }
  }
  posts = posts.filter(function(item){return item != undefined})
  savePosts()
  for(var i = 0; i < posts.length; i++) {
    posts[i] = new Post(posts[i].username, posts[i].filename, posts[i].description, posts[i].ingredients, posts[i].title)
    postsDict[posts[i].id] = i
  }
  console.log(postsDict)
}
function ratePost(id, rating, username, res) {
  index = postsDict[id]

  userIndex = getUserIndex(username)
  if(users[userIndex].hasRated(id)) {
    res.end("already rated")
    return;
  }

  users[userIndex].postsRated.push(id)
  posts[postsDict[id]].raters.push(username)
  saveUsers()
  savePosts()

  posts[index].totalRating += parseInt(rating)
  posts[index].numRatings++
  savePosts()
  res.end("post rated")
}
function GetAllPostsByUser(username) {
  postsByUser = ""
  if(!fs.existsSync(__dirname + "/posts/" + username + "/")) return ""
  fs.readdirSync(__dirname + "/posts/" + username + "/").forEach(file => {
    postsByUser += file.substring(0, file.length-4) + '\n'
  })
  return postsByUser
}
function GetLikedPostsByUser(username) {
  likedPostsByUser = ""
  r = users[getUserIndex(username)].postsRated
  for(var i = 0; i < r.length; i++) {
    likedPostsByUser += r[i] + '\n'
  }
  return likedPostsByUser
}
function SearchAllPosts (searchTerm) {
  out = ""
  st = searchTerm.toUpperCase()
  for(var i = 0; i < posts.length; i++) {
    if(posts[i].title.toUpperCase().includes(st)
      || posts[i].description.toUpperCase().includes(st)
      || posts[i].ingredients.toUpperCase().includes(st)) {
      out += posts[i].id + '\n'
    }
  }
  return out
}

// Libraries, constant variables, other shite
const http = require('http')
const fs = require('fs')
const fm = require('formidable')
var port = 8000

// Reassure the user
console.log("Initialising...")

// Load posts database and create dictionary. Do the same for users
posts = Array(0)
var postsDict = []
loadAndAuditPosts()
users = Array(0)
loadUsers()

// Server function
http.createServer( function(req, res) {
  // console.log(req)
	var request = req.url.substring(1)
	console.log("request: " + req.url)
	res.writeHead(200, {'Content-Type': 'text:html'})
  request = sanitise(req.url)

  if(request == "" || req.url == "/") request = "home.html"

  if(request == "post") {
    // Initialise upload form
    MakePost(req, res);
    return
  } else

  if(request == "newaccount") {
    CreateAccount(req,res)
    return
  } else

  if(request == "UpdateProfileInfo") {
    UpdateProfileInfo(req, res)
    return
  }

  // Rating requests
  if(request.includes("rate_post")) {
    // /rate_post/[post id]/rating/[username]
    split = request.split('/')
    ratePost(split[1], parseInt(split[2]), split[3], res)
  } else

  // List liked posts
  if(request.includes("likedposts/")) {
    res.end(GetLikedPostsByUser(request.split('/')[1]));
  } else

  // Profile pages
  if(request.includes("profile?")) {
    // /profile/[username]
    fs.createReadStream(__dirname + "/user-page.html").pipe(res)
    if(!DoesUserExist(request.split('?')[1])) res.end("No such user account")
  } else

  // Getting an Image
  if(request.includes("GetImageFromPost")) {
    // /GetImageFromPost/[post id]
    split = request.split('/')
    console.log("Finding image \"" + split[1] + "\"")
    post = posts[postsDict[split[1]]]
    fs.createReadStream(__dirname + "/posts/" + post.username + "/" + post.filename).pipe(res)
  } else

  // Get a user's profile picture
  if(request.includes("GetPFP")) {
    split = request.split('/')
    if(!fs.existsSync(__dirname + "/pfp/" + split[1] + ".jpg")){
      res.end("No such file")
      return
    }
    fs.createReadStream(__dirname + "/pfp/" + split[1] + ".jpg").pipe(res)
  } else

  if(request.includes("GetUserBio")) {
    res.end(users[getUserIndex(request.split('/')[1])].bio)
  } else

  if(request.includes("UpdateBio/")) {
    // /UpdateBio/[username]/[new bio]
    split = request.split('/')
    users[getUserIndex(split[1])].bio = CheckUserInput(split[2])
    res.end("set")
  } else

  // Get a Description
  if(request.includes("GetDescFromPost")) {
    // /GetDescFromPost/[post id]
    split = request.split('/')
    post = posts[postsDict[split[1]]]
    res.end(post.description)
  } else

  // Get an ingredient list
  if(request.includes("GetIngrFromPost")) {
    // /GetDescFromPost/[post id]
    split = request.split('/')
    post = posts[postsDict[split[1]]]
    res.end(post.ingredients)
  } else

  // Get title
  if(request.includes("GetTitleFromPost")) {
    // /GetTitleFromPost/[post id]
    split = request.split('/')
    post = posts[postsDict[split[1]]]
    res.end(post.title)
  } else

  // Get user
  if(request.includes("GetUserFromPost")) {
    // /GetDescFromPost/[post id]
    split = request.split('/')
    post = posts[postsDict[split[1]]]
    res.end(post.username)
  } else

  // Get user
  if(request.includes("GetRatingFromPost")) {
    // /GetDescFromPost/[post id]
    split = request.split('/')
    post = posts[postsDict[split[1]]]
    console.log("rating" + post.getRating() + "b")
    res.end("" + post.getRating())
  } else

  // Full post information
  if(request.includes("GetPostInfo")) {
    split = request.split('/')
    post = posts[postsDict[split[1]]]
    res.end("<body><h1>" + post.title + "</h1><br><image src=\"/posts/" + post.username + "/" + post.filename + "\"><p>"+post.description+"</p><p>"+post.ingredients+"</p></body>")
  } else

  // Suggesting a post
  if(request.includes("SuggestNextPost")) {
    // /SuggestNextPost/[username]
    split = request.split('/')
    username = split[1]
    var user = users[getUserIndex(username)]

    queue = Array(0)
    for(var i = 0; i < posts.length; i++) {
      queue.push(i)
      if(!user.postsSeen.includes(posts[i].id)) {
        for(var j = 0; j < 3; j++) queue.push(i)
      }
    }

    i = queue[Math.floor(Math.random() * queue.length)]

    if(!user.postsSeen.includes(posts[i].id)) user.postsSeen.push(posts[i].id) // don't duplicate
    saveUsers()
    res.end(posts[i].id)
  } else

  // Get all post IDs posted by the given username
  if(request.includes("GetAllPostsByUser")) {
    // /GetAllPostsByUser/username
    res.end(GetAllPostsByUser(request.split('/')[1]));
  } else

  if(request.includes("SearchAllPosts")) {
    // /SearchAllPosts/[search term]
    res.end(SearchAllPosts(request.split('/')[1]))
  } else

  // Verify account details
  if(request.includes("verify")) {
    split = request.split('/')
    username = split[1]
    passHash = split[2]
    res.end("" + CheckUser(username, passHash))
  } else

  // Query account existence
  if(request.includes("queryexistence")) {
    res.end("" + DoesUserExist(request.split('/')[2]))
  } else

  // Determine whether to load a file or a resource
  if(fs.existsSync(request) || fs.existsSync(request + '.htm')) {
    if(!request.split('/')[0].includes("_files") && !request.includes(".")) {
      console.log("\t> Serving HTML from request")
      fs.createReadStream(request + '.htm').pipe(res)
    } else {
      console.log("\t> Serving file from request")
      if(!fs.existsSync(request)) {
        res.end("No such file")
        return
      }
      fs.createReadStream(request).pipe(res)
    }
  } else {
    res.end("404")
  }

  console.log("\t> Response finished")
}).listen(port);

console.log("Server listening")
