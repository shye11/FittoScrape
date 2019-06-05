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
            const $ = cheerio.load(response.data);
            const results = [];
            let articleCount = 0;

            db.Article.find({}).then( savedArticles => {
                articleCount = savedArticles.length
                
                var savedArticlesOnDB = {};
                savedArticles.map( article => {
                    savedArticlesOnDB[article.title] = {};
                    savedArticlesOnDB[article.title]._id = article._id
                    savedArticlesOnDB[article.title].comments = article.comments
                    savedArticlesOnDB[article.title].timeStamp = article.timeStamp
                });

            $("div.pmc-a-grid-item").each(function(i, element) {
                var title = $(element).find("h3").text().trim() || "";
                var link = $(element).find(".c-title__link").attr("href");
                var tagline =  $(element).find(".c-tagline").text().trim() || "";
                var image = $(element).find(".c-figure__image ").attr("src") || "";
                var category = $(element).find(".c-label").text().trim();
            
                if(link.indexOf("https://deadline.com") == -1){
                        link = 'https://deadline.com'+link;
                    }

                    if(title && image){

                        // check each article if it's in the saveArticles and include ID
                        var data = {
                            title: title,
                            image: image,
                            category: category,
                            tagline: tagline,
                            link: link
                        }
                        
                        // console.log("savedArticlesOnDB[title]",savedArticlesOnDB[title]);
                        if(savedArticlesOnDB[title]){
                            let articleObj = savedArticlesOnDB[title];
                            data._id = articleObj._id;
                            data.comments = articleObj.comments;
                            data.timeStamp = articleObj.timeStamp;
                        } else {
                            data._id = "";
                        }                        
                        results.push(data);              
                    }
                    console.log(results);
                });

              });

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
};
