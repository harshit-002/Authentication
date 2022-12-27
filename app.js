require('dotenv').config();
const express=require("express")
const ejs=require("ejs");
const mongoose = require("mongoose");
const encrypt = require("mongoose-encryption");



const app=express();

mongoose.set("strictQuery",false);
mongoose.connect("mongodb://127.0.0.1:27017/userDB",{
  useNewUrlParser: true ,
  useUnifiedTopology:true 
})

const userSchema=new mongoose.Schema({
    email:String,
    password:String
});

const User= mongoose.model('User',userSchema);

userSchema.plugin( encrypt, {secret: process.env.SECRET, encryptedFields:['password']} );

app.use(express.static("public"));
app.set("view engine",'ejs');
app.use(express.urlencoded({
    extended:true
}));

app.get("/",function(req,res){
    res.render('home')
});
app.get("/login",function(req,res){
    res.render('login')
});
app.get("/register",function(req,res){
    res.render('register')
});

app.post('/register',function(req,res){
    const newUser=new User({
    email:req.body.username,
    password:req.body.password
    }) 

    newUser.save(function(err){
        if(!err)
        res.render('secrets')
        else
        console.log(err);
    });
})

app.post('/login',function(req,res){
    User.findOne({email:req.body.username},function(err,foundUser){
        if(err)
        res.send("User not found")
        else{
            if(foundUser.password===req.body.password){
                res.render('secrets')
            }
            else{
                res.send("Incorrect password")
            }
        }
    })
})



app.listen(3000, function(){
    console.log("server listening on port 3000");
})