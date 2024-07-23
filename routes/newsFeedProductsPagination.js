
const { db } = require("../db");
const express = require("express");
const router = express.Router();


router.get('/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;
        const startAfter = req.query.startAfter || null;
        const limit = parseInt(req.query.limit) || 10;
        // console.log(userId);
        // Reference to the user's newsFeed subcollection
        let query = db.collection('users').doc(userId).collection('newsFeed2').limit(limit);

        if (startAfter) {
            const startAfterDoc = await db.collection('users').doc(userId).collection('newsFeed2').doc(startAfter).get();
            // console.log("startAfterDoc",startAfterDoc);
            query = query.startAfter(startAfterDoc);
        }
        console.log("Fetching");
        const querySnapshot = await query.get();
        const newsFeedItems = querySnapshot.docs.map(doc => ({
            //id: doc.id,
            ...doc.data(),
            
        }));

         


        const lastVisible = querySnapshot.docs[querySnapshot.docs.length - 1];

        res.status(200).send({
            newsFeedItems,
            nextCursor: lastVisible ? lastVisible.id : null
        });
    } catch (error) {
        console.error('Error fetching newsFeed:', error);
        res.status(500).send({ message: 'Internal Server Error' });
    }
});

module.exports = router;