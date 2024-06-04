// Import the Firebase Admin SDK
const admin = require('firebase-admin');

// Initialize the Firebase Admin SDK with your service account credentials
const serviceAccount = require('./serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// Access Firestore
const db = admin.firestore();

module.exports = { db };
