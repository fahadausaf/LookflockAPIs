// server.js
const express = require('express');
const http = require('http');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
var cors = require('cors')
const { router: userFollowing } = require("./routes/userFollowing");
const { router: userFollowers } = require("./routes/userFollowers");
const userPosts = require("./routes/userPosts");
const userFollowingPosts = require("./TestRoute/userFollowingPosts");
const pullPosts = require("./routes/pullPosts");
const followapi = require("./routes/followapi");
const followerapi = require("./routes/followerapi");
const followBrand = require("./routes/followBrand");
const unfollowBrand = require("./routes/unfollowBrand");
const logoutFeed = require("./routes/logoutFeed");
const { router: logPosts } = require("./routes/logPosts");
const { router: followingPosts } = require("./routes/followingPosts");
const finalPosts = require("./routes/finalPosts");
const newsFeedPagination = require("./routes/newsFeedPagination");

const generateBrandLog = require("./routes/brandLog");
const {router:logs} = require("./routes/log");
const {router: fetchRecentPosts} = require("./routes/fetchRecentPosts");
const {router: brandFeed} = require("./routes/brandFeed");
const {router: fetchAdditionalProducts} = require("./routes/fetchAdditionalProducts");
const {router: newsFeedProducts} = require("./routes/newsFeedProducts");
const {router: newsFeedProducts2} = require("./routes/newsFeedProducts2");
const {router: productLog} = require("./routes/productLog");
const newsFeedProductsPagination= require("./routes/newsFeedProductsPagination");


const emailService = require('./routes/emailService')
const followUser = require('./routes/followUser')
const unfollowUser = require('./routes/unfollowUser')
const likePost = require('./routes/likePost')
const like = require('./routes/like')
const status = require('express-status-monitor')

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
app.use(status());
app.use("/api/userFollowing", userFollowing);
app.use("/api/userFollowers", userFollowers);
app.use("/api/userPosts", userPosts);
app.use("/api/userFollowingPosts", userFollowingPosts);
app.use("/api/pullPosts", pullPosts);
app.use("/api/follow", followapi);
app.use("/api/follower", followerapi);
app.use("/api/followBrand", followBrand);
app.use("/api/unfollowBrand", unfollowBrand);
app.use("/api/logoutFeed", logoutFeed);
app.use("/api/brandLog", generateBrandLog);
app.use("/api/logPosts", logPosts);
app.use("/api/finalPosts", finalPosts);
app.use("/api/followingPosts", followingPosts);
app.use("/api/newsFeed", newsFeedPagination);
app.use("/api/recentPosts", fetchRecentPosts);
app.use("/api/brandFeed", brandFeed);
app.use("/api/logs", logs);
app.use("/api/productLog", productLog);

app.use("/api/fetchAdditionalProducts", fetchAdditionalProducts);
app.use("/api/newsFeedProducts", newsFeedProducts);
app.use("/api/newsFeedProducts2", newsFeedProducts2);
app.use("/api/newsFeedProductsPagination", newsFeedProductsPagination);

app.use("/api/sendemail", emailService);
app.use("/api/followUser", followUser);
app.use("/api/unfollowUser", unfollowUser);
app.use("/api/likePost", likePost);
app.use("/api/like", like);



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
