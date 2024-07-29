const { db } = require('../FirebaseConfig');
const router = require("express").Router();
const { doc, updateDoc, setDoc, serverTimestamp, getDoc, arrayUnion } = require("@firebase/firestore");
const { saveLog } = require('./log');

const followBrand = async (brandId, userId) => {
  try {
    const userDocRef = doc(db, "users", userId);
    // Update data object containing fields to be updated
    const userData = await getDoc(userDocRef)
    // Update the document with the new data
    favCat = userData.data().favCategories;
    await updateDoc(userDocRef, {
      favBrands: arrayUnion(brandId),
      //If there is no fav category then add one otherwise don't
      favCategories: favCat.length > 0 ? [...favCat] : arrayUnion({ "Western Wear": "Jackets" })
    });


    // Get the brand document reference
    const brandDocRef = doc(db, "brands", brandId);

    // Add the user to the 'followers' subcollection in the brand document
    const followersDocRef = doc(brandDocRef, "followers", userId);
    await setDoc(followersDocRef, {
      dateCreated: serverTimestamp(),
    });


    // Add a document in the user's subcollection with the brand name
    const userBrandDocRef = doc(userDocRef, "following", brandId);
    await setDoc(userBrandDocRef, {
      timestamp: serverTimestamp(),
      type: "brand",
    });
    console.log("Brand Followed Successfully!!")
  } catch (error) {
    console.error("Error updating document: ", error);
  }
};

router.post('/', async (req, res) => {
  const { brandId, userId } = req.body;

  try {
    await followBrand(brandId, userId);
    res.status(200).send('Brand followed successfully');
    saveLog(userId,brandId)
  } catch (error) {
    console.error(error);
    res.status(500).send('Error following brand');
  }
});

module.exports = router;