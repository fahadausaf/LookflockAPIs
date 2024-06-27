const { db } = require('../db');

const router = require("express").Router();


/**
 * GET /:userId
 * 
 * Fetches all posts for a specific user from the database.
 * 
 * @name UserPosts /:userId
 * @function
 * @memberof module:router
 * @param {Object} req - Express request object.
 * @param {Object} req.params - The route parameters.
 * @param {string} req.params.userId - The ID of the user whose posts are to be fetched.
 * @param {Object} res - Express response object.
 * @returns {Object} 200 - An object containing an array of posts.
 * @returns {Object} 404 - No posts found for this user.
 * @returns {Object} 500 - Internal Server Error.
 */

router.get("/:userId", async (req, res) => {
    try {
        const userId = req.params.userId;

        // Query posts collection to get all posts where userId matches
        const querySnapshot = await db.collection('posts').where('userId', '==', userId).get();

        // Check if any posts were found
        if (querySnapshot.empty) {
            return res.status(404).send({ message: "No posts found for this user" });
        }

        // Extract post data from query snapshot
        const posts = [];
        querySnapshot.forEach(doc => {
            posts.push({
                id: doc.id,
                ...doc.data()
            });
        });

        res.status(200).send({ posts });
    } catch (error) {
        console.error("Error fetching posts:", error);
        res.status(500).send({ message: "Internal Server Error" });
    }
});

module.exports = router;
