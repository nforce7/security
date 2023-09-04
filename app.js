//jshint esversion
require('dotenv').config(); //npm install dotenv
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const app = express();
const mongoose = require("mongoose");
const session = require("express-session"); //the first step is to require express-session
const passport = require("passport"); //the second step is to require passport
const passportLocalMongoose = require("passport-local-mongoose"); //the third step is to require passport-local-mongoose

//start adding mongoose encryption level6 : google Oauth 2.0
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended: true}));

//the fourth step is to set up the session
app.use(session({
    secret: "Our little secret.",
    resave: false,
    saveUninitialized: false
}));

//the next step is to require passport and to initialize it
app.use(passport.initialize());
app.use(passport.session());

//setup mongoose, userSchema and Model 
mongoose.connect("mongodb://127.0.0.1:27017/userDB", {useNewUrlParser: true, useunifiedTopology: true});
const userSchema = new mongoose.Schema({
    email: String,
    password: String
})

//the fifth step is to set up passport-local-mongoose
//we have to add it to our mongoose schema (userSchema) as a plugin
//we use this to salt and hash our passwords and save users to our database
userSchema.plugin(passportLocalMongoose);

const User = new mongoose.model("User", userSchema);

//the next step is to initialize passport. This code must go after the mongoose model
passport.use(User.createStrategy());
//serialize and deserialize is only needed for sessions
passport.serializeUser(User.serializeUser());  //to store the user in the session
passport.deserializeUser(User.deserializeUser()); //to retrieve the user from the session

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

app.get("/secrets", function(req, res) {
    if (req.isAuthenticated()) {
        res.render("secrets");
    } else {
        res.redirect("/login");
    }
})

app.get("/logout", function(req, res) {
    req.logout(function(err) {
      if (err) {
        console.error(err);
        return res.status(500).send(err);
      }
      // Redirect to the home page or any other page after successful logout
      res.redirect("/");
    });
  });

app.listen(3000, function() {
    console.log("Server started on port 3000");
})

//the next step is to set up the routes :register and login
app.post("/register", async function(req, res) {
    User.register({username: req.body.username}, req.body.password, function(err, user) {
        if (err) {
            console.log(err);
            res.redirect("/register");
        } else {
            passport.authenticate("local")(req, res, function() {
                res.redirect("/secrets");  //if authentification is successful, we redirect the user to the secrets page
            })
        }
    })
});

app.post("/login", async function(req, res) {
   //if user is registered, we authenticate the user
   const user = new User({
       username: req.body.username,
       password: req.body.password
   })
   req.login(user, function(err) {
       if (err) {
           console.log(err);
       } else {
           passport.authenticate("local")(req, res, function() {
               res.redirect("/secrets");
           })
       }
   })
});






