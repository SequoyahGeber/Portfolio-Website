const express = require("express");
const app = express();
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const cookieParser = require("cookie-parser");
const sassMiddleware = require("node-sass-middleware");
const { MongoClient, ObjectId } = require("mongodb");
const multer = require("multer");

// Enable Cross-Origin Resource Sharing (CORS)
app.use(cors());

// Set the view engine to EJS and specify the views directory
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Compile Sass/SCSS files and serve them as static CSS files
app.use(
  sassMiddleware({
    src: path.join(__dirname, "public", "styles"),
    dest: path.join(__dirname, "public", "css"),
    debug: true,
    outputStyle: "compressed",
    prefix: "/css",
  })
);

// Serve static files from the 'public' directory
app.use(express.static("public"));

// Define where uploaded file name will be stored temporarily
let uploadedFileName;

// Parse JSON bodies of incoming requests
app.use(express.json());

// Parse cookies
app.use(cookieParser());

// Multer storage configuration for file uploads
const storage = multer.diskStorage({
  destination: "public/books/",
  filename: function (req, file, callback) {
    callback(null, file.originalname);
    console.log(file.originalname);
    uploadedFileName = file.originalname; // Store the uploaded file name
  },
});

// Initialize multer with the storage configuration
const upload = multer({ storage: storage });

// Define routes for various pages
app.get("/", (req, res) => {
  res.render("index");
});
app.get("/blog", (req, res) => {
  res.render("blog");
});
app.get("/about", (req, res) => {
  res.render("about");
});
app.get("/portfolio", (req, res) => {
  res.render("portfolio");
});
app.get("/learn", (req, res) => {
  res.render("learn");
});
app.get("/manage", (req, res) => {
  const loggedIn = req.cookies.loggedin;
  if (loggedIn !== "true") {
    return res.redirect("/verify");
  }

  res.render("manage");
});
let postId;
app.get("/update", (req, res) => {
  const loggedIn = req.cookies.loggedin;
  if (loggedIn !== "true") {
    return res.redirect("/verify");
  }
  if (req.query.postId) {
    postId = req.query.postId;
  }

  res.render("update", { postId: postId });
});

app.get("/verify", (req, res) => {
  res.render("verification");
});

// Render the 'epub' page
app.get("/epub", function (req, res) {
  res.render("epub");
});

// Handle file upload
app.post("/upload", upload.single("epubFile"), (req, res) => {
  // Set a cookie with the uploaded file name
  res.cookie("fileName", uploadedFileName, {
    maxAge: 360000,
  });
  res.redirect("/epub"); // Redirect to the 'epub' page
});

//Send japanese
app.get("/kanji", (req, res) => {
  const filePath = path.join(__dirname, "public", "japanese", "kanji.txt");

  fs.readFile(filePath, "utf8", (err, data) => {
    if (err) {
      console.error("Error reading file:", err);
      return res.status(500).send("Error reading file");
    }
    const dataArray = data.split("\n");
    res.json(dataArray);
  });
});
app.get("/hiraganaKatakana", (req, res) => {
  const filePath = path.join(
    __dirname,
    "public",
    "japanese",
    "hiraganaKatakana.txt"
  );

  fs.readFile(filePath, "utf8", (err, data) => {
    if (err) {
      console.error("Error reading file:", err);
      return res.status(500).send("Error reading file");
    }
    const dataArray = data.split("\n");
    res.json(dataArray);
  });
});
app.get("/english", (req, res) => {
  const filePath = path.join(__dirname, "public", "japanese", "english.txt");

  fs.readFile(filePath, "utf8", (err, data) => {
    if (err) {
      console.error("Error reading file:", err);
      return res.status(500).send("Error reading file");
    }
    const dataArray = data.split("\n");
    res.json(dataArray);
  });
});

// Endpoint to read files from directory
app.get("/readFiles", (req, res) => {
  console.log("Reading Files");
  const directoryPath = "public/books";
  const cookies = req.cookies;
  console.log(cookies);

  let fileNameFromCookie = null;
  // Extract uploaded file name from cookie
  for (const cookieName in cookies) {
    if (cookieName.startsWith("fileName")) {
      fileNameFromCookie = cookies[cookieName];
      break;
    }
  }

  if (!fileNameFromCookie) {
    return res.status(400).send("Please upload a file first.");
  }

  const decodedFileName = decodeURIComponent(fileNameFromCookie);

  // Read files from directory and filter by file name
  fs.readdir(directoryPath, (err, files) => {
    if (err) {
      console.error("Error reading directory:", err);
      return res.status(500).send("Error reading directory");
    }

    if (!decodedFileName) {
      return res.status(400).send("Invalid file name in the cookie.");
    }

    const filteredFiles = files.filter((file) => file === decodedFileName);

    res.json(filteredFiles);
  });
});

const collectionName = "posts";

// Connect to MongoDB
async function connectToDatabase() {
  const client = new MongoClient("mongodb://172.17.0.2:27017");
  try {
    await client.connect();
    console.log("Connected successfully to MongoDB");
    return client.db("blogs");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
    throw error;
  }
}
async function connectToAccountsDatabase() {
  const client = new MongoClient("mongodb://172.17.0.2:27017");
  try {
    await client.connect();
    console.log("Connected successfully to MongoDB");
    return client.db("accounts");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
    throw error;
  }
}

// Get all blog posts
app.get("/posts", async (req, res) => {
  try {
    const db = await connectToDatabase();
    const posts = await db.collection(collectionName).find().toArray();
    res.json(posts);
  } catch (error) {
    console.error("Error retrieving blog posts:", error);
    res.status(500).send("Error retrieving blog posts");
  }
});

// Create a new blog post
app.post("/createPost", async (req, res) => {
  try {
    const db = await connectToDatabase();
    const { title, content } = req.body;
    const date = new Date().toLocaleDateString();
    const newPost = { title, content, date };
    await db.collection(collectionName).insertOne(newPost);
    console.log("New blog post created:", newPost);
    res.redirect("/blog");
  } catch (error) {
    console.error("Error creating blog post:", error);
    res.status(500).send("Error creating blog post");
  }
});

// Delete a blog post
app.post("/deletePost", async (req, res) => {
  try {
    const db = await connectToDatabase();
    const postId = req.body.postId;
    console.log(postId);
    const postObjectId = new ObjectId(postId);
    await db.collection(collectionName).deleteOne({ _id: postObjectId });
    console.log("Post deleted:", postId);
    res.sendStatus(200);
  } catch (error) {
    console.error("Error deleting post:", error);
    res.status(500).send("Error deleting post");
  }
});

// Update a blog post
app.put("/updatePost", async (req, res) => {
  try {
    const db = await connectToDatabase();
    const { title, content, postId } = req.body;
    const postObjectId = new ObjectId(postId);
    console.log("newPostId:", postId);

    await db
      .collection(collectionName)
      .updateOne({ _id: postObjectId }, { $set: { title, content } });

    console.log("Post updated:", postId);
    res.sendStatus(200);
  } catch (error) {
    console.error("Error updating post:", error);
    res.status(500).send("Error updating post");
  }
});
let usersCollection = "users";
// Login endpoint
app.post("/login", async (req, res) => {
  try {
    const db = await connectToAccountsDatabase();
    const { email, password } = req.body;

    // Find user with provided email
    const user = await db.collection(usersCollection).findOne({ email });

    if (!user) {
      return res.status(401).send("Invalid email or password");
    }

    // Compare password with the one stored in the database
    if (user.password !== password) {
      return res.status(401).send("Invalid email or password");
    }

    // Set a cookie indicating user is logged in
    res.cookie("loggedin", true, {
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    });

    res.sendStatus(200); // Login successful
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("Login failed. Please try again.");
  }
});

// Registration endpoint
app.post("/register", async (req, res) => {
  try {
    const db = await connectToAccountsDatabase();
    const { email, password } = req.body;

    // Check if user with provided email already exists
    const existingUser = await db
      .collection(usersCollection)
      .findOne({ email });

    if (existingUser) {
      return res.status(400).send("User already exists");
    }

    // Insert new user data into the database
    await db.collection(usersCollection).insertOne({ email, password });

    res.sendStatus(201); // Registration successful
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("Registration failed. Please try again.");
  }
});

// Start the server
const PORT = process.env.PORT || 3002;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
