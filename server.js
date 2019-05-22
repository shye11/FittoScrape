var express = require('express');
var mongoose = require('mongoose');
var logger = require("morgan");
var expbhs = require("express-handlebars");

//scraping tools
var cheerio = require("cheerio");
var axios = require("axios");

var PORT = process.env.PORT || 8880;

var db = require("./models");
var app = express();

// log requests
app.use(logger("dev"));

// expqress to handle data parsing
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// directory
app.use(express.static("./public"));

//handlebars
app.engine("handlebars", expbhs({ defaultLayout: "main" }));
app.set("view engine", "handlebars");
  
// Heroku
var MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/fittoscrapedb";
mongoose.connect(MONGODB_URI, { useNewUrlParser: true });

require("./routes/api-routes.js")(app);
require("./routes/html-routes.js")(app);  

// Start the server
app.listen(PORT, function() {
    console.log("App running on port http://localhost:" + PORT + "/");
});