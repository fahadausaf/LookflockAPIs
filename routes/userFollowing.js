const { db } = require("../db");
const express = require("express");
const router = express.Router();

// Import the userFollowing route handler function
const userFollowingHandler = require("./userFollowing");

router.get("/:userId", async (req, res) => {
    try {
        const userId = req.params.userId;

        // Instead of axios, call the handler function directly
        const response = await userFollowingHandler(req, res);

        console.log(response);

        const followingList = response.data.followingList;
        console.log("Following List:", followingList);

        const postsPromises = followingList.map(async (followedUserId) => {
            try {
                const querySnapshot = await db.collection('posts').where('userId', '==', followedUserId).get();
                const posts = [];
                querySnapshot.forEach(doc => {
                    posts.push({
                        id: doc.id,
                        ...doc.data()
                    });
                });
                return posts;
            } catch (error) {
                console.error(`Error fetching posts for ${followedUserId}:`, error);
                throw error; // Rethrow to ensure it's caught by the outer catch block
            }
        });

        const allPosts = await Promise.all(postsPromises);
        console.log(allPosts);

        const combinedPosts = allPosts.flat();
        res.status(200).send({ posts: combinedPosts });
    } catch (error) {
        console.error("Error fetching posts:", error);
        res.status(500).send({ message: "Internal Server Error" });
    }
});

module.exports = router;
