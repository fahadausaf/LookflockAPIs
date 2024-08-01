const { db } = require('../db');
const express = require("express");
const router = express.Router();
const { FieldValue } = require('firebase-admin/firestore');

const productLog = async (userId, startAfterMap = {}, limit = 5) => {
    console.log("Product Log is called");
    const logsSnapshot = await db.collection('users').doc(userId).collection('logs').get();
    const logs = logsSnapshot.docs.map(doc => doc.data());

    let allProducts = [];
    console.log("logs are", logs);
    // Fetch posts based on logs
    for (const log of logs) {
        let postsQuery = db.collection('products');

        if (log.brand) {
            postsQuery = postsQuery.where('supplier', '==', log.brand);
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

        const logKey = `${log.brand || ''}_${log.category || ''}_${log.subCategory || ''}_${log.subSubCategory || ''}`;
        console.log("logKey",logKey);
        const startAfter = startAfterMap[logKey];
        console.log("startAfter",startAfter);
        postsQuery = postsQuery.orderBy('dateCreated', 'desc');
        if (startAfter) {
            const startAfterDoc = await db.collection('products').doc(startAfter).get();
            // console.log("startAfterDoc",startAfterDoc);
            if (startAfterDoc.exists) {
                postsQuery = postsQuery.startAfter(startAfterDoc);
            }
        }
        
        const postsSnapshot = await postsQuery.limit(limit).get();
        const posts = postsSnapshot.docs.map((doc) => ({
            ...doc.data(),
            id: doc.id,
            by: "product",
            interest: "log"
        }));
        allProducts = [...allProducts, ...posts];
    }

    // return allProducts;
     // Organize products into a hashmap by supplier
    const supplierMap = new Map();
    allProducts.forEach(product => {
        if (!supplierMap.has(product.supplier)) {
            supplierMap.set(product.supplier, []);
        }
        supplierMap.get(product.supplier).push(product);
    });

    // Shuffle products by interleaving from each supplier
    const shuffledProducts = [];
    while (supplierMap.size > 0) {
        for (const [supplier, products] of supplierMap.entries()) {
            shuffledProducts.push(products.shift());
            if (products.length === 0) {
                supplierMap.delete(supplier);
            }
        }
    }

    return shuffledProducts;
}

router.get("/:userId", async (req, res) => {
    try {
        const userId = req.params.userId;
        const limit = parseInt(req.query.limit) || 7;

        // Retrieve the startAfter document for each log
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

        const docs = await db.collection('users').doc(userId).collection('newsFeed2').listDocuments();
        const docIds = docs.map(doc => doc.id);
        console.log("docIds", docIds);


        const products = await productLog(userId, startAfterMap, limit);
        
      
        // Save to newsFeed2 subcollection
        const newsFeed2Collection = db.collection('users').doc(userId).collection('newsFeed2');
        const batch = db.batch();
        let newPostCount = 0;

        for (const post of products) {
            // Check if the product ID exists in docIds
            if (!docIds.includes(post.id)) {
                const postRef = newsFeed2Collection.doc(post.id);
                batch.set(postRef, {
                    ...post,
                    timestamp: FieldValue.serverTimestamp(),
                    viewed: 0
                });
                newPostCount++;
                console.log("newPostCount", newPostCount, post.id, post.supplier);
            } else {
                console.log("Product already exists", post.id, post.supplier);
            }
        }
        

        await batch.commit();
        res.status(200).send(products);
        // Update post count in user's document
        const userDocRef = db.collection('users').doc(userId);
        await userDocRef.update({
            postCount: FieldValue.increment(newPostCount)
        });
        
    } catch (error) {
        res.status(error.message === "User not found" ? 404 : 500).send({ message: error.message });
    }
});

module.exports = { router, productLog };
