// Import the functions you need from the SDKs you need
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig1 = {
  apiKey: "AIzaSyAexHjzEWlIYxHI3TWa_NdqM23fD4knzxE",
  authDomain: "supermart-722b5.firebaseapp.com",
  projectId: "supermart-722b5",
  storageBucket: "supermart-722b5.appspot.com",
  messagingSenderId: "288883114231",
  appId: "1:288883114231:web:99ba79ebfca4ad2af813f2",
  measurementId: "G-L37537DZCZ"
};

// Check if Firebase app is already initialized
const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig1);

// Initialize Firestore
export const db = getFirestore(app);
