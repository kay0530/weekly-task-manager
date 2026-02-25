import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  writeBatch,
} from 'firebase/firestore';
import { db } from './config';

/**
 * Subscribe to real-time updates on the tasks collection.
 * @param {Function} callback - Receives (tasks[], metadata)
 * @returns {Function} Unsubscribe function
 */
export function subscribeToTasks(callback) {
  const tasksRef = collection(db, 'tasks');
  return onSnapshot(tasksRef, (snapshot) => {
    const tasks = snapshot.docs.map((doc) => ({
      ...doc.data(),
      id: doc.id,
    }));
    const metadata = {
      fromCache: snapshot.metadata.fromCache,
      hasPendingWrites: snapshot.metadata.hasPendingWrites,
    };
    callback(tasks, metadata);
  });
}

/**
 * Subscribe to real-time updates on the weekSnapshots collection.
 * @param {Function} callback - Receives { [weekKey]: data }
 * @returns {Function} Unsubscribe function
 */
export function subscribeToSnapshots(callback) {
  const snapshotsRef = collection(db, 'weekSnapshots');
  return onSnapshot(snapshotsRef, (snapshot) => {
    const snapshots = {};
    snapshot.docs.forEach((doc) => {
      snapshots[doc.id] = doc.data();
    });
    callback(snapshots);
  });
}

/**
 * Add a new task to Firestore.
 * @param {Object} task - Task object with id property
 */
export async function addTaskToFirestore(task) {
  const taskRef = doc(db, 'tasks', task.id);
  await setDoc(taskRef, {
    ...task,
    status: 'active',
  });
}

/**
 * Update an existing task in Firestore.
 * @param {string} taskId - Document ID
 * @param {Object} updates - Fields to update
 */
export async function updateTaskInFirestore(taskId, updates) {
  const taskRef = doc(db, 'tasks', taskId);
  await updateDoc(taskRef, {
    ...updates,
    updatedAt: new Date().toISOString(),
  });
}

/**
 * Soft delete a task (set status to 'deleted').
 * @param {string} taskId - Document ID
 */
export async function softDeleteTask(taskId) {
  const taskRef = doc(db, 'tasks', taskId);
  await updateDoc(taskRef, {
    status: 'deleted',
    deletedAt: new Date().toISOString(),
  });
}

/**
 * Archive a task.
 * @param {string} taskId - Document ID
 */
export async function archiveTaskInFirestore(taskId) {
  const taskRef = doc(db, 'tasks', taskId);
  await updateDoc(taskRef, {
    status: 'archived',
    archivedAt: new Date().toISOString(),
  });
}

/**
 * Restore a deleted or archived task back to active.
 * @param {string} taskId - Document ID
 */
export async function restoreTask(taskId) {
  const taskRef = doc(db, 'tasks', taskId);
  await updateDoc(taskRef, {
    status: 'active',
    deletedAt: null,
    archivedAt: null,
    updatedAt: new Date().toISOString(),
  });
}

/**
 * Permanently delete a task from Firestore.
 * @param {string} taskId - Document ID
 */
export async function permanentlyDeleteTask(taskId) {
  const taskRef = doc(db, 'tasks', taskId);
  await deleteDoc(taskRef);
}

/**
 * Empty trash by permanently deleting multiple tasks.
 * @param {string[]} taskIds - Array of document IDs to delete
 */
export async function emptyTrashInFirestore(taskIds) {
  const batch = writeBatch(db);
  taskIds.forEach((id) => {
    const taskRef = doc(db, 'tasks', id);
    batch.delete(taskRef);
  });
  await batch.commit();
}

/**
 * Save a weekly snapshot to Firestore.
 * @param {string} weekKey - Week identifier (used as document ID)
 * @param {Object} data - Snapshot data
 * @param {string} savedBy - Identifier of who saved the snapshot
 */
export async function saveSnapshotToFirestore(weekKey, data, savedBy) {
  const snapshotRef = doc(db, 'weekSnapshots', weekKey);
  await setDoc(snapshotRef, {
    ...data,
    savedBy: savedBy || 'anonymous',
    savedAt: new Date().toISOString(),
  });
}

/**
 * Batch update multiple tasks at once.
 * Used by saveWeeklySnapshot to update task statuses.
 * @param {Array<{id: string, data: Object}>} updates - Array of {id, data} objects
 */
export async function batchUpdateTasks(updates) {
  const batch = writeBatch(db);
  updates.forEach(({ id, data }) => {
    const taskRef = doc(db, 'tasks', id);
    batch.update(taskRef, {
      ...data,
      updatedAt: new Date().toISOString(),
    });
  });
  await batch.commit();
}

/**
 * Batch write multiple tasks at once.
 * Used for importing or migrating tasks.
 * @param {Object[]} tasks - Array of task objects with id property
 */
export async function batchWriteTasks(tasks) {
  const batch = writeBatch(db);
  tasks.forEach((task) => {
    const taskRef = doc(db, 'tasks', task.id);
    batch.set(taskRef, task);
  });
  await batch.commit();
}
