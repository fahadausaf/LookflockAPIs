const { db } = require("../db");
const router = require("express").Router();


const getLogPosts = async (userId) => {
    try {
        // Get the user document from Firestore
        const userDoc = await db.collection('users').doc(userId).get();

        // Check if the user document exists
        if (!userDoc.exists) {
            throw new Error("User not found");
        }

        // Fetch log documents from the logs subcollection
        const logsSnapshot = await db.collection('users').doc(userId).collection('logs').get();
        const logs = logsSnapshot.docs.map(doc => doc.data());

        // Prepare to collect all post results
        let allPosts = [];

        // Fetch posts based on logs
        for (const log of logs) {
            let postsQuery = db.collection('posts');

            // Adjusting for the new log structure
            if (log.brandName) {
                postsQuery = postsQuery.where('id', '==', log.brandName);
            }
            if (log.category) {
                postsQuery = postsQuery.where('category', '==', log.category);
            }
            if (log.subCategory) {
                postsQuery = postsQuery.where('subCategory', '==', log.subCategory);
            }
            if (log.subSubCategory) {
                postsQuery = postsQuery.where('subSubCategory', '==', log.subSubCategory);
            }

            const postsSnapshot = await postsQuery.get();
            const posts = postsSnapshot.docs.map((doc) => ({
                
                ...doc.data(),
                id: doc.id
              }));
            allPosts = [...allPosts, ...posts];
        }

        return allPosts;
    } catch (error) {
        console.error("Error fetching posts:", error);
        throw new Error("Internal Server Error");
    }
};


/**
 * GET /:userId
 * 
 * Endpoint to fetch posts based on a user's logs.
 * 
 * @name PostsFromLog
 * @function
 * @memberof module:router
 * @param {Object} req - Express request object.
 * @param {Object} req.params - The route parameters.
 * @param {string} req.params.userId - The ID of the user whose log posts are to be fetched.
 * @param {Object} res - Express response object.
 * @returns {Object} 200 - An array of posts based on the user's logs.
 * @returns {Object} 404 - User not found.
 * @returns {Object} 500 - Internal Server Error.
 */

router.get("/:userId", async (req, res) => {
    try {
        const userId = req.params.userId;
        const allPosts = await getLogPosts(userId);
        res.status(200).send(allPosts);
    } catch (error) {
        res.status(error.message === "User not found" ? 404 : 500).send({ message: error.message });
    }
});

module.exports = { router, getLogPosts };
