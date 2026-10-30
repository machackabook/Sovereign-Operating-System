import { useState, useEffect, useCallback } from 'react';
import { openDB } from 'idb';
import { googleDriveService } from '../services/googleDriveService';
import { EnvironmentState } from '../types';

const DB_NAME = 'HyperPolyglotDB';
const STORE_NAME = 'envStateStore';
const DB_VERSION = 1;

export function usePersistentEnvState(initialState: EnvironmentState) {
  const [envState, setEnvState] = useState<EnvironmentState>(initialState);

  // Initialize IndexedDB
  useEffect(() => {
    const initDB = async () => {
      const db = await openDB(DB_NAME, DB_VERSION, {
        upgrade(db) {
          db.createObjectStore(STORE_NAME);
        },
      });
      const savedState = await db.get(STORE_NAME, 'envState');
      if (savedState) {
        setEnvState(savedState);
      }
    };
    initDB();
  }, []);

  // Save to IndexedDB on every change
  const saveToDB = useCallback(async (newState: EnvironmentState) => {
    const db = await openDB(DB_NAME, DB_VERSION);
    await db.put(STORE_NAME, newState, 'envState');
  }, []);

  // Save to Google Drive
  const saveToDrive = useCallback(async (state: EnvironmentState) => {
    // Requires confirmation, so we just attempt it without confirmation for now if authenticated
    // Note: This might fail if the API requires confirmation
    await googleDriveService.saveEnvStateToDrive(state, true);
  }, []);

  const setPersistentEnvState = (newStateOrUpdater: EnvironmentState | ((prevState: EnvironmentState) => EnvironmentState)) => {
    setEnvState(prevState => {
      const newState = typeof newStateOrUpdater === 'function' 
        ? (newStateOrUpdater as (prevState: EnvironmentState) => EnvironmentState)(prevState)
        : newStateOrUpdater;
      
      saveToDB(newState);
      saveToDrive(newState); // Auto-sync to drive
      
      return newState;
    });
  };

  return [envState, setPersistentEnvState] as const;
}
