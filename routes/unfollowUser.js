const router = require("express").Router();
const { doc, writeBatch, arrayRemove } = require('@firebase/firestore');
const { db } = require("../FirebaseConfig");

const unfollowUser = async (senderId, receiverId) => {
    try {
        console.log('UnFollowing user');
        // Start a batched write to perform multiple updates atomically
        const batch = writeBatch(db);

        // Reference to the sender's and receiver's documents
        const senderDocRef = doc(db, 'users', senderId);
        const receiverDocRef = doc(db, 'users', receiverId);

        // Remove receiverId from sender's followingList
        batch.update(senderDocRef, {
            'followingList': arrayRemove(receiverId),
        });

        // Remove senderId from receiver's followerList
        batch.update(receiverDocRef, {
            'followerList': arrayRemove(senderId),
        });

        await batch.commit();

        console.log('Unfollowed user successfully!');
    } catch (error) {
        console.error("Error updating document: ", error);
    }

    return true;

};

router.post("/", async (req, res) => {
    try {
        let { senderId, receiverId } = req.body;
        await unfollowUser(senderId, receiverId);
        res.status(200).send({ message: "Unfollowed user successfully" });
    } catch (error) {
        console.error("Error following:", error);
        res.status(500).send({ message: "Internal Server Error" });
    }
});

module.exports = router;
