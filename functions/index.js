const functions = require('firebase-functions');
const admin = require('firebase-admin');
const sendEmail = require('./emailSender');
const cors = require('cors')({ origin: true });
const algoliasearch = require('algoliasearch');
const mailchimp = require('@mailchimp/mailchimp_marketing');
admin.initializeApp();

const APP_ID = functions.config().algolia.app;
const ADMIN_KEY = functions.config().algolia.key;
const client = algoliasearch(APP_ID, ADMIN_KEY);
const index = client.initIndex('products');

mailchimp.setConfig({
    apiKey: 'da0ef71e1c85bc8024fc22bcc0d67f62',
    server: 'us22', // e.g., 'us1'
});
exports.sendWelcomeEmail = functions.auth.user().onCreate(async (user) => {
    const { email, displayName } = user;
    const mailOptions = {
        to: email,
        subject: 'Welcome to Lookflock - Social Shopping!',
        text: `Dear ${displayName},\n
        Welcome to Lookflock, a social shopping platform for fashion. We're thrilled to have you join our community of savvy shoppers and sellers who are passionate about discovering fashion and sharing unique products and experiences.\n
        As a member of Lookflock, you now have access to a vibrant marketplace where you can explore a diverse range of fashion related products, connect with fellow enthusiasts, and unleash your creativity. Whether you're looking for handmade tailored-fit clothes, vintage treasures, or one-of-a-kind stitchworks, you'll find it all right here.\n
        Here are a few things you can do to get started:\n
        1. Complete Your Profile: Let other users get to know you by adding a profile picture and a brief bio. Share your interests, passions, and what you're looking for on the platform.
        2. Explore Our Marketplace: Dive into our curated collection of products from independent sellers and artisans. Discover hidden gems and support small businesses from around the world.
        3. Connect with the Community: Join discussions, share your favorite finds, and connect with like-minded individuals who share your interests. Our community is a welcoming space where you can exchange ideas, tips, and recommendations.
        4. Start Selling: If you have something unique to offer, why not become a seller yourself? List your products, set your prices, and reach customers who appreciate your creativity and craftsmanship.
        5. Stay Updated: Don't miss out on the latest trends, promotions, and events. Follow us on social media and subscribe to our newsletter to stay in the loop.\n
        At Lookflock, we're committed to providing you with a seamless and enjoyable shopping experience. If you have any questions, feedback, or suggestions, please don't hesitate to reach out to our customer support team. We're here to help!\n
        Once again, welcome to the Lookflock family. We can't wait to see what amazing discoveries you'll make and what inspiring stories you'll share with our community.\n
        Happy exploring!\n
        Warm regards,\n
        Fahad Ausaf\n
        Founder\n
        Lookflock - Social Shopping`,
        html: `<p>Dear ${displayName},<br>
        Welcome to Lookflock, a social shopping platform for fashion. We're thrilled to have you join our community of savvy shoppers and sellers who are passionate about discovering fashion and sharing unique products and experiences.<br>
        As a member of Lookflock, you now have access to a vibrant marketplace where you can explore a diverse range of fashion related products, connect with fellow enthusiasts, and unleash your creativity. Whether you're looking for handmade tailored-fit clothes, vintage treasures, or one-of-a-kind stitchworks, you'll find it all right here.<br>
        Here are a few things you can do to get started:<br>
        1. Complete Your Profile: Let other users get to know you by adding a profile picture and a brief bio. Share your interests, passions, and what you're looking for on the platform.
        2. Explore Our Marketplace: Dive into our curated collection of products from independent sellers and artisans. Discover hidden gems and support small businesses from around the world.
        3. Connect with the Community: Join discussions, share your favorite finds, and connect with like-minded individuals who share your interests. Our community is a welcoming space where you can exchange ideas, tips, and recommendations.
        4. Start Selling: If you have something unique to offer, why not become a seller yourself? List your products, set your prices, and reach customers who appreciate your creativity and craftsmanship.
        5. Stay Updated: Don't miss out on the latest trends, promotions, and events. Follow us on social media and subscribe to our newsletter to stay in the loop.<br>
        At Lookflock, we're committed to providing you with a seamless and enjoyable shopping experience. If you have any questions, feedback, or suggestions, please don't hesitate to reach out to our customer support team. We're here to help!<br>
        Once again, welcome to the Lookflock family. We can't wait to see what amazing discoveries you'll make and what inspiring stories you'll share with our community.<br>
        Happy exploring!<br>
        Warm regards,<br>
        Fahad Ausaf<br>
        Founder<br>
        Lookflock - Social Shopping</p>`
    };

    try {
        const response = await sendEmail(mailOptions);
        console.log('Welcome email sent:', response);
    } catch (error) {
        console.error('Error sending welcome email:', error);
    }
});
exports.newUser = functions.auth.user().onCreate(async (user) => {
    const { email, displayName } = user;
    console.log("USER", user)
    console.log("EMAIL", email)
    console.log("DisplayName", displayName)
});
exports.addUsersToMailChimp = functions.auth.user().onCreate(async (user) => {
    const email = user.email;
    // Split full name into firstName and lastName
    const listId = 'a3d7a0dc08';

    return mailchimp.lists.addListMember(listId, {
        email_address: email,
        status: 'subscribed',
    })
        .then(response => {
            console.log('Successfully added to Mailchimp list:', response);
        })
        .catch(error => {
            console.error('Error adding to Mailchimp list:', error);
        });
});
exports.addToIndex = functions.firestore.document('products/{productId}')
    .onCreate(snapshot => {
        const data = snapshot.data();
        const id = snapshot.id;
        return index.saveObject({ ...data, id: id });
    });

exports.updateIndex = functions.firestore.document('products/{productId}')
    .onUpdate(change => {
        const newData = change.after.data();
        const id = change.after.id;
        return index.saveObject({ ...newData, id: id });
    });

exports.deleteFromIndex = functions.firestore.document('products/{productId}')
    .onDelete(snapshot => index.deleteObject(snapshot.id));