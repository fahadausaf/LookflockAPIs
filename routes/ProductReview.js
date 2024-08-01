const { FieldValue } = require('firebase-admin/firestore');
const express = require("express");
const { db } = require('../db');
const router = express.Router();
// Route to handle following a user or a brand
router.post("/:productID", async (req, res) => {
    try {

        // const { brandName, categories, subCategories, subSubCategories } = req.body;

        const productID = req.params.productID;

        // Create the subcollection document
        const logRef = db.collection('products').doc(productID).collection("Reviews").doc();

        // Set the document with the same ID and the specified type
        const dataWithTimestamp = {
            ...req.body,
            timestamp: FieldValue.serverTimestamp()
        };
        // Set the document with the modified data
        await logRef.set(dataWithTimestamp);
        res.status(200).send({ message: `User Activity Log generated` });
        // res.status(200).send({ message: `${} followed successfully`, id });

    } catch (error) {
        console.error("Error following:", error);
        res.status(500).send({ message: "Internal Server Error" });
    }
});

module.exports = router;
