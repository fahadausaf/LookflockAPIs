// shufflePosts.js
const shufflePosts = (posts) => {
    for (let i = 0; i < posts.length - 1; i++) {
        if (posts[i].id === posts[i + 1].id) {
            let j = i + 2;
            while (j < posts.length && posts[j].id === posts[i].id) {
                j++;
            }
            if (j < posts.length) {
                [posts[i + 1], posts[j]] = [posts[j], posts[i + 1]];
            }
        }
    }
};

module.exports = { shufflePosts };
