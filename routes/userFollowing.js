const { doc, collection, getDoc, getDocs } = require("@firebase/firestore");
const { db } = require("../FirebaseConfig");
const router = require("express").Router();


/**
 * Get the list of users that a given user is following.
 * @name UserFollowing
 * @async
 * @function getUserFollowing
 * @param {string} userId - The ID of the user whose following list is to be fetched.
 * @returns {Promise<Object[]>} An array of objects containing the ID and type of each user being followed.
 * @throws Will throw an error if the user is not found or if there is an internal server error.
 */

const getUserFollowing = async (userId) => {
    try {
        // Get the user document from Firestore
        // const userDoc = await db.collection('users').doc(userId).get();
        const userRef = doc(db, "users", userId)
        const userDoc = await getDoc(userRef)
        // Check if the user document exists
        if (!userDoc.exists) {
            throw new Error("User not found");
        }

        // Get the following sub-collection from the user document
        // const followingSnapshot = await db.collection('users').doc(userId).collection('following').get();
        const followingRef = collection(db, "users", userId, "following")
        const followingSnapshot = await getDocs(followingRef)
        // Extract document IDs and data from the following sub-collection
        const followingList = followingSnapshot.docs
            .filter(doc => doc.data().type === 'user')
            .map(doc => ({
                id: doc.id,
                type: doc.data().type || ""
            }));

        console.log(followingList)
        return followingList;
    } catch (error) {
        console.error("Error fetching following list:", error);
        throw new Error("Internal Server Error");
    }
};


/**
 * 
 * 
 * Fetches the list of users that the specified user is following.
 *
 * @name UserFollowing
 * @function
 * @memberof module:router
 * @param {Object} req - Express request object.
 * @param {Object} req.params - The route parameters.
 * @param {string} req.params.userId - The ID of the user whose following list is to be fetched.
 * @param {Object} res - Express response object.
 * @returns {Object[]} 200 - An array of objects containing the ID and type of each user being followed.
 * @returns {Object} 404 - User not found.
 * @returns {Object} 500 - Internal Server Error.
 */


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
