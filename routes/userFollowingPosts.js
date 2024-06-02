const { db } = require("../db");
const express = require("express");
const router = express.Router();

router.get("/:userId", async (req, res) => {
    try {
        const userId = req.params.userId;

        // Get the user document from Firestore
        const userDoc = await db.collection('users').doc(userId).get();

        // Check if the user document exists
        if (!userDoc.exists) {
            return res.status(404).send({ message: "User not found" });
        }

        // Get the followingList array from the user document
        const followingList = userDoc.data().followingList;

        if (!Array.isArray(followingList)) {
            return res.status(400).send({ message: "Invalid following list" });
        }

        // Fetch posts from the posts collection where userId is in the followingList array
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
        const combinedPosts = allPosts.flat();

        res.status(200).send({ posts: combinedPosts });
    } catch (error) {
        console.error("Error fetching posts:", error);
        res.status(500).send({ message: "Internal Server Error" });
    }
});

module.exports = router;
