// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyC7XLTe91IOldSkonVUAPcICTDIGApJ0f0",
  authDomain: "movievault-40a52.firebaseapp.com",
  projectId: "movievault-40a52",
  storageBucket: "movievault-40a52.firebasestorage.app",
  messagingSenderId: "32100421644",
  appId: "1:32100421644:web:8e87cd05b9b7017df15e29",
  measurementId: "G-VK4LSRPBG0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
const db = getFirestore(app);

export { app, analytics, auth, googleProvider, db, signInWithPopup };
