//scraping tools
const axios = require("axios");
const cheerio = require("cheerio");

//import database models
const db = require("../models");

//create router function to export
const router = function (app) {

    //default route to render page with all currently saved articles
    app.get("/", function (req, res) {
        db.Article.find({}, function (err, data) {
            if (err) {
                return console.log(err);
            }
            res.render("index", { articles: data })
        })
    });

    //get request to render one article and its comments based on button click
    app.get("/articles/:id/", function (req, res) {
        db.Article.find({ _id: req.params.id })
            .populate("commentId")
            .exec(function (err, data) {
                if (err) {
                    return console.log(err);
                }
                res.render("comments", { articles: data });
            });
    });

    //post request to submit a comment associated with an article
    app.post("/articles/:id/", function (req, res) {
        //prevent empty comments
        if (req.body.body.trim().length === 0) {
            res.redirect("/");
        };
        //create comment document in database
        db.Comment.create(req.body, function (err, comment) {
            if (err) {
                return console.log(err);
            }
            //connect newly made comment to Article by storing Comment id in Article document
            db.Article.updateOne({ _id: req.params.id }, { $push: { commentId: comment._id } },
                function (err, data) {
                    if (err) {
                        return console.log(err);
                    }
                    //refresh the page
                    res.redirect("/articles/" + req.params.id);
                });
        });
    });

    //post request to delete comments from an article
    app.post("/articles/delete/:id/", function(req, res){
        db.Comment.findByIdAndDelete({_id: req.params.id},
            function(err, deleted){
                if (err){
                    return console.log(err);
                }
                //also remove the Article's reference to the deleted comment
                db.Article.updateOne({_id: req.body.articleId}, {$pull: {commentId: req.params.id}},
                    function(err, data) {
                        if (err){
                            return console.log(err);
                        }
                        //go back to the previous page with all comments except for the deleted one
                        res.redirect("back");
                    });
            });
    });

    //get request to scrape clickhole
    app.get("/scrape", function (req, res) {
        axios.get("https://www.clickhole.com/c/news").then(function (response) {

            //load cheerio with html from clickhole
            const $ = cheerio.load(response.data);

            //for each post, scrape selected data and add it to an array
            $("article").each(function (i, element) {
                const title = $(element).find("h1").text();

                //check database for redundant articles
                db.Article.findOne({ title: title }, function (err, data) {
                    if (err) {
                        return console.log(err);
                    }
                    if (data) {
                        return false;
                    }
                    //only perform additional actions if not already in database
                    else {
                        const link = $(element).find("figure").find("a").attr("href");
                        //perform another get request using the link from each post to get the first paragraph as sample text
                        axios.get(link).then(function (nestedResponse) {
                            const $$ = cheerio.load(nestedResponse.data);
                            const imgUrl = $$("figure").find("picture").children("img").attr("src");
                            const firstP = $$(".post-content.entry-content.js_entry-content").find("p").first().text().substring(0, 201);
                            const article = {
                                title: title,
                                imageUrl: imgUrl,
                                link: link,
                                summary: firstP + " ..."
                            };
                            //add articles to the database
                            db.Article.create(article).catch(err => console.log(err));
                        });
                    }
                });

            });

            res.send("Scrape complete. Go back to the previous page. (You may need to wait before refreshing)");
        });
    });

    //post request to delete all articles and their comments
    app.post("/clear", function(req, res) {
        db.Article.remove({}, function(err, data) {
            if (err) {
                console.log(err);
            }
            db.Comment.remove({}, function(err, data) {
                if (err) {
                    console.log(err);
                }
                res.redirect("/");
            });
        });
    });

};

module.exports = router;