import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Habit, HabitLog } from '../../models/Habit';
import { getHabit, deleteHabit, getHabitStreak, logHabit, getHabitLogs, testFirebaseConnection, checkFirebasePermissions } from '../../services/habitService';
import HabitHistory from '../../components/HabitHistory';

export default function HabitDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  
  const [habit, setHabit] = useState<Habit | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [streak, setStreak] = useState(0);
  const [completedToday, setCompletedToday] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [firebaseChecked, setFirebaseChecked] = useState(false);
  
  // Check Firebase permissions when the screen loads
  useEffect(() => {
    const checkFirebase = async () => {
      if (firebaseChecked) return;
      
      try {
        console.log('Detail screen: Testing Firebase connection...');
        const connectionTest = await testFirebaseConnection();
        
        if (!connectionTest) {
          Alert.alert(
            'Connection Error',
            'Could not connect to the database. Please check your internet connection and try again.',
            [{ text: 'OK' }]
          );
          return;
        }
        
        console.log('Detail screen: Checking Firebase permissions...');
        const permissions = await checkFirebasePermissions();
        
        if (!permissions.canReadHabits || !permissions.canWriteHabits || 
            !permissions.canReadLogs || !permissions.canWriteLogs) {
          Alert.alert(
            'Permission Error',
            'The app does not have the necessary permissions to access the database. Please check your Firebase security rules.',
            [{ text: 'OK' }]
          );
        }
        
        setFirebaseChecked(true);
      } catch (error) {
        console.error('Error checking Firebase in detail screen:', error);
      }
    };
    
    checkFirebase();
  }, [firebaseChecked]);
  
  useEffect(() => {
    if (id) {
      loadHabit();
    }
  }, [id]);
  
  const loadHabit = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!id) {
        setError('Invalid habit ID');
        return;
      }
      
      const habitData = await getHabit(id);
      if (!habitData) {
        setError('Habit not found');
        return;
      }
      
      setHabit(habitData);
      
      try {
        // Get streak
        const currentStreak = await getHabitStreak(id);
        setStreak(currentStreak);
      } catch (streakError) {
        console.error('Error calculating streak:', streakError);
        setStreak(0);
      }
      
      try {
        // Check if completed today
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // Get habit logs to check if completed today
        const logs = await getHabitLogs(id);
        const todayLog = logs.find(log => {
          const logDate = new Date(log.date);
          logDate.setHours(0, 0, 0, 0);
          return logDate.getTime() === today.getTime();
        });
        
        setCompletedToday(todayLog ? todayLog.completed : false);
      } catch (logsError) {
        console.error('Error checking completion status:', logsError);
        setCompletedToday(false);
      }
      
    } catch (err) {
      console.error('Error loading habit:', err);
      setError('Failed to load habit details. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleToggleHabit = async () => {
    try {
      if (!id) return;
      
      // Immediately update local state for better UI feedback
      const newCompletedState = !completedToday;
      setCompletedToday(newCompletedState);
      
      console.log(`Detail screen: Toggling habit ${id}, current status: ${completedToday}, new status: ${newCompletedState}`);
      setLoading(true);
      
      // Test Firebase connection first
      const connectionTest = await testFirebaseConnection();
      if (!connectionTest) {
        throw new Error('Firebase connection test failed');
      }
      
      // Now try to log the habit
      const logId = await logHabit(id, newCompletedState);
      console.log(`Detail screen: Toggle completed, log ID: ${logId}, reloading habit`);
      
      // Refresh data
      await loadHabit();
      
      // Trigger history refresh
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error('Error toggling habit:', error);
      // Revert local state if there was an error
      setCompletedToday(completedToday); // Revert to original state
      Alert.alert(
        'Error',
        'Failed to update habit status. Please check your internet connection and try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };
  
  const handleDeleteHabit = () => {
    Alert.alert(
      'Delete Habit',
      'Are you sure you want to delete this habit? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              if (!id) return;
              
              await deleteHabit(id);
              router.back();
            } catch (error) {
              console.error('Error deleting habit:', error);
              Alert.alert('Error', 'Failed to delete habit');
            }
          }
        },
      ]
    );
  };
  
  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }
  
  if (error || !habit) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error || 'Something went wrong'}</Text>
        <TouchableOpacity style={styles.button} onPress={() => router.back()}>
          <Text style={styles.buttonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#212121" />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.deleteButton}
          onPress={handleDeleteHabit}
        >
          <Ionicons name="trash-outline" size={24} color="#F44336" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.habitInfo}>
        <Text style={styles.habitName}>{habit.name}</Text>
        {habit.description && (
          <Text style={styles.habitDescription}>{habit.description}</Text>
        )}
        
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Ionicons name="calendar-outline" size={20} color="#757575" />
            <Text style={styles.statText}>
              Created on {habit.createdAt.toLocaleDateString()}
            </Text>
          </View>
          
          <View style={styles.statItem}>
            <Ionicons 
              name="flame" 
              size={20} 
              color={streak > 0 ? "#FF9800" : "#BDBDBD"} 
            />
            <Text style={[
              styles.statText, 
              { color: streak > 0 ? "#FF9800" : "#757575" }
            ]}>
              {streak} day streak
            </Text>
          </View>
        </View>
      </View>
      
      <TouchableOpacity 
        style={[
          styles.trackButton,
          completedToday ? styles.completedButton : styles.notCompletedButton
        ]}
        onPress={handleToggleHabit}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator size="small" color="white" />
        ) : (
          <>
            <Ionicons 
              name={completedToday ? "checkmark-circle" : "ellipse-outline"} 
              size={24} 
              color="white" 
            />
            <Text style={styles.trackButtonText}>
              {completedToday ? 'Completed Today' : 'Mark as Completed'}
            </Text>
          </>
        )}
      </TouchableOpacity>
      
      <View style={styles.historyContainer}>
        <HabitHistory habitId={id} refreshTrigger={refreshTrigger} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  backButton: {
    padding: 8,
  },
  deleteButton: {
    padding: 8,
  },
  habitInfo: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  habitName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#212121',
    marginBottom: 8,
  },
  habitDescription: {
    fontSize: 16,
    color: '#757575',
    marginBottom: 16,
  },
  statsContainer: {
    marginTop: 8,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statText: {
    fontSize: 14,
    color: '#757575',
    marginLeft: 8,
  },
  trackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  completedButton: {
    backgroundColor: '#4CAF50',
  },
  notCompletedButton: {
    backgroundColor: '#757575',
  },
  trackButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
  historyContainer: {
    padding: 16,
    flex: 1,
  },
  errorText: {
    color: '#F44336',
    fontSize: 16,
    marginBottom: 16,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
  },
  buttonText: {
    color: 'white',
    fontWeight: '500',
  },
}); 