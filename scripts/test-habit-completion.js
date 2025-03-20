const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, getDocs, query, where, Timestamp } = require('firebase/firestore');

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBYCyNZOP34FYgTKJeihzkWZ43sR-kYQk",
  authDomain: "sean-habit-tracker.firebaseapp.com",
  projectId: "sean-habit-tracker",
  storageBucket: "sean-habit-tracker.appspot.com",
  messagingSenderId: "569825221148",
  appId: "1:569825221148:web:e3046fd7801ca952309d9",
  measurementId: "G-LZZPSTMGLJ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function testHabitCompletion() {
  console.log('=== Habit Completion Test ===');
  
  try {
    // 1. Get the first habit from the habits collection
    console.log('\n1. Fetching a habit to test with...');
    const habitsSnapshot = await getDocs(collection(db, 'habits'));
    
    if (habitsSnapshot.empty) {
      console.log('❌ No habits found in the database. Please add a habit first.');
      return;
    }
    
    const habitDoc = habitsSnapshot.docs[0];
    const habit = { id: habitDoc.id, ...habitDoc.data() };
    console.log(`✅ Found habit: ${habit.name} (ID: ${habit.id})`);
    
    // 2. Create a test log entry
    console.log('\n2. Creating a test habit log entry...');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const logData = {
      habitId: habit.id,
      date: Timestamp.fromDate(today),
      completed: true,
      timestamp: Timestamp.now()
    };
    
    console.log('Log data to be written:', logData);
    
    // 3. Write to habit_logs collection
    try {
      const docRef = await addDoc(collection(db, 'habit_logs'), logData);
      console.log(`✅ Successfully logged habit completion, document ID: ${docRef.id}`);
    } catch (error) {
      console.log(`❌ Failed to write to habit_logs: ${error.message}`);
      console.log('Error details:', error);
    }
    
    // 4. Check if the log was written
    console.log('\n3. Verifying the log was written...');
    const q = query(
      collection(db, 'habit_logs'),
      where('habitId', '==', habit.id),
      where('date', '==', Timestamp.fromDate(today))
    );
    
    const logsSnapshot = await getDocs(q);
    if (logsSnapshot.empty) {
      console.log('❌ No logs found for this habit today. The write operation failed.');
    } else {
      console.log(`✅ Found ${logsSnapshot.size} log(s) for this habit today.`);
      logsSnapshot.forEach(doc => {
        console.log('Log data:', doc.data());
      });
    }
    
  } catch (error) {
    console.error('Error during test:', error);
  }
}

testHabitCompletion(); 