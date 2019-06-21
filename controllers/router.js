//scraping tools
const axios = require("axios");
const cheerio = require("cheerio");

//import database models
const db = require("../models");

//create router function to export
const router = function (app) {

    app.get("/", function (req, res){
        db.Article.find({}, function(err, data){
            if (err){
                return console.log(err);
            }
            res.render("index", {articles: data})
        })
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
                db.Article.findOne({title: title}, function(err, data){
                    if (err) {
                        return console.log(err);
                    }
                    if (data) {
                        return console.log("Already in db: " + i)
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

            res.send("Scrape complete.")
        });
    });




};

module.exports = router;