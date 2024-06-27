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


        // Check if the user document exists
        const userDocRef = db.collection('users').doc(userId);
        const userDoc = await userDocRef.get();

        if (!userDoc.exists) {
            return res.status(404).send({ message: "User not found." });
        }

        // Define the subcollection path using userDocRef
        const followerRef = userDocRef.collection("followers").doc(id);

        // Set the document with the specified type and the date followed
        await followerRef.set({
            type: type,
            timestamp: FieldValue.serverTimestamp()
        });

        res.status(200).send({ message: `${type} started following you`, id });
    } catch (error) {
        console.error("Error following:", error);
        res.status(500).send({ message: "Internal Server Error" });
    }
});

module.exports = router;
