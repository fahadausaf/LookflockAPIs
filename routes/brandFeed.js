const { db } = require("../db");
const express = require("express");
const router = express.Router();

// Function to fetch promoted posts for a given brand
const brandFeed = async (brandId) => {
    try {
        const promotedPostsSnapshot = await db.collection('brands')
            .doc(brandId)
            .collection('promoted')
            .orderBy('dateCreated', 'desc')
            .get();

        const promotedPosts = [];
        promotedPostsSnapshot.forEach(doc => {
            promotedPosts.push({
                ...doc.data(),
                id: doc.id,
            });
        });

        return promotedPosts;
    } catch (error) {
        console.error("Error fetching promoted posts:", error);
        return [];
    }
};

// API endpoint to fetch promoted posts for a given brand
router.get("/:brandId", async (req, res) => {
    try {
        const brandId = req.params.brandId;
       
        const posts = await brandFeed(brandId);
        res.status(200).json(posts); // Send JSON response
    } catch (error) {
        console.error("Error fetching promoted posts:", error);
        res.status(500).send({ message: "Internal Server Error" });
    }
});

module.exports = { router, brandFeed };
