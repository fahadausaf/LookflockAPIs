const { db } = require("../db");
const express = require("express");
const router = express.Router();
const { FieldValue } = require('firebase-admin/firestore');
const fs = require('fs');
const path = require('path');
router.get("/:userId", async (req, res) => {
    try {
        const userId = req.params.userId;

        // Get the user document from Firestore
        const userDoc = await db.collection('users').doc(userId).get();

        // Check if the user document exists
        if (!userDoc.exists) {
            return res.status(404).send({ message: "User not found" });
        }

        // Get the following sub-collection from the user document
        const followingSnapshot = await db.collection('users').doc(userId).collection('following').get();

        // Extract document IDs from the following sub-collection
        const followingList = followingSnapshot.docs.map(doc => doc.id);

        if (!Array.isArray(followingList) || followingList.length === 0) {
            return res.status(400).send({ message: "Invalid or empty following list" });
        }
        const filePath = path.join(__dirname, 'userPosts1.json');
        // Fetch posts from the posts collection where userId is in the followingList array
        const postsPromises = followingList.map(async (followedUserId) => {
            try {
                const querySnapshot = await db.collection('posts').where('id', '==', followedUserId).get();
                const posts = [];
                querySnapshot.forEach(doc => {
                    posts.push({
                        postId: doc.id, // Use doc.id as postId
                       ...doc.data()
                    });
                });
                fs.writeFileSync(filePath, JSON.stringify(posts, null, 2));
                return posts;
            } catch (error) {
                console.error(`Error fetching posts for ${followedUserId}:`, error);
                throw error; // Rethrow to ensure it's caught by the outer catch block
            }
        });

        const allPosts = await Promise.all(postsPromises);
        const combinedPosts = allPosts.flat();
        res.status(200).send( combinedPosts );
        // Update or create documents in the newsFeed subcollection for each post
        for (let post of combinedPosts) {
            const postRef = db.collection('users').doc(userId).collection('newsFeed').doc(post.postId);
            const postDoc = await postRef.get();
            if (!postDoc.exists) {
                // Document does not exist, create a new one with the post ID and current timestamp
                await postRef.set({
                    postId: post.id,
                    timestamp: FieldValue.serverTimestamp(),

                }, { merge: true }); // Using merge:true to avoid overwriting existing fields
            }
        }

        
    } catch (error) {
        console.error("Error fetching posts:", error);
        res.status(500).send({ message: "Internal Server Error" });
    }
});

module.exports = router;
