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

        // Get the favCategories and gender from the user document
        const userFavCategories = userDoc.data().favCategories;
        const userGender = userDoc.data().gender;

        if (!Array.isArray(userFavCategories) || userFavCategories.length === 0) {
            return res.status(400).send({ message: "No favorite categories found" });
        }

        // Determine category based on gender
        const category = userGender === 'male' ? 'Men' : 'Women';

        // Get the following sub-collection from the user document
        const followingSnapshot = await db.collection('users').doc(userId).collection('following').get();
        
        // Extract document IDs and types from the following sub-collection
        const followingList = followingSnapshot.docs.map(doc => ({
            id: doc.id,
            type: doc.data().type
        }));

        if (!Array.isArray(followingList) || followingList.length === 0) {
            return res.status(400).send({ message: "Invalid or empty following list" });
        }

        // Fetch posts from the posts collection
        const postsPromises = followingList.map(async ({ id: followedUserId, type }) => {
            try {
                let querySnapshot;
                if (type === 'user') {
                    // Fetch posts directly if type is 'user'
                    querySnapshot = await db.collection('posts')
                        .where('id', '==', followedUserId)
                        .get();
                } else {
                    // Fetch posts with additional category filter
                    querySnapshot = await db.collection('posts')
                        .where('id', '==', followedUserId)
                        .where('category', '==', category)
                        .get();
                }

                const posts = [];
                querySnapshot.forEach(doc => {
                    const post = doc.data();
                    if (type === 'user' || userFavCategories.some(favCategory => {
                        const subCategory = Object.keys(favCategory)[0];
                        const subSubCategory = favCategory[subCategory];
                        return post.subCategory === subCategory && post.subSubCategory === subSubCategory;
                    })) {
                        posts.push({
                            postId: doc.id, // Use doc.id as postId
                            ...post
                        });
                    }
                });
                return posts;
            } catch (error) {
                console.error(`Error fetching posts for ${followedUserId}:`, error);
                throw error; // Rethrow to ensure it's caught by the outer catch block
            }
        });

        let allPosts = await Promise.all(postsPromises);
        let combinedPosts = allPosts.flat();

        // If combinedPosts length is less than 20, fetch additional products
        if (combinedPosts.length < 20) {
            const productsPromises = userFavCategories.map(async favCategory => {
                const subCategory = Object.keys(favCategory)[0];
                const subSubCategory = favCategory[subCategory];
                
                const querySnapshot = await db.collection('products')
                    .where('category', '==', category)
                    .where('subCategory', '==', subCategory)
                    .where('subSubCategory', '==', subSubCategory)
                    .limit(20 - combinedPosts.length)
                    .get();
                
                const products = [];
                querySnapshot.forEach(doc => {
                    const product = doc.data();
                    products.push({
                        productId: doc.id, // Use doc.id as postId
                        by:"brand",
                        id:product.supplier,
                        
                        images: product.imageUrl ? [{
                           // imageUrl: product.imageUrl,
                            id: uuidv4(),
                            
                            ...product,
                        }] : []
                    });
                });
                return products;
            });

            const productsResults = await Promise.all(productsPromises);
            const additionalProducts = productsResults.flat();
            combinedPosts = combinedPosts.concat(additionalProducts);
        }

        res.status(200).send(combinedPosts);

        // Update the user's newsFeed sub-collection with the post IDs and timestamps
        // const newsFeedPromises = combinedPosts.map(async (post) => {
        //     const newsFeedDocRef = db.collection('users').doc(userId).collection('newsFeed').doc(post.postId);
        //     const newsFeedDoc = await newsFeedDocRef.get();

        //     if (!newsFeedDoc.exists) {
        //         await newsFeedDocRef.set({
        //             timestamp: new Date().toISOString()
        //         });
        //     }
        // });

        // await Promise.all(newsFeedPromises);

    } catch (error) {
        console.error("Error fetching posts:", error);
        res.status(500).send({ message: "Internal Server Error" });
    }
});

module.exports = router;
