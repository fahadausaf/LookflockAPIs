
const { db } = require("../db");
const express = require("express");
const router = express.Router();


const followingPosts = async (followingList, category, userFavCategories) => {
    try {
        const postsPromises = followingList.map(async ({ id: followedUserId, type }) => {
            let querySnapshot;
            if (type === 'user') {
                querySnapshot = await db.collection('posts')
                    .where('id', '==', followedUserId)
                    .get();
            } else {
                querySnapshot = await db.collection('posts')
                    .where('id', '==', followedUserId)
                    .where('category', '==', category)
                    .get();
            }

            const posts = [];
            querySnapshot.forEach(doc => {
                const post = doc.data();
                const weight = type === 'user' ? 0.4 : 0.3; // Weight based on type
                if (type === 'user' || userFavCategories.some(favCategory => {
                    const subCategory = Object.keys(favCategory)[0];
                    const subSubCategory = favCategory[subCategory];
                    return post.subCategory === subCategory && post.subSubCategory === subSubCategory;
                })) {
                    posts.push({
                         // Use doc.id as postId
                        weight: weight,
                        ...post,
                        id: doc.id,
                    });
                }
            });
            return posts;
        });

        return await Promise.all(postsPromises);
    } catch (error) {
        console.error("Error fetching posts:", error);
        throw error;
    }
};


/**
 * 
 * 
 * Endpoint to fetch posts for users or categories that a user is following.
 * 
 * @name followingPosts
 * @function
 * @memberof module:router
 * @param {Object} req - Express request object.
 * @param {Object} req.query - The query parameters.
 * @param {string} req.query.followingList - JSON stringified array of followed user/category objects.
 * @param {string} req.query.category - The category to filter posts by.
 * @param {string} req.query.userFavCategories - JSON stringified array of user's favorite categories and sub-categories.
 * @param {Object} res - Express response object.
 * @returns {Object} 200 - An array of arrays, each containing posts.
 * @returns {Object} 400 - Missing parameters.
 * @returns {Object} 500 - Internal Server Error.
 */


router.get("/", async (req, res) => {
    try {
        const { followingList, category, userFavCategories } = req.query; // Assuming parameters are passed in the query string

        if (!followingList || !category || !userFavCategories) {
            return res.status(400).send({ message: "Missing parameters" });
        }

        const allPosts = await followingPosts(JSON.parse(followingList), category, JSON.parse(userFavCategories));
        res.status(200).send(allPosts);
    } catch (error) {
        console.error("Error fetching following posts:", error);
        res.status(500).send({ message: "Internal Server Error" });
    }
});

module.exports = {router,followingPosts};
