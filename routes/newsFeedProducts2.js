const { db } = require("../db");
const express = require("express");
const router = express.Router();
const { FieldValue } = require('firebase-admin/firestore');
const { newsFeedProductsWithoutBrands } = require("./newsFeedProductsWithoutBrands");

const seenProductIds = new Set();

const newsFeedProducts2 = async (userFavCategories, category, combinedPosts,limit=10, brands = [], lastDoc = null) => {
    console.log("Product userFavCategories", userFavCategories);
    limit = parseInt(limit) || 10

    const productsPromises = userFavCategories?.map(async favCategory => {
        const subCategory = Object.keys(favCategory)[0];
        const subSubCategory = favCategory[subCategory];

        let query = db.collection('products');

        if (brands.length > 0) {
            query = query.where('supplier', 'in', brands);
        }

        if (category) {
            query = query.where('category', '==', category);
        }
        if (subCategory) {
            query = query.where('subCategory', '==', subCategory);
        }
        if (subSubCategory) {
            query = query.where('subSubCategory', '==', subSubCategory);
        }
        query = query.orderBy('dateCreated', 'desc');

        console.log("The last doc is ",lastDoc);
        
        if (lastDoc) {
            query = query.startAfter(lastDoc);
        }
        console.log("Executing query with filters: ", {
            category, subCategory, subSubCategory, brands, lastDoc: lastDoc ? lastDoc.id : null
        });
        const querySnapshot = await query.limit(limit).get();
        const products = [];
        querySnapshot.forEach(doc => {
            if (!seenProductIds.has(doc.id)) {
                const product = doc.data();
                products.push({
                    id: doc.id, // Use doc.id as postId
                    by: "product",
                    ...product,
                });
                seenProductIds.add(doc.id);
            }
        });
        return { products, lastDoc: querySnapshot.docs[querySnapshot.docs.length - 1] };
    });

    

    const productsResults = await Promise.all(productsPromises);
    const additionalProducts = productsResults.flatMap(result => result.products);
    combinedPosts = combinedPosts.concat(additionalProducts);

    const lastDocs = productsResults.map(result => result.lastDoc);
    const nextLastDoc = lastDocs.length ? lastDocs[lastDocs.length - 1] : null;

    return { combinedPosts ,nextLastDoc};
};
const shufflePosts = (posts) => {
    const shuffledPosts = [];
    const supplierMap = {};

    // Group posts by supplier
    posts.forEach(post => {
        if (!supplierMap[post.supplier]) {
            supplierMap[post.supplier] = [];
        }
        supplierMap[post.supplier].push(post);
    });

    // Arrange posts in a way that no two consecutive posts have the same supplier
    while (Object.keys(supplierMap).length) {
        for (const supplier in supplierMap) {
            if (supplierMap[supplier].length) {
                shuffledPosts.push(supplierMap[supplier].shift());
                if (!supplierMap[supplier].length) {
                    delete supplierMap[supplier];
                }
            }
        }
    }

    return shuffledPosts;
};

// Fetch user's favorite categories and followed brands
router.get("/:userId", async (req, res) => {
    try {
        const { userId } = req.params;
        let lastDocId = req.query.lastDocId || null;

        let lastDoc = null;
        // Fetch the last document from newsFeed2 subcollection
        const newsFeed2Collection = db.collection('users').doc(userId).collection('newsFeed2');
        const lastDocSnapshot = await newsFeed2Collection.orderBy('timestamp', 'desc').limit(1).get();
        if (!lastDocSnapshot.empty) {
            lastDoc = lastDocSnapshot.docs[0];
            lastDocId = lastDoc.id;
            console.log("The last doc is", lastDocId);
        }

        if (lastDocId) {
            lastDoc = await db.collection('products').doc(lastDocId).get();
        }

        // Fetch user's favorite categories
        const favCategoriesDoc = await db.collection('users').doc(userId).get();
        if (!favCategoriesDoc.exists) {
            return res.status(404).send({ message: 'Favorite categories not found' });
        }
        const userFavCategories = favCategoriesDoc.data().favCategories;
        console.log("userFavCategories", userFavCategories);

        // Fetch brands the user is following
        const followingSnapshot = await db.collection('users').doc(userId).collection('following')
            .where('type', '==', 'brand').get();
        const followedBrands = followingSnapshot.docs.map(doc => doc.id);
        console.log("followedBrands", followedBrands);

        // Fetch user's gender if category is not provided
        let category = req.query.category;
        if (!category) {
            const userDoc = await db.collection('users').doc(userId).get();
            if (!userDoc.exists) {
                return res.status(404).send({ message: 'User not found' });
            }
            const userGender = userDoc.data().gender;
            category = (userGender === 'male') ? 'Men' : 'Women';
        }
        console.log("Category is", category);

        let combinedPosts = [];
        let nextLastDoc = lastDoc;
        console.log("Actual last doc is",lastDoc);
        // Fetch products based on favorite categories and followed brands (70%)
        if (followedBrands.length > 0) {
            const result = await newsFeedProducts2(userFavCategories, category, combinedPosts,30, followedBrands, nextLastDoc);
            combinedPosts = result.combinedPosts;
            nextLastDoc = result.nextLastDoc;
            // if (combinedPosts.length >= 35) {
            //     combinedPosts = combinedPosts.slice(0, 35); // Limit to 35 products (70% of 50)
            // }
        }

        // Fetch additional products without brand (30%)
        // if (combinedPosts.length < 50) {
        //     const result = await newsFeedProducts(userFavCategories, category, combinedPosts, [], nextLastDoc);
        //     combinedPosts = result.combinedPosts;
        //     nextLastDoc = result.nextLastDoc;
        // }
        
        combinedPosts =await newsFeedProductsWithoutBrands(userFavCategories, category, combinedPosts,10,followedBrands,lastDoc = null,userId)

        // combinedPosts = shufflePosts(combinedPosts);
        // Save posts to newsFeed2 subcollection
        const batch = db.batch();
        let newPostCount = 0;
       
        
        // for (const post of combinedPosts) {
        //     const postRef = newsFeed2Collection.doc(post.id);
        //     const doc = await postRef.get();
        //     if (!doc.exists) {
        //         batch.set(postRef, {
        //             ...post,
        //             timestamp: FieldValue.serverTimestamp(),
        //         });
        //         newPostCount++;
        //         console.log("newPostCount", newPostCount, post.id,post.supplier);
        //     } else {
        //         console.log("The doc exists is", doc.id);
        //     }
        // }

        // await batch.commit();

        // Update post count in user's document
        // const userDocRef = db.collection('users').doc(userId);
        // await userDocRef.update({
        //     postCount: FieldValue.increment(newPostCount)
        // });
        console.log("Direct to feed");
        res.status(200).send(combinedPosts);
    } catch (error) {
        console.log(error);
        res.status(error.message === "Product not found" ? 404 : 500).send({ message: error.message });
    }
});

module.exports = { router, newsFeedProducts2 };
