var express    = require("express");
var  app = express();
var bodyparser = require("body-parser");
var mongoose = require("mongoose");
var passport = require("passport");
var LocalStrategy = require("passport-local");
var User = require("./models/user");
var Post = require("./models/post");
var Comments = require("./models/comments");
var methodOverride = require('method-override');
var seedDB      = require("./seeds");

// var result = {
//     data  : String 
// };
// var data;
app.use(bodyparser.urlencoded({extended  : true}));
mongoose.connect("mongodb://localhost:27017/login", {useNewUrlParser: true});
mongoose.set("useFindAndModify", false);
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(express.static("./library"));
app.use(methodOverride('_method'));

seedDB();

// PASSPORT CONFIGURATION
app.use(require("express-session")({
    secret: "Once again Rusty wins cutest dog!",
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(function(req, res, next){
	res.locals.currentUser = req.user;
	next();
});

// For SignUp.
app.post("/signup",function(req,res){
//   var newUser = new User({username: req.body.username});
	// var date = req.body.dob.toDateString();
	// console.log(date);
	var newUser = new User(
		{
			username: req.body.username,
    dob: req.body.dob,
    email: req.body.email,
    bio: req.body.bio,
    image: req.body.image,
    phoneNumber: req.body.phoneNumber
			
		}
	)
	// User.create(newUser, function(err, userCreated){
	// 	if(err){
	// 		console.log(err);
	// 	}
	// 	else{
			User.register(newUser, req.body.password, function(err, user){
				if(err){
					console.log(err);
					return res.render("signup");
				}
				passport.authenticate("local")(req, res, function(){
				  res.redirect("/home");
				});
			  });
		// }
	// })
});

// For login
app.post("/login", passport.authenticate("local", 
	{
		successRedirect: "/home",
		failureRedirect: "/login"
    }), function(req, res){ 
});

// For logout
app.get("/logout", function(req, res){
    req.logout();
    res.redirect("/home");
});

function isLoggedIn(req, res, next){
	if(req.isAuthenticated()){
		return next();
	}
	res.redirect("/login");
}

// app.get("/oops",function(req,res){
//     res.render("test",{data : data});
// });
app.get("/home",function(req,res){
 res.render("home");
});

app.get("/socialPosts",function(req,res)
{
	var foundPosts = [];
	User.find({}, function(err, foundUsers)
	{
		if(err)
		{
			console.log(err);
		}
		else
		{
			for(var i=0; i < foundUsers.length; i++)
			{
				foundUsers[i].execPopulate(function(err, completeUser)
				{
					console.log("=====================")
					console.log(completeUser);
					console.log("=====================")
					Post.findById(completeUser.Post._id, function(err, post){
						if(err)
						{
							console.log(err);
						}
						else
						{
							foundPosts.push(post);
						}
					})
				})
			}
			console.log(foundPosts);
			res.render("socialPosts", {
				users: foundUsers,
				posts: foundPosts
			});
		}
	})

})

app.get("/user/:id", function(req, res){
	User.findById(req.params.id, function(err, foundUser){
		if(err){
			console.log(err);
		}
		else{
			res.render("user", {user: foundUser});
		}
	})
})

app.get("/user/:id/settings", function(req, res){
	User.findById(req.params.id, function(err, foundUser){
		if(err){
			console.log(err);
		}
		else{
			res.render("setting", {user: foundUser});
		}
	})
});

app.put("/user/:id", function(req, res){
	var updatedUser = {
		username: req.body.username,
		password: req.body.password,
email: req.body.email,
bio: req.body.bio,
image: req.body.image,
phoneNumber: req.body.phoneNumber

	}

	console.log(updatedUser);

	User.findByIdAndUpdate(req.params.id, updatedUser,  function(err, foundUser){
		if(err){
			console.log(err);
		}
		else {
		  var showUrl = "/user/" + foundUser._id;
		  foundUser.save();
		  res.redirect(showUrl);
		}
	});

 });

app.get("/circular",function(req,res){
	res.render("circular");
});

app.get("/awareness",function(req,res){
	res.render("awareness");
});

app.get("/about",function(req,res){
	res.render("about");
});

app.get("/login",function(req,res){
	res.render("login");
});

app.get("/signup",function(req,res){
	res.render("signup");
});

app.get("/QR",function(req,res){
	res.render("QR");
});

app.post("/new",function(req,res){
   var data = req.body.data;
   console.log(data);
});

app.get("/leaderboard",function(req,res){
	User.find({}, function(err, foundUsers){
		if(err){
			console.log(err);
		}
		else
		{
			var i, j, t;
			for(i = 1; i < foundUsers.length; i++)
			{
				for(j = 0; j < foundUsers.length - i; j++){
					if(foundUsers[j].coins < foundUsers[j+1].coins)
					{
						t = foundUsers[j].coins;
						foundUsers[j].coins = foundUsers[j+1].coins;
						foundUsers[j+1].coins = t;
					}
				}
			}
			res.render("leaderboard", {users: foundUsers});
		}
	});
 });

app.listen(3020,function(req,res){
console.log("Start");
}) ;
