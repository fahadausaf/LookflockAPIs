const { db } = require('../FirebaseConfig');
const router = require("express").Router();
const { doc, updateDoc, setDoc, serverTimestamp, getDoc, arrayUnion, arrayRemove, deleteDoc } = require("@firebase/firestore");

const unfollowBrand = async (brandId, userId) => {
    try {
        const userDocRef = doc(db, "users", userId);
        // Update data object containing fields to be updated
        await updateDoc(userDocRef, {
            favBrands: arrayRemove(brandId),
        });


        // Get the brand document reference
        const brandDocRef = doc(db, "brands", brandId);

        // Add the user to the 'followers' subcollection in the brand document
        const followersDocRef = doc(brandDocRef, "followers", userId);
        await deleteDoc(followersDocRef)


        // Add a document in the user's subcollection with the brand name
        const userBrandDocRef = doc(userDocRef, "following", brandId);
        await deleteDoc(userBrandDocRef)
        console.log("Brand Unfollowed Successfully!!")
    } catch (error) {
        console.error("Error updating document: ", error);
    }
};

router.post('/', async (req, res) => {
    const { brandId, userId } = req.body;

    try {
        await unfollowBrand(brandId, userId);
        res.status(200).send('Brand unfollowed successfully');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error unfollowing brand');
    }
});

module.exports = router;