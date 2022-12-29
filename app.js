require('dotenv').config();
const express=require("express")
const ejs=require("ejs");
const mongoose = require("mongoose");
const session=require('express-session')
const passport=require('passport')
const passportLocalMongoose=require('passport-local-mongoose')
const GoogleStrategy = require('passport-google-oauth20').Strategy;
var FacebookStrategy = require('passport-facebook');
const findOrCreate = require('mongoose-findorcreate')



const app=express();

app.use(express.static("public"));
app.set("view engine",'ejs');
app.use(express.urlencoded({
    extended:true
}));

app.use(session({
    secret:"Our little secret",
    resave:false,
    saveUninitialized:false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.set("strictQuery",false);
mongoose.connect("mongodb://127.0.0.1:27017/userDB",{
  useNewUrlParser: true ,
  useUnifiedTopology:true 
})
const userSchema=new mongoose.Schema({
    email:String,
    password:String,
    secret:String
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User= mongoose.model('User',userSchema);


passport.use(User.createStrategy());

passport.serializeUser(function(user, cb) {
    process.nextTick(function() {
      return cb(null, {
        id: user.id,
        username: user.username,
        picture: user.picture
      });
    });
  });
  
  passport.deserializeUser(function(user, cb) {
    process.nextTick(function() {
      return cb(null, user);
    });
  }); 

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets"
  },
  function(accessToken, refreshToken, profile, cb) {
  //  console.log(profile);
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

passport.use(new FacebookStrategy({
    clientID: process.env.FB_CLIENT_ID,
    clientSecret: process.env.FB_CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/facebook/secrets"
  },
  function(accessToken, refreshToken, profile, cb) {
  //  console.log(profile);
    User.findOrCreate({ facebookId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));


app.get("/",function(req,res){
    res.render('home')
});

app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile'] }));

app.get('/auth/google/secrets', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect secrets page.
    res.redirect('/secrets');
  });

  app.get('/auth/facebook',
  passport.authenticate('facebook'));

app.get('/auth/facebook/secrets',
  passport.authenticate('facebook', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/secrets');
  });

app.get("/secrets",function(req,res){
    if(req.isAuthenticated()){
        User.find({secret:{$ne: null}},function(err,foundUsers){
            if(!err){
                res.render("secrets",{UserList: foundUsers});
            }
        })
      
    }
    else 
    res.redirect("/login")
});
app.get("/login",function(req,res){
    res.render('login')
})

app.get("/register",function(req,res){
    res.render('register')
});

app.get("/logout",function(req,res){
    req.logout(function(err) {
        if (err) { return next(err); }
        res.redirect('/');
    })
})

app.post('/register',function(req,res){
   
    User.register({username:req.body.username}, req.body.password, function(err, user) {
        if (err) {  
            console.log(err);
            res.redirect("/register")
        }
        else{
            passport.authenticate("local")(req,res,function(){
              res.redirect("/secrets")
            });
          
        }

    })
})

app.post("/login", passport.authenticate("local"), function(req, res){
    res.redirect("/secrets");
});

app.get("/submit",function(req,res){
    if(req.isAuthenticated())
    res.render('submit')
    else
    res.redirect("/login")
})
app.post("/submit",function(req,res){
    const submittedSecret=req.body.secret
    User.findById(req.user.id,function(err,foundUser){
        if(!err){
            foundUser.secret=submittedSecret
           // console.log(foundUser)
              foundUser.save();
                    res.redirect('/secrets')         
        }     
    })
})


app.listen(3000, function(){
    console.log("server listening on port 3000");
})