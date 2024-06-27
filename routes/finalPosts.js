
const { db } = require("../db");
const express = require("express");
const router = express.Router();
const { getUserFollowing } = require('./userFollowing');
const { getLogPosts } = require('./logPosts');
const { shufflePosts } = require("../utils/sufflePosts");
const { followingPosts } = require('./followingPosts');
const fetchAdditionalProducts = require('../utils/fetchAdditionalProducts');
const { updateNewsFeed } = require("./updateNewsFeed");
const { fetchRecentPosts } = require("./fetchRecentPosts");

/**
 * 
 *
 * Fetches posts for a user based on their following list, favorite categories, and gender.
 * It also includes additional products and recent posts if the number of fetched posts is less than 20.
 * 
 * @name finalPosts
 * @param {string} req.params.userId - The ID of the user for whom the posts are to be fetched.
 * @returns {Object[]} 200 - An array of posts.
 * @returns {Object} 404 - User not found.
 * @returns {Object} 500 - Internal Server Error.
 */


router.get("/:userId", async (req, res) => {
    try {
        const userId = req.params.userId;

        // Get the user document from Firestore
        const userDoc = await db.collection('users').doc(userId).get();

        // Check if the user document exists
        if (!userDoc.exists) {
            return res.status(404).send({ message: "User not found" });
        }

        // Get the favorite categories and gender from the user document
        const userFavCategories = userDoc.data().favCategories;
        const userGender = userDoc.data().gender;

        // Determine category based on gender
        const category = userGender === 'male' ? 'Men' : 'Women';

        // Get the user's following list
        const followingList = await getUserFollowing(userId);

        // Fetch posts from the posts collection based on following
        const allPosts = await followingPosts(followingList, category, userFavCategories);
        let combinedPosts = allPosts.flat();

        // Fetch posts based on logs using the getLogPosts function
        const logPosts = await getLogPosts(userId);
        combinedPosts = [...combinedPosts, ...logPosts.map(post => ({
            id: post.id,
            weight: 0.16,
            ...post
        }))];

        // If combinedPosts length is less than 20, fetch additional products
        if (combinedPosts?.length < 20) {
            combinedPosts = await fetchAdditionalProducts(userFavCategories, category, combinedPosts);
        }

        // Rank posts by weight
        combinedPosts.sort((a, b) => b.weight - a.weight);

        // Shuffle posts to ensure no two posts with the same ID are side by side
        shufflePosts(combinedPosts);

        // If after shuffling, combinedPosts length is still less than 20, fetch recent posts
        if (combinedPosts.length < 20) {
            const recentPosts = await fetchRecentPosts(20 - combinedPosts.length);
            combinedPosts = [...combinedPosts, ...recentPosts];
        }

        // Send the combined posts as the response
        res.status(200).send(combinedPosts);

        // Update the user's news feed with the combined posts
        await updateNewsFeed(userId, combinedPosts);

    } catch (error) {
        console.error("Error fetching posts:", error);
        res.status(500).send({ message: "Internal Server Error" });
    }
});

module.exports = router;
