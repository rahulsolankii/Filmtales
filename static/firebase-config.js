// static/firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, query, where, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyCyA7TRFU1o6GD-OZNWc1bEfP2MqaUe_vU",
    authDomain: "filmtales-123.firebaseapp.com",
    projectId: "filmtales-123",
    storageBucket: "filmtales-123.firebasestorage.app",
    messagingSenderId: "1024370372361",
    appId: "1:1024370372361:web:bdf6ed98808c165a92edd8",
    measurementId: "G-4L6M5T5V4C"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db, collection, addDoc, getDocs, query, where, serverTimestamp };
