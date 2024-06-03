
const firebase = require("firebase/app");
// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDPudf5GpuW108ENzYoKnGfcrk7L3FVCcA",
    authDomain: "duplookflock-beada.firebaseapp.com",
    projectId: "duplookflock-beada",
    storageBucket: "duplookflock-beada.appspot.com",
    messagingSenderId: "912053971914",
    appId: "1:912053971914:web:264a4efbbce963ecedbd33",
    measurementId: "G-S1V4LT801T"
};

firebase.initializeApp(firebaseConfig)
// Initialize Firebase
// const app = initializeApp({
//   credential: applicationDefault(),
//   ...firebaseConfig
// });
 
// Initialize Firestore and Storage
const db = firebase.firestore()


// module.exports = {db} ;
