const router = require("express").Router();
const { doc, writeBatch, arrayUnion, getDoc, serverTimestamp, setDoc, updateDoc } = require('@firebase/firestore');
const { db } = require("../FirebaseConfig");

const followUser = async (senderId, receiverId) => {
    try {
        console.log('Following user');
        console.log(senderId)
        console.log(receiverId)

        // Update the status of the friend request for the sender
        // Remove from 'pending' and add to 'active'
        const userLogsUpdate = {};
        const timestamp = new Date(); // Get server timestamp
        const following = { timestamp, receiverId };
        userLogsUpdate[`userlogs.Following`] = arrayUnion(following);

        // Reference to the sender's and receiver's documents
        const senderDocRef = doc(db, 'users', senderId);
        await updateDoc(senderDocRef, userLogsUpdate)


        const senderRef = doc(db, "users", senderId, "following", receiverId)
        const receiverRef = doc(db, "users", receiverId, "followers", senderId)

        // Set the document with the same ID and the specified type
        await setDoc(senderRef, {
            type: "user",
            timestamp: serverTimestamp()
        });

        // Set the document with the same ID and the specified type
        await setDoc(receiverRef, {
            type: "user",
            timestamp: serverTimestamp()
        });


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
