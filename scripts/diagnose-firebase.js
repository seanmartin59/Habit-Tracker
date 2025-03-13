// Firebase Diagnostic Script
// Run this script with: node scripts/diagnose-firebase.js

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, getDocs, deleteDoc, query, where, Timestamp } = require('firebase/firestore');

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

async function diagnoseFirebase() {
  console.log('=== Firebase Diagnostic Tool ===');
  console.log('Using configuration:', JSON.stringify(firebaseConfig, null, 2));
  
  try {
    // Initialize Firebase
    console.log('\n1. Testing Firebase initialization...');
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    console.log('✅ Firebase initialized successfully');
    
    // Test collections
    const collections = ['habits', 'habit_logs', 'habitLogs', 'test_collection'];
    
    // Test reading from collections
    console.log('\n2. Testing read access to collections...');
    for (const collectionName of collections) {
      try {
        console.log(`   Testing read access to ${collectionName}...`);
        const querySnapshot = await getDocs(collection(db, collectionName));
        console.log(`   ✅ Successfully read from ${collectionName}, found ${querySnapshot.size} documents`);
      } catch (error) {
        console.log(`   ❌ Failed to read from ${collectionName}: ${error.message}`);
      }
    }
    
    // Test writing to test_collection
    console.log('\n3. Testing write access to test_collection...');
    try {
      const testData = {
        message: 'Test message',
        timestamp: new Date().toISOString()
      };
      
      const docRef = await addDoc(collection(db, 'test_collection'), testData);
      console.log(`   ✅ Successfully wrote to test_collection, document ID: ${docRef.id}`);
      
      // Clean up
      await deleteDoc(docRef);
      console.log('   ✅ Successfully deleted test document');
    } catch (error) {
      console.log(`   ❌ Failed to write to test_collection: ${error.message}`);
    }
    
    // Test writing to habit_logs
    console.log('\n4. Testing write access to habit_logs...');
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const testLog = {
        habitId: 'test-habit-id',
        date: Timestamp.fromDate(today),
        completed: true,
        notes: 'Test note',
        createdAt: Timestamp.fromDate(new Date()),
        updatedAt: Timestamp.fromDate(new Date())
      };
      
      const docRef = await addDoc(collection(db, 'habit_logs'), testLog);
      console.log(`   ✅ Successfully wrote to habit_logs, document ID: ${docRef.id}`);
      
      // Clean up
      await deleteDoc(docRef);
      console.log('   ✅ Successfully deleted test log');
    } catch (error) {
      console.log(`   ❌ Failed to write to habit_logs: ${error.message}`);
    }
    
    // Test querying habit_logs
    console.log('\n5. Testing compound query on habit_logs...');
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const q = query(
        collection(db, 'habit_logs'),
        where('habitId', '==', 'test-habit-id'),
        where('date', '==', Timestamp.fromDate(today))
      );
      
      const querySnapshot = await getDocs(q);
      console.log(`   ✅ Successfully executed compound query, found ${querySnapshot.size} documents`);
    } catch (error) {
      console.log(`   ❌ Failed to execute compound query: ${error.message}`);
      console.log('   This may indicate that you need to create an index for this query.');
      console.log('   Check the Firebase console for a link to create the required index.');
    }
    
    console.log('\n=== Diagnostic Complete ===');
    console.log('If you see any failures above, check the FIREBASE_SETUP.md file for troubleshooting steps.');
  } catch (error) {
    console.error('\n❌ Fatal error:', error);
    console.log('\nPossible issues:');
    console.log('1. Your Firebase configuration may be incorrect');
    console.log('2. Your Firebase project may not be properly set up');
    console.log('3. Your Firebase security rules may be too restrictive');
    console.log('4. You may have network connectivity issues');
  }
}

// Run the diagnostic
diagnoseFirebase(); 