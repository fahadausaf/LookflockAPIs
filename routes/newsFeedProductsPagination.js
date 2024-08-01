const { db } = require("../db");
const express = require("express");
const router = express.Router();

router.get('/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;
        const startAfter = req.query.startAfter || null;
        const limit = parseInt(req.query.limit) || 10;
        const lastSeenFeed = req.query.lastSeenFeed === 'true';


        // if(lastSeenFeed){
            console.log("lastSeenFeed",lastSeenFeed);
            let query;

        // if(lastSeenFeed){
        //     console.log("run where('viewed', '==', 0)");
        //  query = db.collection('users').doc(userId).collection('newsFeed2').where('viewed', '==', 0)
        //  .orderBy('timestamp', 'desc').limit(limit);
        

        // }else{
        //     console.log("run where('viewed', '==', 1)");
        //     // Reference to the user's newsFeed subcollection
        //  query = db.collection('users').doc(userId).collection('newsFeed2').where('viewed', '==', 1) .orderBy('timestamp', 'desc').limit(limit);
       
        // }
        
        // query = db.collection('users').doc(userId).collection('newsFeed2');

        // // Order by timestamp in descending order
        // query = query.orderBy('timestamp', 'desc');
        // if (startAfter ) {
        //     console.log("startAfter",startAfter);
        //     const startAfterDoc = await db.collection('users').doc(userId).collection('newsFeed2').doc(startAfter).get();
        //     console.log("startAfterDoc",startAfterDoc);
        //     query = query.startAfter(startAfterDoc);
        // }

        // console.log("Fetching");
        // let querySnapshot = await query?.get();
          // If the initial query returns no results, run the secondary query
        //   if (querySnapshot.empty) {
            // console.log("Initial query returned no results. Fetching secondary query.");
            // query = db.collection('users').doc(userId).collection('newsFeed2').orderBy('timestamp', 'desc').limit(limit);
            // querySnapshot = await query.get();
        // }
        query = db.collection('users').doc(userId).collection('newsFeed2');

        // Order by timestamp in descending order
        query = query.orderBy('orderIndex', 'asc');
        if (startAfter) {
            const startAfterDoc = await db.collection('users').doc(userId).collection('newsFeed2').doc(startAfter).get();
            if (!startAfterDoc.exists) {
                return res.status(400).send({ message: 'Invalid startAfter document ID.' });
            }
            query = query.startAfter(startAfterDoc);
        }

        // Limit the number of documents retrieved
        query = query.limit(25);

        // Execute the query
        const querySnapshot = await query.get();
        const newsFeedItems = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        }));

        const lastVisible = querySnapshot.docs[querySnapshot.docs.length - 1];

         // Organize newsFeedItems into a hashmap by supplier
         const supplierMap = new Map();
         newsFeedItems.forEach(item => {
             const supplier = item.supplier || 'default';
             if (!supplierMap.has(supplier)) {
                 supplierMap.set(supplier, []);
             }
             supplierMap.get(supplier).push(item);
         });
 
         // Shuffle newsFeedItems by interleaving from each supplier
         const shuffledNewsFeedItems = [];
         while (supplierMap.size > 0) {
             for (const [supplier, items] of supplierMap.entries()) {
                 shuffledNewsFeedItems.push(items.shift());
                 if (items.length === 0) {
                     supplierMap.delete(supplier);
                 }
             }
         }
 

        res.status(200).send({
            newsFeedItems: shuffledNewsFeedItems,
            nextCursor: lastVisible ? lastVisible.id : null
        });
        console.log(newsFeedItems.length);
        for(const product of shuffledNewsFeedItems){
            console.log("product supplier",product.supplier);
        }
        // Update the viewed status to true for the fetched documents
        const batch = db.batch();
        querySnapshot.docs.forEach(doc => {
            const docRef = db.collection('users').doc(userId).collection('newsFeed2').doc(doc.id);
            batch.update(docRef, { viewed: 1 });
        });
        await batch.commit();
        console.log("Updated viewed status for fetched documents.");

    } catch (error) {
        console.error('Error fetching newsFeed:', error);
        res.status(500).send({ message: 'Internal Server Error' });
    }
});

module.exports = router;
