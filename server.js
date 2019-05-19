var express = require('express');
var mongoose = require('mongoose');
var logger = require("morgan");

//scraping tools
var cheerio = require("cheerio");
var axios = require("axios");

var PORT = process.env.PORT || 8889;

var db = require("./models");
var app = express();

// log requests
app.use(logger("dev"));

// expqress to handle data parsing
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// directory
app.use(express.static("public"));
  
// Heroku
var MONGODB_URI = process.env.MONGODB_URI || "mongodb://<dbuser>:<dbpassword>@ds157956.mlab.com:57956/heroku_fn39445t";
mongoose.connect(MONGODB_URI, { useNewUrlParser: true });

require("./routes/api-routes.js")(app); 

// Start the server
app.listen(PORT, function() {
    console.log("App running on port http://localhost:" + PORT + "/");
});