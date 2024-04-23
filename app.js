const express = require("express");
const app = express();
const cors = require("cors");
const path = require("path");
const sassMiddleware = require("node-sass-middleware");
const { MongoClient, ObjectId } = require("mongodb");

app.use(cors());

// Set the views directory
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Compile Sass/SCSS files
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

app.use(express.json());

// Define routes
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
app.get("/manage", (req, res) => {
  res.render("manage");
});
app.get("/update", (req, res) => {
  let postId = req.query.postId;
  console.log(postId);
  res.render("update", { postId: postId });
});

app.get("/epub", function (req, res) {
  // Assuming you have a variable containing the URL of the EPUB file
  var epubURL = "/books/test2.epub";
  res.render("epub", { epubURL: epubURL });
});

const uri = "mongodb://172.17.0.2:27017";
const dbName = "blogs";
const collectionName = "posts";

// Connect to MongoDB
async function connectToDatabase() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    console.log("Connected successfully to MongoDB");
    return client.db(dbName);
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
    throw error;
  }
}
// Get Posts
app.get("/posts", async (req, res) => {
  try {
    const db = await connectToDatabase();
    const posts = await db.collection(collectionName).find().toArray();
    res.json(posts);
  } catch (error) {
    console.error("Error creating blog post:", error);
    res.status(500).send("Error creating blog post");
  }
});

// Create Post
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

// Delete Post
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

// Update Post
app.put("/updatePost", async (req, res) => {
  try {
    const db = await connectToDatabase();
    const { title, content, postId } = req.body;
    const postObjectId = new ObjectId(postId);

    await db
      .collection(collectionName)
      .updateOne({ _id: ObjectId(postObjectId) }, { $set: { title, content } });
    console.log("Post updated:", postId);
    res.sendStatus(200);
  } catch (error) {
    console.error("Error updating post:", error);
    res.status(500).send("Error updating post");
  }
});

// Start the server
const PORT = process.env.PORT || 3002;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
