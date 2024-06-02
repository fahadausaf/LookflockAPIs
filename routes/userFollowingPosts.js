

const router = require("express").Router();

const { db } = require("../FirebaseConfig");
// Import the userFollowing route
const userFollowingRoute = require("./userFollowing");

// Mount the userFollowing route
router.use("userFollowing/:userId/", userFollowingRoute);

router.get("/:userId", async (req, res) => {
    try {
        const userId = req.params.userId;

        // Call the userFollowing route to get the list of users the specified user follows
        const response = await axios.get(`api/userFollowing/${userId}`);
        console.log(response);

        // Extract the followingList from the response
        const followingList = response.data.followingList;

        // Fetch posts for each user the current user follows
        const postsPromises = followingList.map(async (followedUserId) => {
            // Query posts collection to get all posts where userId matches
            const querySnapshot = await db.collection('posts').where('userId', '==', followedUserId).get();

            // Extract post data from query snapshot
            const posts = [];
            querySnapshot.forEach(doc => {
                posts.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            return posts;
        });

        // Wait for all posts to be fetched
        const allPosts = await Promise.all(postsPromises);

        // Flatten the array of arrays into a single array
        const combinedPosts = allPosts.flat();

        res.status(200).send({ posts: combinedPosts });
    } catch (error) {
        console.error("Error fetching posts:", error);
        res.status(500).send({ message: "Internal Server Error" });
    }
});

module.exports = router;
