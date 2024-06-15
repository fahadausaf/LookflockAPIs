const { db } = require("../db");
const express = require("express");
const router = express.Router();
const { FieldValue } = require('firebase-admin/firestore');
const { getUserFollowing } = require('./userFollowing'); 
const { getLogPosts } = require('./logPosts'); 
const { shufflePosts } = require("../utils/sufflePosts");
const { followingPosts } = require('./followingPosts'); 
const fetchAdditionalProducts = require('../utils/fetchAdditionalProducts');
const { updateNewsFeed } = require("./updateNewsFeed");

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


        // Determine category based on gender
        const category = userGender === 'male' ? 'Men' : 'Women';

        const followingList = await getUserFollowing(userId);

         // Fetch posts from the posts collection based on following
        const allPosts = await followingPosts(followingList, category, userFavCategories);

        // let allPosts = await Promise.all(postsPromises);
        let combinedPosts = allPosts.flat();

         // Fetch posts based on logs using the getLogPosts function
         const logPosts = await getLogPosts(userId);
         combinedPosts = [...combinedPosts, ...logPosts.map(post => ({
             id: post.id,
             weight: 0.16,
             ...post
         }))];

        // If combinedPosts length is less than 20, fetch additional products
        if (combinedPosts?.length < 20) {
  
        combinedPosts = await fetchAdditionalProducts(userFavCategories, category, combinedPosts);
        }

        // Rank posts by weight
        combinedPosts.sort((a, b) => b.weight - a.weight);

        // Ensure no two posts with the same ID are side by side

        shufflePosts(combinedPosts);

         // Get the highest score in the newsFeed collection
         const newsFeedSnapshot = await db.collection('users').doc(userId).collection('newsFeed').orderBy('score', 'desc').limit(1).get();


         let startingScore = Number(0.000001);
 
         if (!newsFeedSnapshot.empty) {
            let snapshotScore = Number(newsFeedSnapshot.docs[0].data().score);
            startingScore = snapshotScore + 0.00001;
         }
 
         // Assign scores to posts
         combinedPosts.forEach(post => {
             post.score = startingScore;
             startingScore += 0.00001;
         });
        
        res.status(200).send(combinedPosts);

         await updateNewsFeed(userId, combinedPosts);


    } catch (error) {
        console.error("Error fetching posts:", error);
        res.status(500).send({ message: "Internal Server Error" });
    }
});

module.exports = router;
