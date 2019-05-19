const axios = require("axios");
const cheerio = require("cheerio");
const db = require("../models");

module.exports = app => {
    // catch all route
    app.get("/", (req, res) => {
        db.Article.find({}).then(savedArticles => {
            res.render("index",{ 
                totalArticles: savedArticles.length,
                page_title: "home" 
            });
        }); 
    });
    // get all saved articles
    app.get("/saved", (req, res) => {
        db.Article.find({})
            .sort({'timeStamp':'desc'})
            .then(savedArticles => {
                res.render("index",{ 
                    data: savedArticles, 
                    totalArticles: savedArticles.length,
                    page_title: "saved"
                });
            });
        });
        
    // scrape data from engadget
    app.get("/scrape", (req, res) => {
        let source = "https://www.engadget.com/";
        axios.get(source).then( response => {

        // Load the HTML into cheerio and save it to a variable
        // '$' becomes a shorthand for cheerio's selector commands, much like jQuery's '$'
        const $ = cheerio.load(response.data);

        // An empty array to save the data that we'll scrape
        const results = [];
        let articleCount = 0;

            db.Article.find({}).then( savedArticles => {
                articleCount = savedArticles.length
                
                // create a new object to be used to check 
                // if it article is already saved on the DB using title as a key
                var savedArticlesOnDB = {};
                savedArticles.map( article => {
                    savedArticlesOnDB[article.title] = {};
                    savedArticlesOnDB[article.title]._id = article._id
                    savedArticlesOnDB[article.title].comments = article.comments
                    savedArticlesOnDB[article.title].timeStamp = article.timeStamp
                });

                //console.log("savedArticles",savedArticles);
                //console.log("savedArticlesOnDB",savedArticlesOnDB);

                $("article.o-hit").each((i, element) => {
                    
                    var image = $(element).find(".lazy,.stretch-img").attr('data-original') || "";
                    var title = $(element).find("h2").text().trim() || "";
                    var excerpt =  $(element)
                                .find("p")
                                .text()
                                .trim() || "";
                    var link = $(element)
                                .find(".o-hit__link")
                                .attr("href")
                                .split("?")[0];
                    
                    var category = $(element)
                                .find(".th-topic")
                                .text()
                                .trim();

                    // add a link in case it is left it out
                    if(link.indexOf("https://www.engadget.com") == -1){
                        link = 'https://www.engadget.com'+link;
                    }

                    if(title && image){

                        // check each article if it's in the saveArticles and include ID
                        var data = {
                            title: title,
                            image: image,
                            category: category,
                            excerpt: excerpt,
                            source: source,
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
                });

            // Log the results once you've looped through each of the elements found with cheerio
            //console.log(results);
            res.render("index",{ 
                data: results, 
                totalArticles: articleCount,
                page_title: "scrape"
            });
            }).catch(error => console.log(error));
        });
    });

    // save article to DB
    app.post("/save",(req, res) => {
        db.Article.create(req.body)
        .then(dbArticle => res.json(dbArticle))
        .catch(function(err) {
          // If an error occurred, log it
          console.log(err);
          res.json(err);
        });
    });

    // delete article, delete all associated comments from DB
    app.post("/delete",(req, res) => {
        // delete all related comments
        db.Comment.deleteMany({ 
            article: req.body._id
        }, 
        function (err) {
            // delete article
            db.Article.deleteOne({ _id: req.body._id }, function(err){
                if (!err) {
                    console.log()
                    res.json(req.body._id);
                }
                else {
                    res.json("failed remove "+req.body._id);
                }
            }); 
        });
    });

    // Get all comments referenced to an Article
    app.get("/comment/:id", (req, res) => {
        // Using the id passed in the id parameter, prepare a query that finds the matching one in our db...
        db.Article.findOne({ _id: req.params.id })
        // ..and populate all of the notes associated with it
        .populate("comments.comment")
        .then(dbArticle => res.json(dbArticle))
        // If we were able to successfully find an Article with the given id, send it back to the client
        .catch(function(err) {
            // send error to client
            res.json(err);
        });
    });

    // Delete comment
    app.post("/comment/delete/:id/:articleId", (req, res) => {
        
        let articleId = req.params.articleId;
        let commentId = req.params.id;

        db.Article.findOneAndUpdate({ 
            _id: articleId
        },{ 
            "$pull": {
                comments: { comment : commentId }
            }
        },{ multi: true, new: true }, (error, doc) => {
            if(!error){
                db.Comment.deleteOne({ _id: commentId }, function(err){
                    if (err) {
                        res.json("failed remove "+commentId);
                    }
                });
            }
        })
        .populate("comments.comment")
        .exec((err,dbUpdate) => res.json(dbUpdate));
    });

    // Save comment to DB and associate to Article
    app.post("/comment/:id", (req, res) => {
        // Create a new comment and pass the req.body to the entry
        db.Comment.create(req.body)
        .then(dbComment => {
            // If a Comment was created successfully, find one Article with an `_id` equal to `req.params.id`. Update the Article to be associated with the new Comment
            // { new: true } tells the query that we want it to return the updated User -- it returns the original by default
            // Since our mongoose query returns a promise, we can chain another `.then` which receives the result of the query   
            return db.Article.findOneAndUpdate({ 
                _id: req.params.id 
            },{ 
                "$push": {
                    comments: { comment: dbComment._id }
                }
            },{ 
                new: true 
            }).populate("comments.comment");
        })
        .then(dbArticle => res.json(dbArticle))
        .catch(err => res.json(err));
    });
}
