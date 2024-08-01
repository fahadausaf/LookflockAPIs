const { db } = require("../db");
const express = require("express");
const router = express.Router();
const { FieldValue } = require('firebase-admin/firestore');
const { newsFeedProductsWithoutBrands } = require("./newsFeedProductsWithoutBrands");
const { productLog } = require("./productLog");

const seenProductIds = new Set();

const newsFeedProducts2 = async (userFavCategories, category,limit=10, brands = [], lastDoc = null) => {
    console.log("Product userFavCategories", userFavCategories);
    limit = parseInt(limit) || 10

    const subCategories = [];
    const subSubCategories = [];

    userFavCategories.forEach(favCategory => {
        const subCategory = Object.keys(favCategory)[0];
        const subSubCategory = favCategory[subCategory];

        subCategories.push(subCategory);
        subSubCategories.push(subSubCategory);
    });

    console.log("subCategories",subCategories);
    console.log("subSubCategory",subSubCategories);

    let query = db.collection('products');

    if (brands.length > 0) {
        query = query.where('supplier', 'in', brands);
    }
    if (category) {
        query = query.where('category', '==', category);
    }
    if (subCategories.length > 0) {
        query = query.where('subCategory', 'in', subCategories);
    }
    if (subSubCategories.length > 0) {
        query = query.where('subSubCategory', 'in', subSubCategories);
    }
    query = query.orderBy('dateCreated', 'desc');

    if (lastDoc) {
        query = query.startAfter(lastDoc);
    }

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
        console.log("In newsdeesproduct2");
        const { userId } = req.params;
        let lastDocId = req.query.startAfter || null;

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
        let postCount = favCategoriesDoc.data().postCount || 0;
        console.log("postCount", postCount);

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
        let brandPosts =[];
        let otherPosts =[];
       
        let nextLastDoc = lastDoc;
        console.log("Actual last doc is",lastDoc);
        // Fetch products based on favorite categories and followed brands (70%)
        // if (followedBrands.length > 0) {
        //     const result = await newsFeedProducts2(userFavCategories, category, combinedPosts,30, followedBrands, nextLastDoc);
        //     brandPosts = result.products;
        //     nextLastDoc = result.lastDoc;

        //     console.log("newsFeedProducts2 retured",brandPosts.length);

        //     for(const product of brandPosts){
        //         console.log("newsFeedProducts2 retured",product.supplier);
        //     }
        //     // if (combinedPosts.length >= 35) {
        //     //     combinedPosts = combinedPosts.slice(0, 35); // Limit to 35 products (70% of 50)
        //     // }
        // }
       
        const startAfterMap = {};
        const logsSnapshot = await db.collection('users').doc(userId).collection('logs').get();
        const logs = logsSnapshot.docs.map(doc => doc.data());

        for (const log of logs) {
            const logKey = `${log.brand || ''}_${log.category || ''}_${log.subCategory || ''}_${log.subSubCategory || ''}`;
            let lastLogDocQuery = db.collection('users').doc(userId).collection('newsFeed2')
                .where('interest', '==', 'log')
                .orderBy('timestamp', 'desc');

            if (log.brand) {
                lastLogDocQuery = lastLogDocQuery.where('supplier', '==', log.brand);
            }
            if (log.category) {
                lastLogDocQuery = lastLogDocQuery.where('category', '==', log.category);
            }
            if (log.subCategory) {
                lastLogDocQuery = lastLogDocQuery.where('subCategory', '==', log.subCategory);
            }
            if (log.subSubCategory) {
                lastLogDocQuery = lastLogDocQuery.where('subSubCategory', '==', log.subSubCategory);
            }

            const lastLogDocSnapshot = await lastLogDocQuery.limit(1).get();

            if (!lastLogDocSnapshot.empty) {
                startAfterMap[logKey] = lastLogDocSnapshot.docs[0].id;
                console.log("startAfterMap[logKey] ", startAfterMap[logKey]);
            }
        }

     
        let logPosts=[];

        // logPosts = await productLog(userId, startAfterMap, 20);
       

     
    // Fetch posts from all sources in parallel
    const [brandResult, logPosts1, otherPosts1] = await Promise.all([
        newsFeedProducts2(userFavCategories, category, 30, followedBrands, lastDoc),
        productLog(userId, startAfterMap, 20),
        newsFeedProductsWithoutBrands(userFavCategories, category, 10, followedBrands, userId)
    ]);

     brandPosts = brandResult.products;
    combinedPosts = [...brandPosts, ...logPosts1, ...otherPosts1];


        
        // otherPosts =await newsFeedProductsWithoutBrands(userFavCategories, category, combinedPosts,10,followedBrands,userId)

        // combinedPosts = [...otherPosts,...brandPosts,...logPosts]
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
        // console.log("Direct to feed");
        combinedPosts = shufflePosts(combinedPosts)
        const docs = await db.collection('users').doc(userId).collection('newsFeed2').listDocuments();
        const docIds = docs.map(doc => doc.id);
        console.log("docIds", docIds);
 

        for (const post of combinedPosts) {
            // Check if the product ID exists in docIds
            if (!docIds.includes(post.id)) {
                const postRef = newsFeed2Collection.doc(post.id);
                batch.set(postRef, {
                    ...post,
                    timestamp: FieldValue.serverTimestamp(),
                    viewed: 0,
                    orderIndex:postCount++
                });
                newPostCount++;
                console.log("newPostCount", newPostCount, post.id, post.supplier);
            } else {
                console.log("Product already exists", post.id, post.supplier);
            }
        }

        await batch.commit();
        
        // Update post count in user's document
        const userDocRef = db.collection('users').doc(userId);
        await userDocRef.update({
            postCount: FieldValue.increment(newPostCount)
        });
        res.status(200).send({ totalPostCount: newPostCount });
    } catch (error) {
        console.log(error);
        res.status(error.message === "Product not found" ? 404 : 500).send({ message: error.message });
    }
});

module.exports = { router, newsFeedProducts2 };
