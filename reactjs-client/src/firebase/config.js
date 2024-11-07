import { initializeApp } from 'firebase/app';  // Import the core firebase app module
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth';        // Firebase Authentication
import { getFirestore } from 'firebase/firestore';  // Firebase Firestore
import { getStorage } from 'firebase/storage';   // Firebase Storage

// Firebase configuration from environment variables
const firebaseConfig = {
    apiKey: "AIzaSyCGulsm6hwsEb_a3btswA0Hn_BLZmeJykg",
    authDomain: "restlebnb-hotel-app.firebaseapp.com",
    projectId: "restlebnb-hotel-app",
    storageBucket: "restlebnb-hotel-app.appspot.com",
    messagingSenderId: "507195533055",
    appId: "1:507195533055:web:f4ba5294358025bfe04eca",
    measurementId: "G-KGYH5W62YL"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
const auth = getAuth(app);  // Initialize Firebase Authentication
const db = getFirestore(app);  // Initialize Firestore Database
const firebaseStorage = getStorage(app);  // Initialize Firebase Storage

// Ensure persistence is set to local (default)
setPersistence(auth, browserLocalPersistence)
  .then(() => {
    // Your logic for signed-in users here
  })
  .catch((error) => {
    console.error("Error setting persistence", error);
  });

// Export Firebase services for use in other parts of your app
export { auth, db, firebaseStorage };
