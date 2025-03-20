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
  try {
    console.log(`[HABIT LOG] Starting logHabit function for habit: ${habitId}, completed: ${completed}`);
    
    // Get today's date with time set to midnight
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    console.log(`[HABIT LOG] Today's date: ${today.toISOString()}`);
    
    // Check if there's already a log for this habit today
    console.log(`[HABIT LOG] Checking for existing log for habit ${habitId} on ${today.toISOString()}`);
    
    // IMPORTANT: Use Timestamp for consistency in both query and document creation
    const todayTimestamp = Timestamp.fromDate(today);
    
    console.log(`[HABIT LOG] Created Timestamp: ${todayTimestamp}`);
    
    const q = query(
      collection(db, HABIT_LOGS_COLLECTION),
      where('habitId', '==', habitId),
      where('date', '==', todayTimestamp)
    );
    
    console.log('[HABIT LOG] Executing query to find existing log');
    const querySnapshot = await getDocs(q);
    console.log(`[HABIT LOG] Query returned ${querySnapshot.size} results`);
    
    if (!querySnapshot.empty) {
      // Update existing log
      const logDoc = querySnapshot.docs[0];
      console.log(`[HABIT LOG] Updating existing log: ${logDoc.id}`);
      try {
        console.log(`[HABIT LOG] Updating with data: completed=${completed}`);
        // Create update object without undefined values
        const updateData: any = {
          completed,
          updatedAt: serverTimestamp()
        };
        
        // Only add notes if it's not undefined
        if (notes !== undefined) {
          updateData.notes = notes;
        }
        
        await updateDoc(doc(db, HABIT_LOGS_COLLECTION, logDoc.id), updateData);
        console.log('[HABIT LOG] Log updated successfully');
        return logDoc.id;
      } catch (updateError) {
        console.error('[HABIT LOG] Error updating log:', updateError);
        throw updateError;
      }
    } else {
      // Create new log
      console.log('[HABIT LOG] No existing log found. Creating new log');
      try {
        // Create new log object without undefined values
        const newLog: any = {
          habitId,
          date: todayTimestamp,
          completed,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };
        
        // Only add notes if it's not undefined
        if (notes !== undefined) {
          newLog.notes = notes;
        }
        
        console.log('[HABIT LOG] New log data:', JSON.stringify(newLog, (key, value) => 
          value instanceof Timestamp ? `Timestamp(seconds=${value.seconds}, nanoseconds=${value.nanoseconds})` : value
        ));
        
        console.log(`[HABIT LOG] Adding document to collection: ${HABIT_LOGS_COLLECTION}`);
        const docRef = await addDoc(collection(db, HABIT_LOGS_COLLECTION), newLog);
        console.log(`[HABIT LOG] New log created with ID: ${docRef.id}`);
        return docRef.id;
      } catch (addError) {
        console.error('[HABIT LOG] Error creating log:', addError);
        console.error('[HABIT LOG] Error details:', JSON.stringify(addError));
        throw addError;
      }
    }
  } catch (queryError) {
    console.error('[HABIT LOG] Error in logHabit function:', queryError);
    console.error('[HABIT LOG] Error details:', JSON.stringify(queryError));
    throw queryError;
  }
};

export const getHabitLogs = async (habitId: string): Promise<HabitLog[]> => {
  try {
    console.log(`[HABIT LOG] Getting logs for habit: ${habitId}`);
    
    // Try with the compound query first (requires index)
    const q = query(
      collection(db, HABIT_LOGS_COLLECTION),
      where('habitId', '==', habitId),
      orderBy('date', 'desc')
    );
    
    console.log('[HABIT LOG] Executing query to get habit logs');
    const querySnapshot = await getDocs(q);
    console.log(`[HABIT LOG] Query returned ${querySnapshot.size} logs`);
    
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      console.log(`[HABIT LOG] Processing log: ${doc.id}, date: ${data.date}`);
      return {
        id: doc.id,
        habitId: data.habitId,
        date: data.date.toDate(),
        completed: data.completed,
        notes: data.notes
      };
    });
  } catch (error) {
    console.warn('[HABIT LOG] Index not yet available, falling back to simple query:', error);
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