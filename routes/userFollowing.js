const db = require("../FirebaseConfig");




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

        // Get the followingList array from the user document
        const followingList = userDoc.data().followingList;

        res.status(200).send({ followingList });
    } catch (error) {
        console.error("Error fetching followingList:", error);
        res.status(500).send({ message: "Internal Server Error" });
    }
});




module.exports = router;