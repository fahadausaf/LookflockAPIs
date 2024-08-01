const router = require("express").Router();
const { doc, writeBatch, getDoc, } = require('@firebase/firestore');
const { db } = require("../FirebaseConfig");
const { saveLog } = require("./log");

let counter = 0;

const handleLikeClick = async (userId, product) => {
    console.log("called", counter++);
  console.log("product",product.id);
    const productRef = doc(db, "products", product?.id);
    const likeDocRef = doc(db, `users/${userId}/likeList`, product.id);
    try {
        const batch = writeBatch(db);
      
        const timestamp = new Date(); // Get server timestamp
        
 
        const userLikeSnapshot = await getDoc(likeDocRef);

        // Ensure product has a 'likes' property
        if (!product.likes) {
            product.likes = 0;
        }

        if (userLikeSnapshot.exists()) {
            // Unlike: Remove the like document and decrement likes
            batch.delete(likeDocRef);
            product.likes = Math.max(0, product.likes - 1);
        } else {
            // Like: Add a new like document and increment likes
            batch.set(likeDocRef, { timestamp });
            product.likes = Math.max(0, product.likes + 1);
            // product.likes += 1;
        }

        batch.update(productRef, { likes: product.likes });

        await batch.commit();

        console.log("Product liked/unliked successfully!!");
    } catch (error) {
        console.error("Error updating likeList:", error.message);
    }
};

router.post("/", async (req, res) => {
    try {
        let { userId, product } = req.body;
        await handleLikeClick(userId, product);
        res.status(200).send({ message: "Like/unlike operation completed successfully" });
        
        await saveLog(userId, product.supplier, product.category, product.subCategory, product.subSubCategory, product.newPrice, product.discount);

    } catch (error) {
        console.error("Error handling like/unlike:", error);
        res.status(500).send({ message: "Internal Server Error" });
    }
});

module.exports = router;
