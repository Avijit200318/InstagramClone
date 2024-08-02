const mongoose = require("mongoose");
const plm = require("passport-local-mongoose");
const dotenv = require("dotenv");
dotenv.config();

mongoose.connect(process.env.MONGO).then(()=> {
  console.log("mongodb is connected");
}).catch((error)=> {
  console.log("error is " ,error);
});
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