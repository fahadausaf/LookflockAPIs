const { db } = require('../db');
const express = require("express");
const router = express.Router();
const admin = require("firebase-admin"); // Ensure Firebase Admin is imported
const { shufflePosts } = require("../utils/sufflePosts");


/**
 *
 * 
 * Endpoint to fetch posts and products from brands.
 * 
 * @name logoutFeed
 * @function
 * @memberof module:router
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @returns {Object[]} 200 - An array containing posts and products from brands.
 * @returns {Object} 500 - Internal Server Error.
 */


router.get("/", async (req, res) => {
    try {
        // Fetch all documents from the defaultFeed collection
        const snapshot = await db.collection('defaultFeed').get();

        // Map over the documents and extract the data
        const feedItems = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            by:"product"
        }));

        // Send the response with the fetched items
        res.status(200).send(feedItems);
    } catch (error) {
        console.error("Error fetching default feed:", error);
        res.status(500).send({ message: "Internal Server Error" });
    }
});
module.exports = router;
