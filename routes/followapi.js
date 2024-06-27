// routes/follow.js
const { FieldValue } = require('firebase-admin/firestore');
const { db } = require('../db');
const express = require("express");
const router = express.Router();
// Route to handle following a user or a brand
router.post("/:userId", async (req, res) => {
    try {
        const { id, type } = req.body;

        // Validate type
        if (!['user', 'brand'].includes(type)) {
            return res.status(400).send({ message: "Invalid type. Must be 'user' or 'brand'." });
        }

        const userId = req.params.userId;

        // Define the collection path

        // Create the subcollection document
        const followRef = db.collection('users').doc(userId).collection("following").doc(id);

        // Set the document with the same ID and the specified type
        await followRef.set({
            type: type,
            timestamp: FieldValue.serverTimestamp()
        });

        res.status(200).send({ message: `${type} followed successfully`, id });
    } catch (error) {
        console.error("Error following:", error);
        res.status(500).send({ message: "Internal Server Error" });
    }
});

module.exports = router;
