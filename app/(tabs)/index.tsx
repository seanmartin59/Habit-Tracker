import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, FlatList, ActivityIndicator, Text, View, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { HabitWithStats, HabitLog } from '../../models/Habit';
import { getHabits, getHabitStreak, getHabitLogs, checkFirebasePermissions, testFirebaseConnection } from '../../services/habitService';
import HabitItem from '../../components/HabitItem';
import AddHabitForm from '../../components/AddHabitForm';

export default function HomeScreen() {
  const [habits, setHabits] = useState<HabitWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [firebaseChecked, setFirebaseChecked] = useState(false);

  // Check Firebase permissions when the app starts
  useEffect(() => {
    const checkFirebase = async () => {
      if (firebaseChecked) return;
      
      try {
        console.log('Testing Firebase connection...');
        const connectionTest = await testFirebaseConnection();
        
        if (!connectionTest) {
          Alert.alert(
            'Connection Error',
            'Could not connect to the database. Please check your internet connection and try again.',
            [{ text: 'OK' }]
          );
          return;
        }
        
        console.log('Checking Firebase permissions...');
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
        console.error('Error checking Firebase:', error);
      }
    };
    
    checkFirebase();
  }, [firebaseChecked]);

  // Load habits when the screen is focused
  useFocusEffect(
    useCallback(() => {
      console.log('Home screen focused, loading habits');
      loadHabits();
      
      return () => {
        console.log('Home screen unfocused');
      };
    }, [])
  );

  const loadHabits = async () => {
    try {
      setError(null);
      setLoading(true);
      console.log('Loading habits...');
      
      // Get all habits
      const habitsList = await getHabits();
      console.log(`Found ${habitsList.length} habits`);
      
      if (habitsList.length === 0) {
        setHabits([]);
        setLoading(false);
        setRefreshing(false);
        return;
      }
      
      // Get additional stats for each habit
      const habitsWithStats = await Promise.all(
        habitsList.map(async (habit) => {
          try {
            console.log(`Processing habit: ${habit.id} - ${habit.name}`);
            const streak = await getHabitStreak(habit.id);
            
            // Check if the habit was completed today
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            // Get habit logs to check if completed today
            const logs = await getHabitLogs(habit.id);
            const todayLog = logs.find(log => {
              const logDate = new Date(log.date);
              logDate.setHours(0, 0, 0, 0);
              return logDate.getTime() === today.getTime();
            });
            
            const completedToday = todayLog ? todayLog.completed : false;
            console.log(`Habit ${habit.id} - ${habit.name}: streak=${streak}, completedToday=${completedToday}`);
            
            return {
              ...habit,
              streak,
              completedToday,
            };
          } catch (err) {
            console.error(`Error processing habit ${habit.id}:`, err);
            // Return the habit with default stats if there's an error
            return {
              ...habit,
              streak: 0,
              completedToday: false,
            };
          }
        })
      );
      
      console.log('Setting habits state with updated data');
      setHabits(habitsWithStats);
    } catch (err) {
      console.error('Error loading habits:', err);
      setError('Failed to load habits. Please check your connection and try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadHabits();
  };

  const handleHabitAdded = () => {
    setShowAddForm(false);
    loadHabits();
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {showAddForm ? (
        <AddHabitForm 
          onHabitAdded={handleHabitAdded} 
          onCancel={() => setShowAddForm(false)} 
        />
      ) : (
        <>
          <View style={styles.header}>
            <Text style={styles.title}>My Habits</Text>
            <TouchableOpacity 
              style={styles.addButton}
              onPress={() => setShowAddForm(true)}
            >
              <Ionicons name="add-circle" size={24} color="#4CAF50" />
              <Text style={styles.addButtonText}>Add Habit</Text>
            </TouchableOpacity>
          </View>

          {error ? (
            <View style={styles.centered}>
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity style={styles.retryButton} onPress={loadHabits}>
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : habits.length === 0 ? (
            <View style={styles.centered}>
              <Text style={styles.emptyText}>No habits yet</Text>
              <Text style={styles.emptySubText}>Tap the Add Habit button to get started</Text>
            </View>
          ) : (
            <FlatList
              data={habits}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <HabitItem habit={item} onUpdate={loadHabits} />
              )}
              contentContainerStyle={styles.list}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
              }
            />
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#F5F5F5',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#212121',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addButtonText: {
    marginLeft: 4,
    color: '#4CAF50',
    fontWeight: '500',
  },
  list: {
    paddingBottom: 16,
  },
  errorText: {
    color: '#F44336',
    fontSize: 16,
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#F44336',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: '500',
  },
  emptyText: {
    fontSize: 18,
    color: '#757575',
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 14,
    color: '#9E9E9E',
  },
});
