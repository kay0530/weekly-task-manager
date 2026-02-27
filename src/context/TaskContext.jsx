import { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { initAuth } from '../firebase/config';
import {
  subscribeToTasks,
  subscribeToSnapshots,
  addTaskToFirestore,
  updateTaskInFirestore,
  softDeleteTask,
  archiveTaskInFirestore,
  restoreTask,
  permanentlyDeleteTask,
  emptyTrashInFirestore,
  saveSnapshotToFirestore,
  batchUpdateTasks,
  batchWriteTasks,
} from '../firebase/taskService';
import { migrateFromLocalStorage } from '../firebase/migrationService';
import { generateId, getWeekKey } from '../data/initialData';

const TaskContext = createContext(null);

export function TaskProvider({ children }) {
  const [allTasks, setAllTasks] = useState([]);
  const [weekSnapshots, setWeekSnapshots] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  // Derived state
  const tasks = useMemo(() => allTasks.filter(t => t.status === 'active'), [allTasks]);
  const deletedTasks = useMemo(() => allTasks.filter(t => t.status === 'deleted'), [allTasks]);
  const archivedTasks = useMemo(() => allTasks.filter(t => t.status === 'archived'), [allTasks]);

  // Initialize Firebase auth, migrate localStorage data, and subscribe to Firestore
  useEffect(() => {
    let unsubTasks, unsubSnapshots;

    async function init() {
      await initAuth();
      await migrateFromLocalStorage();

      unsubTasks = subscribeToTasks((tasksFromFirestore) => {
        setAllTasks(tasksFromFirestore);
        setIsLoading(false);
      });

      unsubSnapshots = subscribeToSnapshots((snapshotsFromFirestore) => {
        setWeekSnapshots(snapshotsFromFirestore);
      });
    }

    init();
    return () => {
      unsubTasks?.();
      unsubSnapshots?.();
    };
  }, []);

  const addTask = useCallback(async (task) => {
    const now = new Date().toISOString();
    // Calculate displayOrder: max order in same member + 1
    const memberTasks = tasks.filter(t => t.memberId === task.memberId);
    const maxOrder = memberTasks.reduce((max, t) => Math.max(max, t.displayOrder || 0), 0);
    const newTask = {
      id: generateId(),
      ...task,
      progress: task.progress || 0,
      displayOrder: maxOrder + 1,
      weeklyHistory: {},
      status: 'active',
      createdAt: now,
      updatedAt: now,
    };
    await addTaskToFirestore(newTask);
    return newTask;
  }, [tasks]);

  const updateTask = useCallback(async (id, updates) => {
    await updateTaskInFirestore(id, updates);
  }, []);

  const deleteTask = useCallback(async (id) => {
    await softDeleteTask(id);
  }, []);

  const archiveTask = useCallback(async (id) => {
    await archiveTaskInFirestore(id);
  }, []);

  const restoreFromTrash = useCallback(async (id) => {
    await restoreTask(id);
  }, []);

  const restoreFromArchive = useCallback(async (id) => {
    await restoreTask(id);
  }, []);

  const permanentlyDelete = useCallback(async (id) => {
    await permanentlyDeleteTask(id);
  }, []);

  const emptyTrash = useCallback(async () => {
    const ids = deletedTasks.map(t => t.id);
    await emptyTrashInFirestore(ids);
  }, [deletedTasks]);

  const saveWeeklySnapshot = useCallback(async (weekKey) => {
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
    await saveSnapshotToFirestore(key, snapshot);

    // Also save to each task's weeklyHistory
    const updates = tasks.map(t => ({
      id: t.id,
      data: { weeklyHistory: { ...t.weeklyHistory, [key]: { progress: t.progress } } },
    }));
    if (updates.length > 0) await batchUpdateTasks(updates);
  }, [tasks]);

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

  const reorderTasks = useCallback(async (orderedTaskIds) => {
    const updates = orderedTaskIds.map((id, index) => ({
      id,
      data: { displayOrder: index + 1 },
    }));
    await batchUpdateTasks(updates);
  }, []);

  const getTasksByMember = useCallback((memberId) => {
    const memberTasks = tasks.filter(t => t.memberId === memberId);
    return memberTasks.sort((a, b) => {
      const orderA = a.displayOrder ?? new Date(a.createdAt).getTime();
      const orderB = b.displayOrder ?? new Date(b.createdAt).getTime();
      return orderA - orderB;
    });
  }, [tasks]);

  const getTasksByCategory = useCallback((categoryId) => {
    return tasks.filter(t => t.category === categoryId);
  }, [tasks]);

  const importData = useCallback(async (data) => {
    const now = new Date().toISOString();
    const allImportTasks = [];

    if (data.tasks) {
      allImportTasks.push(...data.tasks.map(t => ({
        ...t,
        status: 'active',
        updatedAt: t.updatedAt || now,
        createdAt: t.createdAt || now,
      })));
    }
    if (data.deletedTasks) {
      allImportTasks.push(...data.deletedTasks.map(t => ({
        ...t,
        status: 'deleted',
        deletedAt: t.deletedAt || now,
        updatedAt: t.updatedAt || now,
        createdAt: t.createdAt || now,
      })));
    }
    if (data.archivedTasks) {
      allImportTasks.push(...data.archivedTasks.map(t => ({
        ...t,
        status: 'archived',
        archivedAt: t.archivedAt || now,
        updatedAt: t.updatedAt || now,
        createdAt: t.createdAt || now,
      })));
    }

    if (allImportTasks.length > 0) {
      const BATCH_LIMIT = 500;
      for (let i = 0; i < allImportTasks.length; i += BATCH_LIMIT) {
        await batchWriteTasks(allImportTasks.slice(i, i + BATCH_LIMIT));
      }
    }
    // Import snapshots
    if (data.weekSnapshots) {
      for (const [weekKey, snapData] of Object.entries(data.weekSnapshots)) {
        await saveSnapshotToFirestore(weekKey, snapData, 'import');
      }
    }
  }, []);

  const exportData = useCallback(() => {
    return {
      tasks,
      weekSnapshots,
      deletedTasks,
      archivedTasks,
      exportedAt: new Date().toISOString(),
    };
  }, [tasks, weekSnapshots, deletedTasks, archivedTasks]);

  return (
    <TaskContext.Provider value={{
      tasks,
      weekSnapshots,
      deletedTasks,
      archivedTasks,
      addTask,
      updateTask,
      deleteTask,
      archiveTask,
      restoreFromTrash,
      restoreFromArchive,
      permanentlyDelete,
      emptyTrash,
      saveWeeklySnapshot,
      getProgressDelta,
      reorderTasks,
      getTasksByMember,
      getTasksByCategory,
      importData,
      exportData,
      isLoading,
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
