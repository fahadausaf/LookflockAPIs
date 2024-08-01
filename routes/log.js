const { db } = require("../db");
const express = require("express");
const router = express.Router();
const { FieldValue } = require('firebase-admin/firestore');

const getCategoryFromProducts = async (brand) => {

    const productsRef = db.collection('products');

    const menQuery = productsRef
        .where('supplier', '==', brand)
        .where('category', '==', 'Men')
        .limit(1);

    const womenQuery = productsRef
        .where('supplier', '==', brand)
        .where('category', '==', 'Women')
        .limit(1);

    const [menSnapshot, womenSnapshot] = await Promise.all([
        menQuery.get(),
        womenQuery.get()
    ]);

    const hasMen = !menSnapshot.empty;
    const hasWomen = !womenSnapshot.empty;

    return { hasMen, hasWomen };
};


const getGenderFromUser = async (userId) => {
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
        throw new Error("User not found");
    }
    const userData = userDoc.data();
    return userData.gender;
};

const getCategory = async (brand, userId, category) => {
    if (category) return category;

    const { hasMen, hasWomen } = await getCategoryFromProducts(brand);

    if (hasMen && hasWomen) {
        const gender = await getGenderFromUser(userId);
        return gender === 'male' ? 'Men' : 'Women';
    }

    if (hasMen) return 'Men';
    if (hasWomen) return 'Women';

    return null;
};

const saveLog = async (userId, brand,categoryFromBody, subCategory = null, subSubCategory = null, newPrice = null, discount = null) => {

    const category = await getCategory(brand, userId, categoryFromBody);

        if (!category) {
            return res.status(400).send({ message: 'Category could not be determined' });
        }

    const logsRef = db.collection('users').doc(userId).collection('logs');
    let query = logsRef.where('brand', '==', brand).where('category', '==', category);

    if (subCategory !== null) {
        query = query.where('subCategory', '==', subCategory);
    }
    if (subSubCategory !== null) {
        query = query.where('subSubCategory', '==', subSubCategory);
    }

    const logSnapshot = await query.limit(1).get();

    const logData = {
        brand,
        category,
        ...(subCategory && {subCategory}),
        ...(subSubCategory && {subSubCategory}),
        timestamp: FieldValue.serverTimestamp(),
        ...(newPrice && { newPrice }),
        ...(discount && { discount })
    };

    if (!logSnapshot.empty) {
        const logDoc = logSnapshot.docs[0].ref;
        await logDoc.update(logData);
    } else {
        await logsRef.add(logData);
    }
};

router.post("/:userId", async (req, res) => {
    try {
        const userId = req.params.userId;
        const { brand, category: categoryFromBody, subCategory, subSubCategory, newPrice, discount } = req.body;

        if (!brand) {
            return res.status(400).send({ message: 'Brand is required' });
        }

        

        await saveLog(userId, brand,categoryFromBody, subCategory, subSubCategory,newPrice,discount);

        res.status(200).send({ message:"log saved" });
    } catch (error) {
        console.error('Error:', error);
        res.status(error.message === "User not found" ? 404 : 500).send({ message: error.message });
    }
});

module.exports =  {router,saveLog};
