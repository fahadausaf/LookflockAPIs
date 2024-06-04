const { FieldValue } = require('firebase-admin/firestore');
const { db } = require("../db");
const express = require("express");
const router = express.Router();
// Route to handle following a user or a brand
router.post("/:userId", async (req, res) => {
    try {

        const { brandName, categories, subCategories, subSubCategories } = req.body;

        const userId = req.params.userId;

        // Define the collection path
                
        // Create the subcollection document
        const logRef = db.collection('users').doc(userId).collection("Logs").doc();

        // Set the document with the same ID and the specified type
        await logRef.set({
            brand: brandName,
            category : categories,
            subCategory: subCategories,
            subSubCategory: subSubCategories,
            timestamp: FieldValue.serverTimestamp()
        });

        res.status(200).send({ message: `Brand Log generated`});
        // res.status(200).send({ message: `${} followed successfully`, id });

    } catch (error) {
        console.error("Error following:", error);
        res.status(500).send({ message: "Internal Server Error" });
    }
});

module.exports = router;
