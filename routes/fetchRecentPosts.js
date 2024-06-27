const { db } = require("../db");
const express = require("express");
const router = express.Router();


/**
 * Fetches recent posts from the posts collection ordered by date created.
 * @name fetchRecentPosts
 * @async
 * @function fetchRecentPosts
 * @param {number} [limit=10] - The maximum number of recent posts to fetch (default is 10).
 * @returns {Promise<Object[]>} - A promise that resolves to an array of recent posts.
 * @throws Will throw an error if there is an issue fetching recent posts.
 */

const fetchRecentPosts = async (limit = parseInt(10)) => {
    try {
        const recentPostsSnapshot = await db.collection('posts')
            .orderBy('dateCreated', 'desc')
            .limit(limit)
            .get();

        const recentPosts = [];
        recentPostsSnapshot.forEach(doc => {
            recentPosts.push({
              
                ...doc.data(),
                id: doc.id,
            });
        });

        return recentPosts;
    } catch (error) {
        console.error("Error fetching recent posts:", error);
        return [];
    }
};

/**
 * 
 * 
 * Endpoint to fetch recent posts.
 * 
 * @name RecentPosts
 * @function
 * @memberof module:router
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @returns {Object[]} 200 - An array containing recent posts.
 * @returns {Object} 500 - Internal Server Error.
 */

router.get("/", async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 20; // Optionally allow limiting the number of posts via query parameter
        const posts = await fetchRecentPosts(limit);
        res.status(200).json(posts); // Send JSON response
    } catch (error) {
        console.error("Error fetching recent posts:", error);
        res.status(500).send({ message: "Internal Server Error" });
    }
});

module.exports = {router,fetchRecentPosts};