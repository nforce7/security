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
const GoogleStrategy= require('passport-google-oauth20').Strategy;
const findOrCreate = require("mongoose-findorcreate")

//Finishing up the app :Letting users submit secrets
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
    password: String,
    googleId: String
})

//the fifth step is to set up passport-local-mongoose
//we have to add it to our mongoose schema (userSchema) as a plugin
//we use this to salt and hash our passwords and save users to our database
userSchema.plugin(passportLocalMongoose);
//We configure findorcreate (from npm package mongoose-findorcreate)
userSchema.plugin(findOrCreate);

const User = new mongoose.model("User", userSchema);

//the next step is to initialize passport. This code must go after the mongoose model
// Serialize and deserialize is only needed for sessions using passport
passport.serializeUser(function (user, done) {
    done(null, user.id);
});

passport.deserializeUser(function (id, done) {
    User.findById(id)
        .then((user) => {
            done(null, user);
        })
        .catch((err) => {
            done(err, null);
        });
});

//Code from passport documentation for google OAuth
//Here we set up options for Google strategy
passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    console.log(profile);
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));


app.get("/", function(req, res) {
    res.render("home");
})

//we configure google authentication when the user clicks the "sign in with google" button
app.get("/auth/google", passport.authenticate("google", { scope: ["profile"] }));

//here google redirects the user to the /auth/google/secrets on our local server for local authentication
app.get("/auth/google/secrets", passport.authenticate("google", { failureRedirect: "/login" }), function(req, res) {
    // Successful authentication, redirect home.
    res.redirect("/secrets");
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






