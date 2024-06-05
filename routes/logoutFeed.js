const { db } = require("../db");
const express = require("express");
const router = express.Router();
const admin = require("firebase-admin"); // Ensure Firebase Admin is imported

router.get("/", async (req, res) => {
    try {


        // Fetch all document IDs from the brands collection
        const brandsSnapshot = await db.collection('brands').get();
        const brandIds = brandsSnapshot.docs.map(doc => doc.id);

        // Fetch posts from the posts collection where id matches any of the brandIds, limited to 2 posts per brandId
        const postsPromises = brandIds.map(async (brandId) => {
            try {
                const querySnapshot = await db.collection('posts')
                    .where('id', '==', brandId)
                    .limit(2)
                    .get();

                const posts = [];
                querySnapshot.forEach(doc => {
                    posts.push({
                        id: doc.id,
                        ...doc.data()
                    });
                });
                return posts;
            } catch (error) {
                console.error(`Error fetching posts for brandId ${brandId}:`, error);
                throw error; // Rethrow to ensure it's caught by the outer catch block
            }
        });

        const allPosts = await Promise.all(postsPromises);
        const combinedPosts = allPosts.flat();

        // Save the posts to the newsFeed collection with the post ID as the document ID
       

        res.status(200).send({ message: "Posts successfully pulled", posts: combinedPosts }); 
    } catch (error) {
        console.error("Error pulling posts:", error);
        res.status(500).send({ message: "Internal Server Error" });
    }
});

module.exports = router;
