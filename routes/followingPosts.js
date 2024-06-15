const { db } = require("../db");
const express = require("express");
const router = express.Router();

const followingPosts = async (followingList, category, userFavCategories) => {
    try {
        const postsPromises = followingList.map(async ({ id: followedUserId, type }) => {
            let querySnapshot;
            if (type === 'user') {
                querySnapshot = await db.collection('posts')
                    .where('id', '==', followedUserId)
                    .get();
            } else {
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
                        id: doc.id, // Use doc.id as postId
                        weight: weight,
                        ...post
                    });
                }
            });
            return posts;
        });

        return await Promise.all(postsPromises);
    } catch (error) {
        console.error("Error fetching posts:", error);
        throw error;
    }
};

router.get("/", async (req, res) => {
    try {
        const { followingList, category, userFavCategories } = req.query; // Assuming parameters are passed in the query string

        if (!followingList || !category || !userFavCategories) {
            return res.status(400).send({ message: "Missing parameters" });
        }

        const allPosts = await followingPosts(JSON.parse(followingList), category, JSON.parse(userFavCategories));
        res.status(200).send(allPosts);
    } catch (error) {
        console.error("Error fetching following posts:", error);
        res.status(500).send({ message: "Internal Server Error" });
    }
});

module.exports = {router,followingPosts};
