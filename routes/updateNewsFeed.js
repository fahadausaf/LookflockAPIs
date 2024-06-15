const { db } = require("../db");
const express = require("express");
const router = express.Router();
const { FieldValue } = require('firebase-admin/firestore');

const updateNewsFeed = async (userId, combinedPosts) => {
    try {
        for (let post of combinedPosts) {
            const postRef = db.collection('users').doc(userId).collection('newsFeed').doc(post.id);
            const postDoc = await postRef.get();
            if (!postDoc.exists) {
                // Document does not exist, create a new one with the post ID and current timestamp
                await postRef.set({
                    id: post.id,
                    by: post.by,
                    score: post.score,
                    timestamp: FieldValue.serverTimestamp(),
                }, { merge: true }); // Using merge:true to avoid overwriting existing fields
            }
        }
    } catch (error) {
        console.error("Error updating posts:", error);
        throw error;
    }
};

router.post("/updateNewsFeed/:userId", async (req, res) => {
    try {
        const userId = req.params.userId;
        const combinedPosts = req.body.combinedPosts; // Assuming combinedPosts is provided in the request body

        await updateNewsFeed(userId, combinedPosts);

        res.status(200).send({ message: "Posts updated successfully" });
    } catch (error) {
        console.error("Error updating posts:", error);
        res.status(500).send({ message: "Internal Server Error" });
    }
});

module.exports = { router, updateNewsFeed };
