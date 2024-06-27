const { doc, collection, getDoc, getDocs } = require("@firebase/firestore");
const { db } = require("../FirebaseConfig");
const router = require("express").Router();

const getUserFollowers = async (userId) => {
    try {
        // Get the user document from Firestore
        // const userDoc = await db.collection('users').doc(userId).get();
        const userRef = doc(db, "users", userId)
        const userDoc = await getDoc(userRef)
        // Check if the user document exists
        if (!userDoc.exists) {
            throw new Error("User not found");
        }

        // Get the follower sub-collection from the user document
        // const followerSnapshot = await db.collection('users').doc(userId).collection('follower').get();
        const followerRef = collection(db, "users", userId, "followers")
        const followerSnapshot = await getDocs(followerRef)
        // Extract document IDs and data from the follower sub-collection
        const followerList = followerSnapshot.docs
            .filter(doc => doc.data().type === 'user')
            .map(doc => ({
                id: doc.id,
                type: doc.data().type || ""
            }));

        console.log(followerList)
        return followerList;
    } catch (error) {
        console.error("Error fetching follower list:", error);
        throw new Error("Internal Server Error");
    }
};

router.get("/:userId", async (req, res) => {
    try {
        const userId = req.params.userId;
        const followerList = await getUserFollowers(userId);
        res.status(200).send(followerList);
    } catch (error) {
        res.status(error.message === "User not found" ? 404 : 500).send({ message: error.message });
    }
});

module.exports = { router, getUserFollowers };
