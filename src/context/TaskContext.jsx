import { createContext, useContext, useCallback } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { generateId, getWeekKey } from '../data/initialData';

const TaskContext = createContext(null);

export function TaskProvider({ children }) {
  const [tasks, setTasks] = useLocalStorage('wtm-tasks', []);
  const [weekSnapshots, setWeekSnapshots] = useLocalStorage('wtm-snapshots', {});

  const addTask = useCallback((task) => {
    const now = new Date().toISOString();
    const newTask = {
      id: generateId(),
      ...task,
      progress: task.progress || 0,
      weeklyHistory: {},
      createdAt: now,
      updatedAt: now,
    };
    setTasks(prev => [...prev, newTask]);
    return newTask;
  }, [setTasks]);

  const updateTask = useCallback((id, updates) => {
    setTasks(prev => prev.map(t => {
      if (t.id !== id) return t;
      const updated = { ...t, ...updates, updatedAt: new Date().toISOString() };
      return updated;
    }));
  }, [setTasks]);

  const deleteTask = useCallback((id) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  }, [setTasks]);

  const saveWeeklySnapshot = useCallback((weekKey) => {
    const key = weekKey || getWeekKey();
    const snapshot = {};
    tasks.forEach(t => {
      snapshot[t.id] = {
        progress: t.progress,
        done: t.done,
        notDone: t.notDone,
        notDoneReason: t.notDoneReason,
        issues: t.issues,
        consultation: t.consultation,
      };
    });
    setWeekSnapshots(prev => ({ ...prev, [key]: snapshot }));
    // Also save to each task's history
    setTasks(prev => prev.map(t => ({
      ...t,
      weeklyHistory: { ...t.weeklyHistory, [key]: { progress: t.progress } },
    })));
  }, [tasks, setTasks, setWeekSnapshots]);

  const getProgressDelta = useCallback((task) => {
    const currentWeek = getWeekKey();
    const history = task.weeklyHistory || {};
    const weeks = Object.keys(history).sort();
    const currentIdx = weeks.indexOf(currentWeek);
    if (currentIdx <= 0) {
      // No previous week data; check snapshot
      const prevWeeks = weeks.filter(w => w < currentWeek);
      if (prevWeeks.length === 0) return null;
      const lastWeek = prevWeeks[prevWeeks.length - 1];
      return task.progress - (history[lastWeek]?.progress || 0);
    }
    const prevWeek = weeks[currentIdx - 1];
    return task.progress - (history[prevWeek]?.progress || 0);
  }, []);

  const getTasksByMember = useCallback((memberId) => {
    return tasks.filter(t => t.memberId === memberId);
  }, [tasks]);

  const getTasksByCategory = useCallback((categoryId) => {
    return tasks.filter(t => t.category === categoryId);
  }, [tasks]);

  const importData = useCallback((data) => {
    if (data.tasks) setTasks(data.tasks);
    if (data.weekSnapshots) setWeekSnapshots(data.weekSnapshots);
  }, [setTasks, setWeekSnapshots]);

  const exportData = useCallback(() => {
    return { tasks, weekSnapshots, exportedAt: new Date().toISOString() };
  }, [tasks, weekSnapshots]);

  return (
    <TaskContext.Provider value={{
      tasks,
      weekSnapshots,
      addTask,
      updateTask,
      deleteTask,
      saveWeeklySnapshot,
      getProgressDelta,
      getTasksByMember,
      getTasksByCategory,
      importData,
      exportData,
    }}>
      {children}
    </TaskContext.Provider>
  );
}

export function useTaskContext() {
  const ctx = useContext(TaskContext);
  if (!ctx) throw new Error('useTaskContext must be used within TaskProvider');
  return ctx;
}
