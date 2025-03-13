import { initializeApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { Alert } from 'react-native';

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  // NOTE: This API key appears to be incomplete or incorrect.
  // Please replace with your actual Firebase configuration from the Firebase console.
  // Go to: https://console.firebase.google.com/ > Your Project > Project Settings > General > Your apps > Firebase SDK snippet
  apiKey: "AIzaSyBYCyNZOP34FYgTKJeihzkWZ43sR-kYQk",
  authDomain: "sean-habit-tracker.firebaseapp.com",
  projectId: "sean-habit-tracker",
  storageBucket: "sean-habit-tracker.appspot.com", // Fixed the storage bucket URL
  messagingSenderId: "569825221148",
  appId: "1:569825221148:web:e3046fd7801ca952309d9",
  measurementId: "G-LZZPSTMGLJ"
};

// IMPORTANT: The Firebase security rules require authentication, but this app doesn't implement authentication yet.
// For testing purposes, you should modify your Firebase security rules to allow public access:
/*
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
*/

// Initialize Firebase
let app: FirebaseApp;
let db: Firestore;

try {
  console.log('Initializing Firebase with config:', JSON.stringify(firebaseConfig));
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  console.log('Firebase initialized successfully');
} catch (error) {
  console.error('Error initializing Firebase:', error);
  Alert.alert(
    'Firebase Error',
    'There was an error connecting to the database. Please check your internet connection and try again.',
    [{ text: 'OK' }]
  );
  // Initialize with default values to prevent TypeScript errors
  app = {} as FirebaseApp;
  db = {} as Firestore;
}

export { db }; 