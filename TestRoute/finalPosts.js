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

        // Fetch posts from the posts collection based on following
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
                    const weight = type === 'user' ? 0.4 : 0.3; // Weight based on type
                    if (type === 'user' || userFavCategories.some(favCategory => {
                        const subCategory = Object.keys(favCategory)[0];
                        const subSubCategory = favCategory[subCategory];
                        return post.subCategory === subCategory && post.subSubCategory === subSubCategory;
                    })) {
                        posts.push({
                            postId: doc.id, // Use doc.id as postId
                            weight: weight,
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

        // Fetch posts based on logs
        const logsSnapshot = await db.collection('users').doc(userId).collection('logs').get();
        const logs = logsSnapshot.docs.map(doc => doc.data());

        for (const log of logs) {
            let postsQuery = db.collection('posts');

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
            const posts = postsSnapshot.docs.map(doc => ({
                postId: doc.id, // Use doc.id as postId
                weight: 0.1,
                ...doc.data()
            }));
            combinedPosts = [...combinedPosts, ...posts];
        }

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
                        by: "brand",
                        id: product.supplier,
                        weight: 0.15,
                        images: product.imageUrl ? [{
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

        // Rank posts by weight
        combinedPosts.sort((a, b) => b.weight - a.weight);

        // Ensure no two posts with the same ID are side by side
        function shufflePosts(posts) {
            for (let i = 0; i < posts.length - 1; i++) {
                if (posts[i].postId === posts[i + 1].postId) {
                    // Find the next post with a different ID
                    let j = i + 2;
                    while (j < posts.length && posts[j].postId === posts[i].postId) {
                        j++;
                    }
                    if (j < posts.length) {
                        // Swap posts[i + 1] and posts[j]
                        [posts[i + 1], posts[j]] = [posts[j], posts[i + 1]];
                    }
                }
            }
        }

        shufflePosts(combinedPosts);

        res.status(200).send(combinedPosts);

    } catch (error) {
        console.error("Error fetching posts:", error);
        res.status(500).send({ message: "Internal Server Error" });
    }
});

module.exports = router;