const router = require("express").Router();
const { doc, writeBatch, arrayUnion, getDoc, query, collection, where, getDocs, addDoc, updateDoc } = require('@firebase/firestore');
const { db } = require("../FirebaseConfig");

let counter = 0
const handleLikeClick = async (userId, product) => {
    console.log("called", counter++)
    const userRef = doc(db, "users", userId);
    const brandRef = doc(db, "brands", product?.supplier);
    const productRef = doc(db, "products", product?.id);
    try {
        const batch = writeBatch(db);
        const userLogsUpdate = {};
        const productID = product.id || product.objectID;
        const brandName = product.supplier;
        const timestamp = new Date(); // Get server timestamp
        const likedProduct = { timestamp, productID, brandName };
        userLogsUpdate[`userlogs.LikedProduct`] = arrayUnion(likedProduct);
        batch.update(userRef, userLogsUpdate);
        const brandSnapshot = await getDoc(brandRef);
        let brandData = brandSnapshot.data();
        let currentLikes = brandData && brandData.likes ? brandData.likes : 0;

        // Update the brand document with the new likes count
        const brandUpdate = { likes: currentLikes + 1 };
        batch.update(brandRef, brandUpdate);


        // Check if there's an existing log entry
        const logQuery = query(
            collection(userRef, "logs"),
            where("brandName", "==", product.supplier),
            where("category", "==", product.category),
            where("subCategory", "==", product.subCategory),
            where("subSubCategory", "==", product.subSubCategory)
        );

        const logSnapshot = await getDocs(logQuery);

        if (!logSnapshot.empty) {
            // If a matching log entry is found, update its timestamp
            const logDocRef = logSnapshot.docs[0].ref;
            batch.update(logDocRef, { timestamp });
        } else {
            // Add log entry in user's logs subcollection if no matching entry is found
            const logRef = collection(userRef, "logs");
            await addDoc(logRef, {
                brandName: product.supplier,
                category: product.category,
                subCategory: product.subCategory,
                subSubCategory: product.subSubCategory,
                timestamp: timestamp
            });
        }

        await batch.commit();

        const userSnapshot = await getDoc(userRef);
        let likeList = userSnapshot.data().likeList || [];
        // Ensure product has a 'likes' property
        if (!product.likes) {
            product.likes = 0;
        }
        if (likeList?.some((p) => p.id === product.id || product.objectID)) {
            // Remove from likeList
            likeList = likeList.filter(
                (p) => p.id !== product.id || product.objectID
            );
            product.likes = Math.max(0, product.likes - 1);
        } else {
            // Add to likeList
            likeList.push(product);
            product.likes += 1;
        }
        await updateDoc(userRef, { likeList });
        await updateDoc(productRef, { likes: product.likes });

        // setLikeList(likeList);
        console.log("Product liked successfully!!")
    } catch (error) {
        console.error("Error updating likeList:", error.message);
    }
};

router.post("/", async (req, res) => {
    try {
        let { userId, product } = req.body;
        await handleLikeClick(userId, product);
        res.status(200).send({ message: "Followed user successfully" });
    } catch (error) {
        console.error("Error following:", error);
        res.status(500).send({ message: "Internal Server Error" });
    }
});

module.exports = router;
