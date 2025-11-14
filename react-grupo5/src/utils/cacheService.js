import AsyncStorage from "@react-native-async-storage/async-storage";

const CACHE_PREFIX = "@cache_";

export const setCache = async (key, data) => {
  try {
    const cacheData = {
      data,
      timestamp: Date.now(),
    };
    await AsyncStorage.setItem(`${CACHE_PREFIX}${key}`, JSON.stringify(cacheData));
  } catch (error) {
    console.error("Error saving cache:", error);
  }
};

export const getCache = async (key, maxAge = 60 * 1000) => {
  try {
    const cached = await AsyncStorage.getItem(`${CACHE_PREFIX}${key}`);
    if (!cached) return null;

    const { data, timestamp } = JSON.parse(cached);
    const age = Date.now() - timestamp;

    if (age > maxAge) {
      await removeCache(key);
      return null;
    }

    return data;
  } catch (error) {
    console.error("Error reading cache:", error);
    return null;
  }
};

export const removeCache = async (key) => {
  try {
    await AsyncStorage.removeItem(`${CACHE_PREFIX}${key}`);
  } catch (error) {
    console.error("Error removing cache:", error);
  }
};

export const clearAllCache = async () => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const cacheKeys = keys.filter((key) => key.startsWith(CACHE_PREFIX));
    await AsyncStorage.multiRemove(cacheKeys);
  } catch (error) {
    console.error("Error clearing cache:", error);
  }
};

export const getCacheTimestamp = async (key) => {
  try {
    const cached = await AsyncStorage.getItem(`${CACHE_PREFIX}${key}`);
    if (!cached) return null;
    const { timestamp } = JSON.parse(cached);
    return timestamp;
  } catch (error) {
    return null;
  }
};

