const { db } = require("../db");
const express = require("express");
const router = express.Router();
const { FieldValue } = require('firebase-admin/firestore');
const fs = require('fs');
const path = require('path');

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

        const allPosts = await Promise.all(postsPromises);
        const combinedPosts = allPosts.flat();

        res.status(200).send(combinedPosts);

        // Optionally, you can save the combined posts to the newsFeed sub-collection or file as required.

    } catch (error) {
        console.error("Error fetching posts:", error);
        res.status(500).send({ message: "Internal Server Error" });
    }
});

module.exports = router;
