import express, { raw } from "express";
import cors from "cors";
import mongoose from "mongoose";
import crypto from "crypto";
import bcrypt from "bcrypt";

const mongoUrl = process.env.MONGO_URL || "mongodb://localhost/project-mongo";
mongoose.connect(mongoUrl, { useNewUrlParser: true, useUnifiedTopology: true });
mongoose.Promise = Promise;
mongoose.set('debug', true);

// Defines the port the app will run on. Defaults to 8080, but can be overridden
// when starting the server. Example command to overwrite PORT env variable value:
// PORT=9000 npm start
const port = process.env.PORT || 8080;
const app = express();

// Add middlewares to enable cors and json body parsing
app.use(cors());
app.use(express.json());

// Start defining your routes here
app.get("/", (req, res) => {
  res.send(listEndpoints(app));
});

//user schema
const { schema } = mongoose;

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true,
  },
  accessToken: {
    // npm install crypto
    type: String,
    // will create long string of random numbers and letters that will be token 
    default: () => crypto.randomBytes(128).toString("hex")
  }
}) 

// user model 
const User = mongoose.model("User", UserSchema);

//npm install bcrypt

app.post ("/register", async (req,res) => {
  const { username, password } = req.body;
  try {
    const salt = bcrypt.genSaltSync();
    const newUser = await new User({
      username: username,
      password: bcrypt.hashSync(password, salt)
    }).save()
    // 201 status code for created
    res.status(201).json({
      success: true,
      response: {
        username: newUser.username,
        id: newUser._id,
        accessToken: newUser.accessToken
      }
    })
  } catch (e) {
    res.status(400).json({
      success: false,
      response: e
    })
  }
});

//log in
app.post("/login", async (req,res) => {
  const { username, password } = req.body;
  try{
    const user = await User.findOne({ username: username})
    if (user && bcrypt.compareSync(password, user.password)) {
      res.status(200).json({
        success: true,
        response: {
          username: user.username,
          id: user._id,
          accessToken: user.accessToken
        }
      });
    } else {
      res.status(400).json({
        success: false,
        response: "Credentials do not match"
      })        
    }
  } catch (e) {
    //500 database error
    res.status(500).json({
      success: false,
      response: e
    })    
  }
});

//Thoughts 
const ThoughtSchema = new mongoose.Schema({
  message: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: 0
  },
  // user just created  - thought item matches specific user 
  user: {
    type: String,
    require: true
  }
});

const Thought = mongoose.model("Thought", ThoughtSchema);

// Authenticate the user 

const authenticateUser = async (req, res, next) => {
  // access token in header of request 
  const accessToken = req.header("Authorization");
  try {
    const user = await User.findOne({accessToken: accessToken});
    if (user) {
      next();
    } else {
      res.status(401).json({
        success: false,
        response: "Please log in"
      })
    }
  } catch (e) {
    res.status(500).json({
      success: false,
      response: e
    })
  }
}

app.get("/thoughts", authenticateUser);
app.get("/thoughts", async (req, res) => {
  const accessToken = req.header("Authorization");
  const user = await User.findOne({accessToken: accessToken});
  const thoughts = await Thought.find({user: user._id});
  res.status(200).json({
    // missing error catching 
    success: true, 
    response: thoughts})
});

app.post("/thoughts", authenticateUser);
app.post("/thoughts", async (req, res) => {
  const {message} = req.body;
  const accessToken = req.header("Authorization");
  const user = await User.findOne({accessToken: accessToken});
  const thoughts = await new  Thought({
    message: message,
    user: user._id
  }).save();
  res.status(200).json({
    // missing error catching 
    success: true, 
    response: thoughts})
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
