import { MMKV } from "react-native-mmkv";

export const storage = new MMKV({
  id: "rideshare-storage",
  encryptionKey: "hunter2", // In prod, use a secure key or none if not sensitive
});

/**
 * Generic storage wrapper for MMKV
 */
export const clientStorage = {
  setItem: (key: string, value: any) => {
    storage.set(key, JSON.stringify(value));
  },
  getItem: <T>(key: string): T | null => {
    const value = storage.getString(key);
    return value ? JSON.parse(value) : null;
  },
  removeItem: (key: string) => {
    storage.delete(key);
  },
  clearAll: () => {
    storage.clearAll();
  },
};
