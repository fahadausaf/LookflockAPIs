const { db } = require("../db");
const express = require("express");
const router = express.Router();
const { FieldValue } = require('firebase-admin/firestore');
const { v4: uuidv4 } = require('uuid'); // To generate unique IDs for images

router.get("/:userId", async (req, res) => {
    try {
        const userId = req.params.userId;

        // Get the user document from Firestore
        const userDoc = await db.collection('users').doc(userId).get();

        // Check if the user document exists
        if (!userDoc.exists) {
            return res.status(404).send({ message: "User not found" });
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
            const posts = postsSnapshot.docs.map(doc => doc.data());
            allPosts = [...allPosts,...posts];
        }

        // Respond with the aggregated posts
        res.send(allPosts);

    } catch (error) {
        console.error("Error fetching posts:", error);
        res.status(500).send({ message: "Internal Server Error" });
    }
});

module.exports = router;
