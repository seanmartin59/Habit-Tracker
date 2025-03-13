import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { HabitLog } from '../models/Habit';
import { getHabitLogs } from '../services/habitService';

interface HabitHistoryProps {
  habitId: string;
  refreshTrigger?: number;
}

export default function HabitHistory({ habitId, refreshTrigger = 0 }: HabitHistoryProps) {
  const [logs, setLogs] = useState<HabitLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadLogs();
  }, [habitId, refreshTrigger]);

  const loadLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log(`Loading logs for habit: ${habitId}`);
      const habitLogs = await getHabitLogs(habitId);
      console.log(`Found ${habitLogs.length} logs for habit: ${habitId}`);
      setLogs(habitLogs);
    } catch (err) {
      console.error('Error loading habit logs:', err);
      setError('Failed to load habit history');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadLogs();
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (logs.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyText}>No history yet</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>History</Text>
      <FlatList
        data={logs}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.logItem}>
            <View style={styles.dateContainer}>
              <Text style={styles.date}>{formatDate(item.date)}</Text>
            </View>
            <View style={styles.statusContainer}>
              {item.completed ? (
                <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
              ) : (
                <Ionicons name="close-circle" size={20} color="#F44336" />
              )}
              <Text style={[
                styles.status,
                { color: item.completed ? '#4CAF50' : '#F44336' }
              ]}>
                {item.completed ? 'Completed' : 'Missed'}
              </Text>
            </View>
            {item.notes && (
              <Text style={styles.notes}>{item.notes}</Text>
            )}
          </View>
        )}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    color: '#212121',
  },
  logItem: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  dateContainer: {
    marginBottom: 8,
  },
  date: {
    fontSize: 16,
    fontWeight: '500',
    color: '#212121',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  status: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
  },
  notes: {
    fontSize: 14,
    color: '#757575',
    fontStyle: 'italic',
  },
  errorText: {
    color: '#F44336',
    fontSize: 16,
  },
  emptyText: {
    color: '#757575',
    fontSize: 16,
  },
}); 