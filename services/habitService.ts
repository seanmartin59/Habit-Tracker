import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, getDoc, query, where, orderBy, Timestamp, serverTimestamp, limit, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Habit, HabitLog } from '../models/Habit';
import { Alert } from 'react-native';

const HABITS_COLLECTION = 'habits';
const HABIT_LOGS_COLLECTION = 'habit_logs';

let hasShownIndexWarning = false;

export const checkAndShowIndexWarning = (error: any) => {
  if (!hasShownIndexWarning && error && error.message && error.message.includes('requires an index')) {
    hasShownIndexWarning = true;
    Alert.alert(
      'Firebase Index Required',
      'Your app needs to create database indexes. This is a one-time setup that may take a few minutes. Please click the link in the Firebase console to create the required indexes.',
      [{ text: 'OK', onPress: () => console.log('OK Pressed') }]
    );
  }
};

// Habit CRUD operations
export const addHabit = async (habit: Omit<Habit, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  const docRef = await addDoc(collection(db, HABITS_COLLECTION), {
    ...habit,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
  return docRef.id;
};

export const updateHabit = async (id: string, habit: Partial<Omit<Habit, 'id' | 'createdAt' | 'updatedAt'>>): Promise<void> => {
  const habitRef = doc(db, HABITS_COLLECTION, id);
  await updateDoc(habitRef, {
    ...habit,
    updatedAt: serverTimestamp()
  });
};

export const deleteHabit = async (id: string): Promise<void> => {
  const habitRef = doc(db, HABITS_COLLECTION, id);
  await deleteDoc(habitRef);
};

export const getHabits = async (): Promise<Habit[]> => {
  const q = query(collection(db, HABITS_COLLECTION), orderBy('createdAt', 'desc'));
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      name: data.name,
      description: data.description,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date()
    };
  });
};

export const getHabit = async (id: string): Promise<Habit | null> => {
  const habitRef = doc(db, HABITS_COLLECTION, id);
  const habitSnap = await getDoc(habitRef);
  
  if (habitSnap.exists()) {
    const data = habitSnap.data();
    return {
      id: habitSnap.id,
      name: data.name,
      description: data.description,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date()
    };
  }
  
  return null;
};

// Habit Log operations
export const logHabit = async (habitId: string, completed: boolean, notes?: string): Promise<string> => {
  console.log(`Attempting to log habit: ${habitId}, completed: ${completed}`);
  console.log(`Using collections: ${HABITS_COLLECTION} and ${HABIT_LOGS_COLLECTION}`);
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  try {
    // Try with compound query first (requires index)
    console.log('Using compound query to find existing log');
    const q = query(
      collection(db, HABIT_LOGS_COLLECTION),
      where('habitId', '==', habitId),
      where('date', '==', Timestamp.fromDate(today))
    );
    
    try {
      console.log('Executing query...');
      const querySnapshot = await getDocs(q);
      console.log(`Found ${querySnapshot.docs.length} existing logs for today`);
      
      if (!querySnapshot.empty) {
        // Update existing log
        const logDoc = querySnapshot.docs[0];
        console.log(`Updating existing log: ${logDoc.id}`);
        try {
          console.log(`Updating with data: completed=${completed}`);
          await updateDoc(doc(db, HABIT_LOGS_COLLECTION, logDoc.id), {
            completed,
            notes,
            updatedAt: serverTimestamp()
          });
          console.log('Log updated successfully');
          return logDoc.id;
        } catch (updateError) {
          console.error('Error updating log:', updateError);
          throw updateError;
        }
      } else {
        // Create new log
        console.log('Creating new log');
        try {
          const newLog = {
            habitId,
            date: Timestamp.fromDate(today),
            completed,
            notes,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          };
          console.log('New log data:', JSON.stringify(newLog));
          
          console.log(`Adding document to collection: ${HABIT_LOGS_COLLECTION}`);
          const docRef = await addDoc(collection(db, HABIT_LOGS_COLLECTION), newLog);
          console.log(`New log created with ID: ${docRef.id}`);
          return docRef.id;
        } catch (addError) {
          console.error('Error creating log:', addError);
          console.error('Error details:', JSON.stringify(addError));
          throw addError;
        }
      }
    } catch (queryError) {
      console.error('Error querying logs:', queryError);
      console.error('Error details:', JSON.stringify(queryError));
      throw queryError;
    }
  } catch (error) {
    console.warn('Index not yet available or other error, falling back to simple query:', error);
    console.error('Error details:', JSON.stringify(error));
    checkAndShowIndexWarning(error);
    
    // Fallback to a simple query without the date filter
    console.log('Using simple query as fallback');
    try {
      const simpleQuery = query(
        collection(db, HABIT_LOGS_COLLECTION),
        where('habitId', '==', habitId)
      );
      
      const querySnapshot = await getDocs(simpleQuery);
      console.log(`Found ${querySnapshot.docs.length} logs for this habit`);
      
      // Find today's log manually
      const todayTimestamp = Timestamp.fromDate(today);
      const todayLog = querySnapshot.docs.find(doc => {
        const data = doc.data();
        const logDate = data.date;
        return logDate && logDate.seconds === todayTimestamp.seconds;
      });
      
      if (todayLog) {
        // Update existing log
        console.log(`Updating existing log (fallback): ${todayLog.id}`);
        try {
          await updateDoc(doc(db, HABIT_LOGS_COLLECTION, todayLog.id), {
            completed,
            notes,
            updatedAt: serverTimestamp()
          });
          console.log('Log updated successfully (fallback)');
          return todayLog.id;
        } catch (updateError) {
          console.error('Error updating log (fallback):', updateError);
          console.error('Error details:', JSON.stringify(updateError));
          throw updateError;
        }
      } else {
        // Create new log
        console.log('Creating new log (fallback)');
        try {
          const newLog = {
            habitId,
            date: Timestamp.fromDate(today),
            completed,
            notes,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          };
          console.log('New log data (fallback):', JSON.stringify(newLog));
          
          console.log(`Adding document to collection: ${HABIT_LOGS_COLLECTION}`);
          const docRef = await addDoc(collection(db, HABIT_LOGS_COLLECTION), newLog);
          console.log(`New log created with ID (fallback): ${docRef.id}`);
          return docRef.id;
        } catch (addError) {
          console.error('Error creating log (fallback):', addError);
          console.error('Error details:', JSON.stringify(addError));
          throw addError;
        }
      }
    } catch (fallbackError) {
      console.error('Error in fallback logic:', fallbackError);
      console.error('Error details:', JSON.stringify(fallbackError));
      throw fallbackError;
    }
  }
};

export const getHabitLogs = async (habitId: string): Promise<HabitLog[]> => {
  try {
    // Try with the compound query first (requires index)
    const q = query(
      collection(db, HABIT_LOGS_COLLECTION),
      where('habitId', '==', habitId),
      orderBy('date', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        habitId: data.habitId,
        date: data.date.toDate(),
        completed: data.completed,
        notes: data.notes
      };
    });
  } catch (error) {
    console.warn('Index not yet available, falling back to simple query:', error);
    checkAndShowIndexWarning(error);
    
    // Fallback to a simple query without ordering (doesn't require index)
    const simpleQuery = query(
      collection(db, HABIT_LOGS_COLLECTION),
      where('habitId', '==', habitId)
    );
    
    const querySnapshot = await getDocs(simpleQuery);
    
    // Sort the results in memory instead
    const logs = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        habitId: data.habitId,
        date: data.date.toDate(),
        completed: data.completed,
        notes: data.notes
      };
    });
    
    // Sort by date (newest first)
    return logs.sort((a, b) => b.date.getTime() - a.date.getTime());
  }
};

export const getHabitStreak = async (habitId: string): Promise<number> => {
  const logs = await getHabitLogs(habitId);
  
  if (logs.length === 0) {
    return 0;
  }
  
  // Sort logs by date (newest first)
  logs.sort((a, b) => b.date.getTime() - a.date.getTime());
  
  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Check if there's a log for today and if it's completed
  const todayLog = logs.find(log => {
    const logDate = new Date(log.date);
    logDate.setHours(0, 0, 0, 0);
    return logDate.getTime() === today.getTime();
  });
  
  // If there's no log for today or it's not completed, check yesterday
  if (!todayLog || !todayLog.completed) {
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const yesterdayLog = logs.find(log => {
      const logDate = new Date(log.date);
      logDate.setHours(0, 0, 0, 0);
      return logDate.getTime() === yesterday.getTime();
    });
    
    // If there's no log for yesterday or it's not completed, streak is 0
    if (!yesterdayLog || !yesterdayLog.completed) {
      return 0; // Streak broken
    }
  }
  
  // Start with the most recent completed log
  let currentDate = todayLog && todayLog.completed ? today : new Date(today);
  currentDate.setDate(currentDate.getDate() - 1); // Start with yesterday if today is not completed
  
  // Count consecutive completed days
  let consecutiveDays = 0;
  let dayChecking = true;
  
  while (dayChecking) {
    const dateToCheck = new Date(currentDate);
    dateToCheck.setHours(0, 0, 0, 0);
    
    const logForDate = logs.find(log => {
      const logDate = new Date(log.date);
      logDate.setHours(0, 0, 0, 0);
      return logDate.getTime() === dateToCheck.getTime();
    });
    
    if (logForDate && logForDate.completed) {
      consecutiveDays++;
      currentDate.setDate(currentDate.getDate() - 1); // Move to previous day
    } else {
      dayChecking = false; // Break the streak
    }
  }
  
  return todayLog && todayLog.completed ? consecutiveDays + 1 : consecutiveDays;
};

export const testFirebaseConnection = async (): Promise<boolean> => {
  try {
    console.log('Testing Firebase connection...');
    
    // Try to write a test document
    const testCollection = collection(db, 'test_collection');
    const testData = {
      test: true,
      timestamp: serverTimestamp()
    };
    
    console.log('Attempting to write test data:', JSON.stringify(testData));
    const docRef = await addDoc(testCollection, testData);
    console.log(`Test document written with ID: ${docRef.id}`);
    
    // Clean up by deleting the test document
    await deleteDoc(docRef);
    console.log('Test document deleted successfully');
    
    return true;
  } catch (error) {
    console.error('Firebase connection test failed:', error);
    return false;
  }
};

export const checkFirebasePermissions = async (): Promise<{
  canReadHabits: boolean;
  canWriteHabits: boolean;
  canReadLogs: boolean;
  canWriteLogs: boolean;
}> => {
  const result = {
    canReadHabits: false,
    canWriteHabits: false,
    canReadLogs: false,
    canWriteLogs: false
  };
  
  try {
    console.log('Checking Firebase permissions...');
    
    // Check if we can read habits
    try {
      const habitsQuery = query(collection(db, HABITS_COLLECTION), limit(1));
      await getDocs(habitsQuery);
      result.canReadHabits = true;
      console.log('Can read habits: YES');
    } catch (error) {
      console.error('Cannot read habits:', error);
    }
    
    // Check if we can write habits
    try {
      const testHabitRef = doc(collection(db, HABITS_COLLECTION));
      await setDoc(testHabitRef, {
        name: 'Test Habit',
        description: 'Test habit for permission check',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }, { merge: true });
      await deleteDoc(testHabitRef);
      result.canWriteHabits = true;
      console.log('Can write habits: YES');
    } catch (error) {
      console.error('Cannot write habits:', error);
    }
    
    // Check if we can read habit logs
    try {
      const logsQuery = query(collection(db, HABIT_LOGS_COLLECTION), limit(1));
      await getDocs(logsQuery);
      result.canReadLogs = true;
      console.log('Can read habit logs: YES');
    } catch (error) {
      console.error('Cannot read habit logs:', error);
    }
    
    // Check if we can write habit logs
    try {
      const testLogRef = doc(collection(db, HABIT_LOGS_COLLECTION));
      await setDoc(testLogRef, {
        habitId: 'test-habit-id',
        date: Timestamp.fromDate(new Date()),
        completed: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }, { merge: true });
      await deleteDoc(testLogRef);
      result.canWriteLogs = true;
      console.log('Can write habit logs: YES');
    } catch (error) {
      console.error('Cannot write habit logs:', error);
    }
    
    return result;
  } catch (error) {
    console.error('Error checking Firebase permissions:', error);
    return result;
  }
}; 