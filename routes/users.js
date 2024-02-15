const mongoose = require("mongoose");
const plm = require("passport-local-mongoose");

// mongodb+srv://avijithira14:OiEJtVLzexFo2oeQ@instaclone.g99sofe.mongodb.net/
// mongodb://127.0.0.1:27017/instagramProject
mongoose.connect("mongodb+srv://avijithira14:OiEJtVLzexFo2oeQ@instaclone.g99sofe.mongodb.net/");
const userSchema = mongoose.Schema({
  username: String,
  name: String,
  email: String,
  password: String,
  profileImage: {
    data: Buffer,
    contentType: String,
  },
  bio: String,
  posts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "post"
  }],
  followers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
  }],
  following: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
  }]
})

userSchema.plugin(plm);

module.exports = mongoose.model("user", userSchema);