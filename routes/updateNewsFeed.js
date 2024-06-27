const { db } = require("../db");
const express = require("express");
const router = express.Router();
const { FieldValue } = require('firebase-admin/firestore');


const updateNewsFeed = async (userId, combinedPosts) => {
    try {
        for (let post of combinedPosts) {
            if (post.id && post.by !== undefined) { // Ensure 'by' field is not undefined
                const postRef = db.collection('users').doc(userId).collection('newsFeed').doc(post.id);
                const postDoc = await postRef.get();
                if (!postDoc.exists) {
                    // Document does not exist, create a new one with the post ID and current timestamp
                    await postRef.set({
                        id: post.id,
                        by: post.by,
                        timestamp: FieldValue.serverTimestamp(),
                    }, { merge: true }); // Using merge:true to avoid overwriting existing fields
                }
            } else {
                console.error(`Invalid post data: ${JSON.stringify(post)}`);
            }
        }
    } catch (error) {
        console.error("Error updating posts:", error);
        throw error;
    }
};


/**
 * 
 * 
 * Endpoint to update the news feed of a user.
 * 
 * @name  SaveToNewsFeedCollection
 * @function
 * @memberof module:router
 * @param {Object} req - Express request object.
 * @param {string} req.params.userId - The ID of the user to update the news feed for.
 * @param {Object[]} req.body.combinedPosts - An array of posts to update in the news feed.
 * @param {Object} res - Express response object.
 * @returns {Object} 200 - Success message indicating posts were updated successfully.
 * @returns {Object} 500 - Internal Server Error.
 */

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
