// Shared Firebase initialization for Apni Dukaan
// Loaded as an ES module by both admin.js and script.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth,
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCD_hingWScbZToCWbMttPJ_TUTekSfN2w",
  authDomain: "apni-dukan-c5a29.firebaseapp.com",
  projectId: "apni-dukan-c5a29",
  storageBucket: "apni-dukan-c5a29.firebasestorage.app",
  messagingSenderId: "398816078746",
  appId: "1:398816078746:web:4ffaa29ae58ef396062823",
  measurementId: "G-M7GD1SGN1Z"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

// Firebase Authentication uses an email internally. The storefront maps the
// case-insensitive admin username "Madaag1" to this private sign-in address.
// Do not expose or store the admin password in source code or Firestore.
export const ADMIN_USERNAME = 'madaag1';
export const ADMIN_AUTH_EMAIL = 'madaag1@admin.apnidukan.com';
export {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  onAuthStateChanged,
  signOut
};
