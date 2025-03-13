export interface Habit {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface HabitLog {
  id: string;
  habitId: string;
  date: Date;
  completed: boolean;
  notes?: string;
}

export interface HabitWithStats extends Habit {
  streak: number;
  completedToday: boolean;
} 