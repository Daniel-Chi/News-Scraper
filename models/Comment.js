const mongoose = require("mongoose");
const Schema = mongoose.Schema;

//use Schema constructor from mongoose to create an Comment object template
const CommentSchema = new Schema ({
    body: {
        type: String,
        required: true
    }
})

//use mongoose model method to create the model based on the above template
const Comment = mongoose.model("Comment", CommentSchema)

// export db model for Comments
module.exports = Comment;