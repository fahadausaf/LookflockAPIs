
const { db } = require("../db");
const express = require("express");
const router = express.Router();


/**
 * 
 * 
 * Endpoint to fetch news feed items for a user.
 * 
 * @name NewsFeedPagination
 * @function
 * @memberof module:router
 * @param {Object} req - Express request object.
 * @param {string} req.params.userId - The ID of the user whose news feed is being fetched.
 * @param {string} req.query.startAfter - Optional. The ID of the last document fetched to start after.
 * @param {number} req.query.limit - Optional. The maximum number of news feed items to fetch. Default is 10.
 * @param {Object} res - Express response object.
 * @returns {Object} 200 - An object containing detailed news feed items and a nextCursor for pagination.
 * @returns {Object} 500 - Internal Server Error.
 */

router.get('/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;
        const startAfter = req.query.startAfter || null;
        const limit = parseInt(req.query.limit) || 10;
        // console.log(userId);
        // Reference to the user's newsFeed subcollection
        let query = db.collection('users').doc(userId).collection('newsFeed').orderBy('timestamp', 'desc').limit(limit);

        if (startAfter) {
            const startAfterDoc = await db.collection('users').doc(userId).collection('newsFeed').doc(startAfter).get();
            query = query.startAfter(startAfterDoc);
        }

        const querySnapshot = await query.get();
        const newsFeedItems = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

         // Fetch additional data based on `by` field
         const detailedNewsFeedItems = await Promise.all(newsFeedItems.map(async item => {
            if (item.by === 'product') {
                const productDoc = await db.collection('products').doc(item.id).get();
                return {
                    ...item,
                 ...productDoc.exists ? productDoc.data() : null
                };
            } else if (item.by === 'brand' ) {
                const postDoc = await db.collection('posts').doc(item.id).get();
                return {
                    ...item,
                 ...postDoc.exists ? postDoc.data() : null
                };
            }else if (item.by === 'user') {
                const postDoc = await db.collection('posts').doc(item.id).get();
                let detailedItem = {
                  ...item,
                  ...(postDoc.exists ? postDoc.data() : null)
                };
                
                if (detailedItem?.type === 'image' || detailedItem?.type === 'video') {
                    // console.log("I am here");
                  const mediaSnapshot = await db.collection('posts').doc(item.id).collection('media').get();
                  const urls = mediaSnapshot.docs.map(doc => doc.data());
               
                  detailedItem.urls = urls;
                }
            
                return detailedItem;
            } else {
                return item;
            }
        }));


        const lastVisible = querySnapshot.docs[querySnapshot.docs.length - 1];

        res.status(200).send({
            newsFeedItems: detailedNewsFeedItems,
            nextCursor: lastVisible ? lastVisible.id : null
        });
    } catch (error) {
        console.error('Error fetching newsFeed:', error);
        res.status(500).send({ message: 'Internal Server Error' });
    }
});

module.exports = router;