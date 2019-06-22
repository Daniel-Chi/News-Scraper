const mongoose = require("mongoose");
const Schema = mongoose.Schema;

//use Schema constructor from mongoose to create an Article object template
const ArticleSchema = new Schema ({
    title: {
        type: String,
        required: true
    },
    summary: {
        type: String
    },
    link: {
        type: String,
        required: true
    },
    imageUrl: {
        type: String
    },
    //store associated Comment Ids in order to get associated comments later
    commentId: [{
        type: Schema.Types.ObjectId,
        ref: "Comment"
    }]
});

//use mongoose model method to create the model based on the above template
const Article = mongoose.model("Article", ArticleSchema)

// export db model for Articles
module.exports = Article;