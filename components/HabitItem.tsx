import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { HabitWithStats } from '../models/Habit';
import { logHabit, testFirebaseConnection } from '../services/habitService';

interface HabitItemProps {
  habit: HabitWithStats;
  onUpdate: () => void;
}

export default function HabitItem({ habit, onUpdate }: HabitItemProps) {
  const router = useRouter();
  const [isToggling, setIsToggling] = useState(false);
  const [localCompletedState, setLocalCompletedState] = useState(habit.completedToday);
  
  // Update local state when prop changes
  useEffect(() => {
    setLocalCompletedState(habit.completedToday);
  }, [habit.completedToday]);

  const toggleHabit = async () => {
    try {
      setIsToggling(true);
      // Immediately update local state for better UI feedback
      const newCompletedState = !localCompletedState;
      setLocalCompletedState(newCompletedState);
      
      console.log(`[HABIT TOGGLE] Toggling habit: ${habit.id}, current status: ${localCompletedState}, new status: ${newCompletedState}`);
      
      // Test Firebase connection first
      console.log('[HABIT TOGGLE] Testing Firebase connection...');
      const connectionTest = await testFirebaseConnection();
      if (!connectionTest) {
        console.error('[HABIT TOGGLE] Firebase connection test failed');
        throw new Error('Firebase connection test failed');
      }
      console.log('[HABIT TOGGLE] Firebase connection test passed');
      
      // Now try to log the habit
      console.log(`[HABIT TOGGLE] Calling logHabit for habit: ${habit.id}, completed: ${newCompletedState}`);
      const logId = await logHabit(habit.id, newCompletedState);
      console.log(`[HABIT TOGGLE] Toggle completed, log ID: ${logId}, calling onUpdate`);
      
      // Add a small delay to ensure the database has time to update
      setTimeout(() => {
        onUpdate();
        setIsToggling(false);
      }, 1000); // Increased delay to 1 second
    } catch (error) {
      console.error('[HABIT TOGGLE] Error toggling habit:', error);
      // Revert local state if there was an error
      setLocalCompletedState(habit.completedToday);
      setIsToggling(false);
      
      // Show error to user
      Alert.alert(
        'Error',
        'Failed to update habit status. Please check your internet connection and try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const navigateToDetail = () => {
    router.push({
      pathname: '/habit/[id]',
      params: { id: habit.id }
    });
  };

  return (
    <TouchableOpacity 
      style={styles.container} 
      onPress={navigateToDetail}
      activeOpacity={0.7}
      disabled={isToggling}
    >
      <TouchableOpacity 
        style={styles.checkbox} 
        onPress={(e) => {
          e.stopPropagation();
          if (!isToggling) {
            toggleHabit();
          }
        }}
        disabled={isToggling}
      >
        {isToggling ? (
          <ActivityIndicator size="small" color="#4CAF50" />
        ) : localCompletedState ? (
          <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
        ) : (
          <Ionicons name="ellipse-outline" size={24} color="#757575" />
        )}
      </TouchableOpacity>
      
      <View style={styles.content}>
        <Text style={styles.name}>{habit.name}</Text>
        {habit.description && (
          <Text style={styles.description}>{habit.description}</Text>
        )}
      </View>
      
      <View style={styles.streakContainer}>
        <Ionicons name="flame" size={16} color={habit.streak > 0 ? "#FF9800" : "#BDBDBD"} />
        <Text style={[
          styles.streak, 
          { color: habit.streak > 0 ? "#FF9800" : "#BDBDBD" }
        ]}>
          {habit.streak}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 8,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  checkbox: {
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '500',
    color: '#212121',
  },
  description: {
    fontSize: 14,
    color: '#757575',
    marginTop: 4,
  },
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  streak: {
    marginLeft: 4,
    fontSize: 14,
    fontWeight: '500',
  },
}); 