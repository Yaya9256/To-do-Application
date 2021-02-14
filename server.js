let express = require('express')
let mongodb = require('mongodb')
let sanitizedHTML = require('sanitize-html')

let app = express()
let db

let port = process.env.PORT
if (port == null || port == '') {
  port = 3000
}

app.use(express.static('public')) // will make content of public folder available from rout of our server

let connectionString = 'mongodb://TodoAppUser:vkPHARPulp0cpcwm@cluster0-shard-00-00-jqitl.mongodb.net:27017,cluster0-shard-00-01-jqitl.mongodb.net:27017,cluster0-shard-00-02-jqitl.mongodb.net:27017/TodoApp?ssl=true&replicaSet=Cluster0-shard-0&authSource=admin&retryWrites=true&w=majority'
mongodb.connect(connectionString, {useNewUrlParser: true, useUnifiedTopology: true}, function(err, client) {
      if (err) {
        console.log("err:" + err);
      } else {
        db = client.db();
        app.listen(port);
        console.log("DB connection successfull");
      }
    })

app.use(express.json())    //set up browser side JavaScript code to asynchronously send a request to our node J.S. server. Using JS on front & back end
app.use(express.urlencoded({extended: false}))    // tells express to automaticaly take submit form data and add it to body object that lives on request object

function passwordProtected(req, res, next) {
    res.set('WWW-Authenticate', 'Basic realm="Simple Todo App"')
    console.log(req.headers.authorization)
    if (req.headers.authorization == "Basic SmFqYTp0b2Rv") {
      next()
    } else {
      res.status(401).send("Authentication required")
    }
}

app.use(passwordProtected)

app.get('/', function(req, res){
    db.collection('items').find().toArray(function(err, items) {
        res.send(`<!DOCTYPE html>
  <html>
  <head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Simple To-Do App</title>
  <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.2.1/css/bootstrap.min.css" integrity="sha384-GJzZqFGwb1QTTN6wy59ffF1BuGJpLSa9DkKMp0DgiMDm4iYMj70gZWKYbI706tWS" crossorigin="anonymous">
  </head>
  <body>
  <div class="container">
  <h1 class="display-4 text-center py-1">To-Do App!</h1>
  
  <div class="jumbotron p-3 shadow-sm">
  <form id="create-form" action="/create-item" method="POST">
  <div class="d-flex align-items-center">
  <input id="create-field" name="item" autofocus autocomplete="off" class="form-control mr-3" type="text" style="flex: 1;">
  <button class="btn btn-primary">Add New Item</button>
  </div>
  </form>
  </div>
  
  <ul id="item-list" class="list-group pb-5">
  </ul>
  
  </div>
  
  <script> 
  let items = ${JSON.stringify(items)}
  </script>

  <script src="https://unpkg.com/axios/dist/axios.min.js"></script>
  <script src="/browser.js"></script>
  </body>
  </html>`)
    }) 
})

app.post('/create-item', function(req, res) {
  let safeText = sanitizedHTML(req.body.text, {allowedTags: [], allowedAttributes: []})  
  db.collection('items').insertOne({text: safeText}, function(err, info) {
        res.json(info.ops[0])
    })   
})

app.post('/update-item', function(req, res) {
  let safeText = sanitizedHTML(req.body.text, {allowedTags: [], allowedAttributes: []})
    db.collection('items').findOneAndUpdate({_id: new mongodb.ObjectId(req.body.id)}, {$set: {text: safeText}}, function() {
        res.send("Success!")
    })
})

app.post('/delete-item', function(req, res) {
    db.collection('items').deleteOne({_id: new mongodb.ObjectId(req.body.id)}, function() {
      res.send("Sucess!")
    })
})
