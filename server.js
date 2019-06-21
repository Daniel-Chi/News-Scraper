const express = require("express");
const mongoose = require("mongoose");
const exphbs = require("express-handlebars");

//import router
const router = require("./controllers/router");

//create server and set port
let app = express();
const PORT = process.env.PORT || 3000;

//middleware to parse request body as JSON
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

//set up handlebars templating engine
app.engine("handlebars", exphbs({ defaultLayout: "main" }));
app.set("view engine", "handlebars");

//use heroku MongoDB or local MongoDB to connect with mongoose
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/mongoHeadlines";
mongoose.connect(MONGODB_URI, { useNewUrlParser: true });

//call router and pass in app
router(app);

//start server
app.listen(PORT, function() {
    console.log("Server using PORT: " + PORT);
  });