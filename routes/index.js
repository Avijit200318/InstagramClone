var express = require('express');
var router = express.Router();
const userModel = require("./users");
const postModel = require("./posts");
const passport = require("passport");
const localStrategy = require("passport-local");
const upload = require("./multer");

passport.use(new localStrategy(userModel.authenticate()));

router.get('/', function (req, res) {
  res.render('index', { footer: false, error: req.flash("error") });
});

router.get('/login', function (req, res) {
  res.render('login', { footer: false, error: req.flash("error") });
});

router.get('/feed', isLoggedIn, async function (req, res) {
  const posts = await postModel.find().populate("user");
  const user = await userModel.findOne({username: req.session.passport.user});
  console.log(user);
  // console.log(posts);
  res.render('feed', { footer: true, posts: posts, user: user});
});

router.get('/profile', isLoggedIn, async function (req, res) {
  const user = await userModel.findOne({username: req.session.passport.user}).populate("posts");
  res.render('profile', { footer: true, user: user});
});

router.get('/search', isLoggedIn, async function (req, res) {
  const user = await userModel.findOne({username: req.session.passport.user})
  res.render('search', { footer: true, user: user });
});

router.get('/edit', isLoggedIn, async function (req, res) {
  const user = await userModel.findOne({username: req.session.passport.user});
  res.render('edit', { footer: true, user: user, error: req.flash("error")});
});

router.get('/upload', isLoggedIn, async function (req, res) {
  const user = await userModel.findOne({username: req.session.passport.user})
  res.render('upload', { footer: true, user: user});
});

router.get("/username/:inputUsername",isLoggedIn, async function(req, res) {
  const regex = new RegExp(`^${req.params.inputUsername}`, 'i');
  const users = await userModel.find({username: regex});
  res.json(users);
})

router.get("/like/post/:id", isLoggedIn, async function(req, res){
  const user = await userModel.findOne({username: req.session.passport.user});
  const post = await postModel.findOne({_id: req.params.id});
  console.log(post);
  console.log(user);

  // if already like then remove like. if not like then add like
  if(post.likes.indexOf(user._id) === -1){
    post.likes.push(user._id);
  }else{
    post.likes.splice(post.likes.indexOf(user._id), 1);
    // splice(index, and no); -> index = from which index we need to remove and no = how many element we want to remove from it.
  }
  await post.save();
  res.redirect("/feed");
})

router.get("/post/find/:postId", isLoggedIn, async function(req, res) {
  // const posts = await postModel.find().populate("user");
  const postId =req.params.postId; 
  const post = await postModel.findOne({_id: postId}).populate("user");
  const postUser = await userModel.findOne({_id: post.user._id}).populate("posts");
  const user = await userModel.findOne({username: req.session.passport.user});
  // console.log(post);
  console.log(user._id);
  console.log(post.user._id);
  res.render("posts", {footer: true, post: post, postUser: postUser, user: user});
})

router.get("/like/mypost/:id", isLoggedIn, async function(req, res){
  const user = await userModel.findOne({username: req.session.passport.user});
  const post = await postModel.findOne({_id: req.params.id});

  // if already like then remove like. if not like then add like
  if(post.likes.indexOf(user._id) === -1){
    post.likes.push(user._id);
  }else{
    post.likes.splice(post.likes.indexOf(user._id), 1);
    // splice(index, and no); -> index = from which index we need to remove and no = how many element we want to remove from it.
  }
  await post.save();
  res.redirect(`/post/find/${req.params.id}`);
  // since the route is a variable so we can use this to redirect the same route.
})

router.get("/settings", isLoggedIn, async function(req, res) {
  const user = await userModel.findOne({username: req.session.passport.user});
  res.render("settings", {footer: true, user: user});
})

router.get("/follow/:userId", isLoggedIn, async function(req, res) {
  const user = await userModel.findOne({username: req.session.passport.user});
  const followUser = await userModel.findOne({_id: req.params.userId});
  console.log(followUser);
  
  if(followUser.followers.indexOf(user._id) === -1){
    followUser.followers.push(user._id);
    user.following.push(followUser._id);
  }else{
    followUser.followers.splice(followUser.followers.indexOf(user._id), 1);
    user.following.splice(user.following.indexOf(followUser._id), 1);
  }
  await followUser.save();
  await user.save();
  res.redirect(`/profile/${req.params.userId}`);
})

router.get("/profile/:userId", isLoggedIn, async function(req, res) {
  const user = await userModel.findOne({username: req.session.passport.user}).populate("posts");
  const clickUser = await userModel.findOne({_id: req.params.userId}).populate("posts");
  if(user._id.toString() === clickUser._id.toString()){
    res.redirect("/profile");
  }
  res.render("clickProfile", { footer: true, user: user, clickUser: clickUser});
})


router.get("/following/:userId", isLoggedIn, async function(req, res) {
  const user = await userModel.findOne({_id: req.params.userId});
  const ans = [];

    // Using map to asynchronously fetch data for each followed user
    // following contain all the user id so we user map to get the real data of these user and then send to it the route.
    const promises = user.following.map(async function(ele) {
      let followUser = await userModel.findOne({ _id: ele });
      ans.push(followUser);
    });

    // Wait for all promises to resolve
    await Promise.all(promises);

    // console.log(ans);

  res.render("following", {footer: true, followUser: ans, user: user, active: 'following'});
})

router.get("/followers/:userId", isLoggedIn, async function(req, res){
  const user = await userModel.findOne({_id:req.params.userId});
  const ans = [];
  const promises = user.followers.map(async function(ele){
    let followersUser = await userModel.findOne({_id: ele});
    ans.push(followersUser);
  });
  await Promise.all(promises);
  // console.log(ans);
  res.render("following", {footer: true, followUser: ans,user: user, active: 'followers'});
})

router.get("/deletePost/:userId", isLoggedIn, async function(req, res) {
  const user = await userModel.findOne({username: req.session.passport.user});
  // console.log(user);
  user.posts.splice(user.posts.indexOf(req.params.userId), 1)
  await user.save();
  await postModel.findOneAndDelete({_id: req.params.userId});
  res.redirect("/profile");
})

router.get("/editPost/:postId", isLoggedIn, async function(req, res) {
  const user = await userModel.findOne({username: req.session.passport.user});
  const post = await postModel.findOne({_id: req.params.postId});
  // console.log(post);
  res.render("editPost", {footer: true, user: user, post: post});
})

router.post("/editPost/:postId", upload.single('image'), isLoggedIn, async function(req, res) {
  const post = await postModel.findOneAndUpdate({_id:req.params.postId}, {caption: req.body.caption}, {new: true});
  if(req.file)
    {
      post.picture.data = req.file.buffer;
      post.picture.contentType = req.file.mimetype;
    }
    await post.save();
  res.redirect(`/post/find/${req.params.postId}`);
})

router.post("/update", upload.single('image'), async function(req, res) {
  const userAlready = await userModel.findOne({username: req.body.username});
  const userCurr = await userModel.findOne({username: req.session.passport.user});
  if(userAlready === null || userAlready.username === userCurr.username)
  {
    const user = await userModel.findOneAndUpdate({username: req.session.passport.user}, {username: req.body.username, name: req.body.name, bio: req.body.bio}, {new: true});
  
    if(req.file)
    {
      user.profileImage.data = req.file.buffer;
      user.profileImage.contentType = req.file.mimetype;
    }
    
    await user.save();
    res.redirect("/profile");
  }else{
    req.flash("error", "Username already exists. Choose a different one.");
    return res.redirect("/edit");
  }
})

router.post("/upload", isLoggedIn, upload.single('image'), async function(req, res) {
  const user = await userModel.findOne({username: req.session.passport.user});
  const imageBuffer = req.file.buffer;
  // const imageBuffer = require('fs').reqdFileSync(req.file.path);


  const post = await postModel.create({
    picture: {
      data: imageBuffer,
      contentType: req.file.mimetype,
    },
    user: user._id,
    caption: req.body.caption,
  })

  user.posts.push(post._id);
  await user.save();

  // Remove the uploaded file as it is already stored in the database
  // require('fs').unlinkSync(req.file.path);
  res.redirect("/feed");
})

router.post("/register", function (req, res) {
  const userData = new userModel({
    username: req.body.username,
    name: req.body.name,
    email: req.body.email,
  })
  userModel.register(userData, req.body.password, function(err, user) {
    if(err) {
      req.flash("error", "Username already exists. Choose a different one.");
      return res.redirect("/");
    }

    passport.authenticate("local")(req, res, function () {
      res.redirect("/profile");
    });
  });

});

router.post("/login", passport.authenticate("local", {
  successRedirect: "/profile",
  failureRedirect: "/login",
  failureFlash: true
}), function (req, res) {
})

router.get("/logout", function(req, res, next){
  req.logout(function(err) {
    if (err) { return next(err); }
    res.redirect('/login');
  });
});


function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) return next();
  res.redirect("/login");
}

module.exports = router;