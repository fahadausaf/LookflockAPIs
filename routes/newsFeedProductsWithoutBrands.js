const { db } = require("../db");
const express = require("express");
const router = express.Router();
const { FieldValue } = require('firebase-admin/firestore');

const seenProductIds = new Set();

const newsFeedProductsWithoutBrands = async (userFavCategories, category,limit=10,followedBrands,userId) => {
    console.log("Product followedBrands", followedBrands);
    limit = parseInt(limit) || 10

    let lastDocId = null;

        let lastDoc = null;
        console.log("I am herre");
        // Fetch the last document from newsFeed2 subcollection
        const newsFeed2Collection = db.collection('users').doc(userId).collection('newsFeed2');
        
        const lastDocSnapshot = await newsFeed2Collection.orderBy('timestamp', 'desc').where('interest', '==', false).limit(1).get();

        if (!lastDocSnapshot.empty) {
            lastDoc = lastDocSnapshot.docs[0];
            lastDocId = lastDoc.id;
            console.log("The last doc is", lastDocId);
        }

        if (lastDocId) {
            lastDoc = await db.collection('products').doc(lastDocId).get();
        }


    const productsPromises = userFavCategories?.map(async favCategory => {
        const subCategory = Object.keys(favCategory)[0];
        const subSubCategory = favCategory[subCategory];

        let query = db.collection('products');
        if (followedBrands.length > 0) {
            query = query.where('supplier', 'not-in', followedBrands);
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
        // query = query.orderBy('dateCreated', 'desc');

        console.log("The last doc is ",lastDoc);
        if (lastDoc) {
            query = query.startAfter(lastDoc);
        }
        console.log("Executing query with filters: ", {
            category, subCategory, subSubCategory, lastDoc: lastDoc ? lastDoc.id : null
        });
        const querySnapshot = await query.limit(20).get();
        const products = [];
        querySnapshot.forEach(doc => {
            if (!seenProductIds.has(doc.id)) {
                const product = doc.data();
                products.push({
                    id: doc.id, // Use doc.id as postId
                    by: "product",
                    ...product,
                    interest:false
                });
                seenProductIds.add(doc.id);
            }
        });
        return { products, lastDoc: querySnapshot.docs[querySnapshot.docs.length - 1] };
    });

    

    const productsResults = await Promise.all(productsPromises);
    const additionalProducts = productsResults.flatMap(result => result.products);
   

    for(const product of additionalProducts){
        console.log("newsFeedProductsWithoutBrands retured",product.supplier);
    }

    const lastDocs = productsResults.map(result => result.lastDoc);
    const nextLastDoc = lastDocs.length ? lastDocs[lastDocs.length - 1] : null;

    return  additionalProducts ;
};

// Fetch user's favorite categories and followed brands
router.get("/:userId", async (req, res) => {
    try {
        const { userId } = req.params;
        let lastDocId = req.query.lastDocId || null;

        let lastDoc = null;
        // Fetch the last document from newsFeed2 subcollection
        const newsFeed2Collection = db.collection('users').doc(userId).collection('newsFeed2');
        const lastDocSnapshot = await newsFeed2Collection.where('interest', '==', false).limit(1).get();

        if (!lastDocSnapshot.empty) {
            lastDoc = lastDocSnapshot.docs[0];
            lastDocId = lastDoc.id;
            console.log("The last doc is", lastDocId);
        }

        if (lastDocId) {
            lastDoc = await db.collection('products').doc(lastDocId).get();
        }

        let combinedPosts = [];
        let nextLastDoc = lastDoc;
        console.log("Actual last doc is",lastDoc);
        // Fetch products based on favorite categories and followed brands (70%)
    

        // Fetch additional products without brand (30%)
        
            const result = await newsFeedProductsWithoutBrands(userFavCategories, category, combinedPosts, nextLastDoc);
            combinedPosts = result.combinedPosts;
            nextLastDoc = result.nextLastDoc;
        

        res.status(200).send({ posts: combinedPosts, nextCursor: nextLastDoc ? nextLastDoc.id : null });
    } catch (error) {
        console.log(error);
        res.status(error.message === "Product not found" ? 404 : 500).send({ message: error.message });
    }
});

module.exports = { router, newsFeedProductsWithoutBrands };
