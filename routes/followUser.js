const router = require("express").Router();
const { doc, writeBatch, arrayUnion } = require('@firebase/firestore');
const { db } = require("../FirebaseConfig");

const followUser = async (senderId, receiverId) => {
    try {
        console.log('Following user');
        console.log(senderId)
        console.log(receiverId)
        // Start a batched write to perform multiple updates atomically
        const batch = writeBatch(db);
        // Reference to the sender's and receiver's documents
        const senderDocRef = doc(db, 'users', senderId);
        const receiverDocRef = doc(db, 'users', receiverId);

        // Update the status of the friend request for the sender
        // Remove from 'pending' and add to 'active'
        const userLogsUpdate = {};
        const timestamp = new Date(); // Get server timestamp
        const following = { timestamp, receiverId };
        userLogsUpdate[`userlogs.Following`] = arrayUnion(following);

        batch.update(senderDocRef, userLogsUpdate);
        batch.update(senderDocRef, {
            'followingList': arrayUnion(receiverId),
        });

        // Update the status of the friend request for the receiver
        // Remove from 'pending' and add to 'active'
        batch.update(receiverDocRef, {
            'followerList': arrayUnion(senderId),
        });

        // Commit the batched write
        await batch.commit();

        console.log('followed user successfully!');
    } catch (error) {
        console.error("Error updating document: ", error);
    }
}

router.post("/", async (req, res) => {
    try {
        let { senderId, receiverId } = req.body;
        await followUser(senderId, receiverId);
        res.status(200).send({ message: "Followed user successfully" });
    } catch (error) {
        console.error("Error following:", error);
        res.status(500).send({ message: "Internal Server Error" });
    }
});

module.exports = router;
