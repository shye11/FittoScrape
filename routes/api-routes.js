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
        
    // scrape data from deadline
    app.get("/scrape", (req, res) => {
        let source = "https://deadline.com/";
        axios.get(source).then( response => {

        // Load the HTML into cheerio and save it to a variable
        // '$' becomes a shorthand for cheerio's selector commands
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

                $("article.o-hit").each((i, element) => {
                    
                    var image = $(element).find(".lazy,.stretch-img").attr('data-original') || "";
                    var title = $(element).find("h2").text().trim() || "";
                    var tagline =  $(element)
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
                    if(link.indexOf("https://deadline.com/") == -1){
                        link = 'https://deadline.com/'+link;
                    }

                    if(title && image){

                        var data = {
                            title: title,
                            figure: figure,
                            category: category,
                            byline: byline,
                            source: source,
                            link: link
                        }
                        
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
          console.log(err);
          res.json(err);
        });
    });

    // delete article, delete all associated comments from DB
    app.post("/delete",(req, res) => {
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

    app.get("/comment/:id", (req, res) => {
        db.Article.findOne({ _id: req.params.id })
        .populate("comment.comments")
        .then(dbArticle => res.json(dbArticle))
        .catch(function(err) {
            res.json(err);
        });
    });

    // Delete
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
        .populate("comment.comments")
        .exec((err,dbUpdate) => res.json(dbUpdate));
    });

    // Save comment to database & associate to article
    app.post("/comment/:id", (req, res) => {
        db.Comment.create(req.body)
        .then(dbComment => {  
            return db.Article.findOneAndUpdate({ 
                _id: req.params.id 
            },{ 
                "$push": {
                    comments: { comment: dbComment._id }
                }
            },{ 
                new: true 
            }).populate("comment.comments");
        })
        .then(dbArticle => res.json(dbArticle))
        .catch(err => res.json(err));
    });
}
