import { openDB } from 'idb';

const DB_NAME = 'attendance-db';
const STORE_NAME = 'sync-queue';

export const initDB = async () => {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
      }
    },
  });
};

export const saveAttendanceLocally = async (attendanceData) => {
  const db = await initDB();
  await db.add(STORE_NAME, {
    ...attendanceData,
    timestamp: new Date().getTime(),
  });
};

export const getPendingAttendance = async () => {
  const db = await initDB();
  return db.getAll(STORE_NAME);
};

export const removePendingAttendance = async (id) => {
  const db = await initDB();
  await db.delete(STORE_NAME, id);
};
