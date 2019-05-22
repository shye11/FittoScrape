const axios = require("axios");
const cheerio = require("cheerio");
const db = require("../models");
const path = require("path");

module.exports = app => {

    // get all saved articles
    app.get("/saved", (req, res) => {
        db.Article.find({})


        });
        
    // scrape data from deadline
    app.get("/scrape", (req, res) => {
        let source = "https://deadline.com/";
        axios.get(source).then( response => {


            res.render("index",{ 
                data: results, 
                totalArticles: articleCount,
                page_title: "scrape"
            });
            }).catch(error => console.log(error));
        });

    // save article to DB
    app.post("/save",(req, res) => {
        db.Article.create(req.body)
        .then(dbArticle => res.json(dbArticle))
        .catch(function(err) {
          console.log(err);
          res.json(err);
        });
    });

    // delete article, delete all associated comments from DB
    app.post("/delete",(req, res) => {

    });

    app.get("/comment/:id", (req, res) => {

        });


    // Delete
    app.post("/comment/delete/:id/:articleId", (req, res) => {
        

    });

    // Save comment to database & associate to article
    app.post("/comment/:id", (req, res) => {

    });
}
