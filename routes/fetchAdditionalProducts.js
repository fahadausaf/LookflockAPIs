const { db } = require("../db");
const express = require("express");
const router = express.Router();

const fetchAdditionalProducts = async (userFavCategories, category, combinedPosts) => {
        console.log("Product userFavCategories",userFavCategories);
        const productsPromises = userFavCategories?.map(async favCategory => {
            const subCategory = Object.keys(favCategory)[0];
            const subSubCategory = favCategory[subCategory];

            let query = db.collection('products');
            query = query.where('supplier', 'in', [  'BonanzaSatrangi','Alkaram', ]);
            if (category) {
                query = query.where('category', '==', category);
            }
            if (subCategory) {
                query = query.where('subCategory', '==', subCategory);
            }
            if (subSubCategory) {
                query = query.where('subSubCategory', '==', subSubCategory);
            }

            const querySnapshot = await query.get();

            // const querySnapshot = await db.collection('products')
            //     .where('category', '==', category)
            //     .where('subCategory', '==', subCategory)
            //     .where('subSubCategory', '==', subSubCategory)
            //     .limit(20 - combinedPosts.length)
            //     .get();

           
            const products = [];
            querySnapshot.forEach(doc => {
                const product = doc.data();
                products.push({
                    id: doc.id, // Use doc.id as postId
                    by: "product",
                    weight: 0.15,
                    ...product,
                });
            });
            return products;
        });

        const productsResults = await Promise.all(productsPromises);
        const additionalProducts = productsResults.flat();
        combinedPosts = combinedPosts.concat(additionalProducts);
   
    return combinedPosts;
};


router.get("/", async (req, res) => {
    try {
   
        const  userFavCategories = req.body;
        console.log("userFavCategories",userFavCategories);
        const category = req.query.category || ""; // Assuming category is passed as query parameter
        let combinedPosts = [];
        const allProducts = await fetchAdditionalProducts(userFavCategories, category, combinedPosts);
        res.send(`${allProducts.length}`);
    } catch (error) {
        res.status(error.message === "Product not found" ? 404 : 500).send({ message: error.message });
    }
});

module.exports = { router, fetchAdditionalProducts };
