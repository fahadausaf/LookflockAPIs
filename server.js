// server.js
const express = require('express');
const http = require('http');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
var cors = require('cors')
const userFollowing = require("./routes/userFollowing");
const userPosts = require("./routes/userPosts");
const userFollowingPosts = require("./routes/userFollowingPosts");
const userFollowingPosts2a = require("./routes/userFollowingPosts2a");
const followapi = require("./routes/followapi");
const followerapi = require("./routes/followerapi");
const followBrand = require("./routes/followBrand");
const logoutFeed = require("./routes/logoutFeed");

const generateBrandLog = require("./routes/brandLog");


dotenv.config();





const app = express();
const server = http.createServer(app);
app.use(cors())
// Middleware
app.use(express.json());
  
// MongoDB Connection


// Sample Route
app.get('/', (req, res) => {
    res.send('Hello World!');
});


// routes
app.use("/api/userFollowing", userFollowing);
app.use("/api/userPosts", userPosts);
app.use("/api/userFollowingPosts", userFollowingPosts);
app.use("/api/userFollowingPosts2a", userFollowingPosts2a);
app.use("/api/follow", followapi);
app.use("/api/follower", followerapi);
app.use("/api/followBrand", followBrand);
app.use("/api/logoutFeed", logoutFeed);
app.use("/api/brandLog", generateBrandLog);



// Start server
const PORT = process.env.PORT || 8082;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
}).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.log(`Port ${PORT} is already in use. Please close the other application or use a different port.`);
        process.exit(1);
    } else {
        throw err;
    }
});
