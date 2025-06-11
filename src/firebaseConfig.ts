// Import the functions you need from the SDKs you need
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig1 = {
  apiKey: "AIzaSyBV98wElj_X715z0E8WDQ3BxjltpDDAeOY",
  authDomain: "vps-master.firebaseapp.com",
  projectId: "vps-master",
  storageBucket: "vps-master.firebasestorage.app",
  messagingSenderId: "240249257459",
  appId: "1:240249257459:web:eb4563230093e7c49ce686",
  measurementId: "G-2R2GJ02W6T"
};

// Check if Firebase app is already initialized
const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig1);

// Initialize Firestore
export const db = getFirestore(app);
