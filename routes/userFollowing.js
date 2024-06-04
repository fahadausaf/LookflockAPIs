const { db } = require("../db");
const router = require("express").Router();

router.get("/:userId", async (req, res) => {
    try {
        const userId = req.params.userId;

        // Get the user document from Firestore
        const userDoc = await db.collection('users').doc(userId).get();

        // Check if the user document exists
        if (!userDoc.exists) {
            return res.status(404).send({ message: "User not found" });
        }

        // Get the following sub-collection from the user document
        const followingSnapshot = await db.collection('users').doc(userId).collection('following').get();

        // Extract document IDs and data from the following sub-collection
        const followingList = followingSnapshot.docs.map(doc => ({ id: doc.id,type: doc.data().type || "" }));

        res.status(200).send(followingList);
    } catch (error) {
        console.error("Error fetching following list:", error);
        res.status(500).send({ message: "Internal Server Error" });
    }
});

module.exports = router;
