//jshint esversion
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const app = express();
const mongoose = require("mongoose");

//start aadding mongoose encryption

app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended: true}));

//setup mongoose, userSchema and Model
mongoose.connect("mongodb://127.0.0.1:27017/userDB", {useNewUrlParser: true, useunifiedTopology: true});
const userSchema = new mongoose.Schema({
    email: String,
    password: String
})
const User = new mongoose.model("User", userSchema);


app.get("/", function(req, res) {
    res.render("home");
})

app.get("/login", function(req, res) {
    res.render("login");
})

app.get("/register", function(req, res) {
    res.render("register");
})



app.get("/compose", function(req, res) {
    res.render("compose");
})




app.listen(3000, function() {
    console.log("Server started on port 3000");
})

//when the user enters their username and passwors and clicks the submit button, 
//the form will be submitted to the server
//using post reguest to the register route (See register.ejs)

app.post("/register", async function(req, res) {
    const newUser = new User({
        email: req.body.username,
        password: req.body.password
    });

    //save the user
    //only if the new user is registered, he can see the secrets page
   try{
    await newUser.save();
    res.render("secrets");
   } catch(err){
       console.log(err);
   }
});

app.post("/login", async function(req, res) {
    const username = req.body.username;
    const password = req.body.password;
    try{
        const foundUser = await User.findOne({email: username});
        if(foundUser){
            if(foundUser.password === password){
                res.render("secrets");
            }
        }
    } catch(err){
        console.log(err);
    }
})