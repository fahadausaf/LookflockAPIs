const router = require("express").Router();
const { doc, writeBatch, arrayRemove, deleteDoc } = require('@firebase/firestore');
const { db } = require("../FirebaseConfig");

const unfollowUser = async (senderId, receiverId) => {
    try {
        console.log('UnFollowing user');
        const senderRef = doc(db, "users", senderId, "following", receiverId)
        const receiverRef = doc(db, "users", receiverId, "followers", senderId)
        await deleteDoc(senderRef)
        await deleteDoc(receiverRef)

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
