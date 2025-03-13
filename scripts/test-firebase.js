// Firebase Test Script
// Run this script with: node scripts/test-firebase.js

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, getDocs, deleteDoc } = require('firebase/firestore');

// Get Firebase config from the main app
const firebaseConfig = {
  // Copy your Firebase configuration here from config/firebase.ts
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
  measurementId: "YOUR_MEASUREMENT_ID"
};

async function testFirebase() {
  console.log('Testing Firebase connection...');
  console.log('Using configuration:', JSON.stringify(firebaseConfig, null, 2));
  
  try {
    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    console.log('✅ Firebase initialized successfully');
    
    // Test collection
    const testCollection = collection(db, 'test_collection');
    
    // Test writing to Firestore
    console.log('Testing write operation...');
    const testData = {
      message: 'Test message',
      timestamp: new Date().toISOString()
    };
    
    const docRef = await addDoc(testCollection, testData);
    console.log(`✅ Document written with ID: ${docRef.id}`);
    
    // Test reading from Firestore
    console.log('Testing read operation...');
    const querySnapshot = await getDocs(testCollection);
    console.log(`✅ Found ${querySnapshot.size} documents in test_collection`);
    
    // Clean up - delete the test document
    console.log('Cleaning up test document...');
    await deleteDoc(docRef);
    console.log('✅ Test document deleted');
    
    console.log('All tests passed! Your Firebase configuration is working correctly.');
    return true;
  } catch (error) {
    console.error('❌ Error testing Firebase:', error);
    console.log('\nPossible issues:');
    console.log('1. Your Firebase configuration may be incorrect');
    console.log('2. Your Firebase project may not be properly set up');
    console.log('3. Your Firebase security rules may be too restrictive');
    console.log('4. You may have network connectivity issues');
    console.log('\nPlease check the FIREBASE_SETUP.md file for troubleshooting steps.');
    return false;
  }
}

// Run the test
testFirebase(); 