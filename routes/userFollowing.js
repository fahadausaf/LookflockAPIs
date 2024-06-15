const { db } = require("../db");
const router = require("express").Router();

const getUserFollowing = async (userId) => {
    try {
        // Get the user document from Firestore
        const userDoc = await db.collection('users').doc(userId).get();

        // Check if the user document exists
        if (!userDoc.exists) {
            throw new Error("User not found");
        }

        // Get the following sub-collection from the user document
        const followingSnapshot = await db.collection('users').doc(userId).collection('following').get();

        // Extract document IDs and data from the following sub-collection
        const followingList = followingSnapshot.docs.map(doc => ({ id: doc.id, type: doc.data().type || "" }));

        return followingList;
    } catch (error) {
        console.error("Error fetching following list:", error);
        throw new Error("Internal Server Error");
    }
};

router.get("/:userId", async (req, res) => {
    try {
        const userId = req.params.userId;
        const followingList = await getUserFollowing(userId);
        res.status(200).send(followingList);
    } catch (error) {
        res.status(error.message === "User not found" ? 404 : 500).send({ message: error.message });
    }
});

module.exports = { router, getUserFollowing };
