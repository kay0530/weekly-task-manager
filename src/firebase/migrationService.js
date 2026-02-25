import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './config';
import { batchWriteTasks, saveSnapshotToFirestore } from './taskService';

/**
 * One-time migration from localStorage to Firestore.
 * Checks if migration has already been completed before proceeding.
 * @returns {Promise<boolean>} true if migration was performed, false if skipped
 */
export async function migrateFromLocalStorage() {
  try {
    // 1. Check if migration has already been done
    const migrationRef = doc(db, 'metadata', 'migration');
    const migrationDoc = await getDoc(migrationRef);

    if (migrationDoc.exists()) {
      console.log('Migration already completed:', migrationDoc.data());
      return false;
    }

    // 2. Read localStorage data
    const rawTasks = localStorage.getItem('wtm-tasks');
    const rawDeleted = localStorage.getItem('wtm-deleted');
    const rawArchived = localStorage.getItem('wtm-archived');
    const rawSnapshots = localStorage.getItem('wtm-snapshots');

    // If no localStorage data exists, skip migration
    if (!rawTasks && !rawDeleted && !rawArchived && !rawSnapshots) {
      console.log('No localStorage data found, skipping migration');
      return false;
    }

    const activeTasks = rawTasks ? JSON.parse(rawTasks) : [];
    const deletedTasks = rawDeleted ? JSON.parse(rawDeleted) : [];
    const archivedTasks = rawArchived ? JSON.parse(rawArchived) : [];
    const snapshots = rawSnapshots ? JSON.parse(rawSnapshots) : {};

    // 3. Add status field to each task category
    const tasksWithStatus = [
      ...activeTasks.map((task) => ({ ...task, status: 'active' })),
      ...deletedTasks.map((task) => ({ ...task, status: 'deleted' })),
      ...archivedTasks.map((task) => ({ ...task, status: 'archived' })),
    ];

    // 4. Batch write all tasks to Firestore
    if (tasksWithStatus.length > 0) {
      // Firestore batch limit is 500, split if needed
      const BATCH_LIMIT = 500;
      for (let i = 0; i < tasksWithStatus.length; i += BATCH_LIMIT) {
        const chunk = tasksWithStatus.slice(i, i + BATCH_LIMIT);
        await batchWriteTasks(chunk);
      }
    }

    // 5. Migrate snapshots
    const snapshotKeys = Object.keys(snapshots);
    for (const weekKey of snapshotKeys) {
      await saveSnapshotToFirestore(weekKey, snapshots[weekKey], 'migration');
    }

    // 6. Write migration metadata
    await setDoc(migrationRef, {
      migratedAt: new Date().toISOString(),
      taskCount: tasksWithStatus.length,
      snapshotCount: snapshotKeys.length,
      activeTasks: activeTasks.length,
      deletedTasks: deletedTasks.length,
      archivedTasks: archivedTasks.length,
    });

    console.log(
      `Migration complete: ${tasksWithStatus.length} tasks, ${snapshotKeys.length} snapshots`
    );
    return true;
  } catch (error) {
    // If Firestore write fails, don't clear localStorage
    console.error('Migration failed:', error);
    throw error;
  }
}
