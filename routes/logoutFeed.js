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
        // const specificIds = ['Q3cyySKXpqPl4UL3KvcGsXP9qAt2', 'nLxbHErOkYSXwoaksCja6zQFod33'];
        // Fetch all document IDs from the brands collection
        const brandsSnapshot = await db.collection('brands').get();

        let brandIds = brandsSnapshot.docs.map(doc => doc.id);

        // Add the specific brand IDs to the brandIds array
        // brandIds = [...new Set([...brandIds, ...specificIds])];

        // Fetch posts from the posts collection where id matches any of the brandIds, limited to 4 posts per brandId
        const postsPromises = brandIds.map(async (brandId) => {
            try {
                const querySnapshot = await db.collection('posts')
                    .where('id', '==', brandId)
                    .limit(4)
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
        let combinedPosts = allPosts.flat();

        // If the total posts are less than 20, fetch products
        if (combinedPosts.length < 20) {
            const productPromises = brandIds.map(async (brandId) => {
                try {
                    const querySnapshot = await db.collection('products')
                        .where('supplier', '==', brandId)
                        .limit(1)
                        .get();

                    const products = [];
                    querySnapshot.forEach(doc => {
                        products.push({
                            id: doc.id,
                            by: "product",
                            ...doc.data()
                        });
                    });
                    return products;
                } catch (error) {
                    console.error(`Error fetching products for brandId ${brandId}:`, error);
                    throw error; // Rethrow to ensure it's caught by the outer catch block
                }
            });

            const allProducts = await Promise.all(productPromises);
            const combinedProducts = allProducts.flat();

            // Merge the posts and products
            combinedPosts = [...combinedPosts, ...combinedProducts];
        }
        shufflePosts(combinedPosts);
        res.status(200).send(combinedPosts);
    } catch (error) {
        console.error("Error pulling posts and products:", error);
        res.status(500).send({ message: "Internal Server Error" });
    }
});

module.exports = router;
