//jshint esversion
require('dotenv').config(); //npm install dotenv
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const app = express();
const mongoose = require("mongoose");
const bcrypt = require("bcrypt"); //we added bcrypt (hashing) for data encryption
const saltRounds = 10;  //we added saltRounds for data encryption

//start adding mongoose encryption level4a: hashing and salting (using bcrypt)
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

/* In the register route, bcrypt.hash is used to hash the password with a specified number of salt rounds 
(which increases the security of the hashing process). The resulting hashed password is then stored
 in the newUser object and saved to the database. */

app.post("/register", async function(req, res) {
    const plainPassword = req.body.password;

    // Hash the password using bcrypt
    try {
        const hashedPassword = await bcrypt.hash(plainPassword, saltRounds);

        const newUser = new User({
            email: req.body.username,
            password: hashedPassword
        });
        // Save the user
        await newUser.save();
        res.render("secrets");
    } catch (err) {
        console.log(err);
        res.status(500).send("An error occurred while registering.");
    }
});


/* in the login route, bcrypt.compare is used to compare the plain password provided in the login request 
with the hashed password stored in the database for the corresponding user. If the passwords match, 
the user is logged in and can access the secrets page. If the passwords don't match or the user is not found,
 appropriate error responses are sent. */

app.post("/login", async function(req, res) {
    const username = req.body.username;
    const plainPassword = req.body.password;

    try {
        const foundUser = await User.findOne({ email: username });

        if (foundUser) {
            // Compare the hashed password with the plain password using bcrypt.compare
            const passwordsMatch = await bcrypt.compare(plainPassword, foundUser.password);

            if (passwordsMatch) {
                res.render("secrets");
            } else {
                res.status(401).send("Incorrect password");
            }
        } else {
            res.status(404).send("User not found");
        }
    } catch (err) {
        console.log(err);
        res.status(500).send("An error occurred while logging in.");
    }
});






