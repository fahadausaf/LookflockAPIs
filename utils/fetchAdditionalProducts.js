const { db } = require("../db");

const fetchAdditionalProducts = async (userFavCategories, category, combinedPosts) => {
    if (combinedPosts.length < 20) {
        const productsPromises = userFavCategories?.map(async favCategory => {
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
    }
    return combinedPosts;
};

module.exports = fetchAdditionalProducts;
