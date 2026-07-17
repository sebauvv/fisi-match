// Mock expo-constants
jest.mock('expo-constants', () => ({
  __esModule: true,
  default: {
    expoConfig: {
      extra: {},
    },
    manifest: {},
    statusBarHeight: 0,
  },
}));

// Mock expo-font
jest.mock('expo-font', () => ({
  __esModule: true,
  default: {
    loadAsync: jest.fn(),
    isLoaded: jest.fn().mockReturnValue(true),
  },
  loadAsync: jest.fn(),
  isLoaded: jest.fn().mockReturnValue(true),
}));

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => {
  const store: Record<string, string> = {};
  return {
    __esModule: true,
    default: {
      getItem: jest.fn(async (key: string) => store[key] ?? null),
      setItem: jest.fn(async (key: string, value: string) => {
        store[key] = value;
      }),
      removeItem: jest.fn(async (key: string) => {
        delete store[key];
      }),
      multiGet: jest.fn(async (keys: string[]) =>
        keys.map((k: string) => [k, store[k] ?? null]),
      ),
      multiSet: jest.fn(async (entries: [string, string][]) => {
        for (const [k, v] of entries) store[k] = v;
      }),
      multiRemove: jest.fn(async (keys: string[]) => {
        for (const k of keys) delete store[k];
      }),
      clear: jest.fn(async () => {
        Object.keys(store).forEach((k) => delete store[k]);
      }),
    },
    // Export named as CommonJS for jest-expo compatibility
    getItem: jest.fn(async (key: string) => store[key] ?? null),
    setItem: jest.fn(async (key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn(async (key: string) => {
      delete store[key];
    }),
    multiGet: jest.fn(async (keys: string[]) =>
      keys.map((k: string) => [k, store[k] ?? null]),
    ),
    multiSet: jest.fn(async (entries: [string, string][]) => {
      for (const [k, v] of entries) store[k] = v;
    }),
    multiRemove: jest.fn(async (keys: string[]) => {
      for (const k of keys) delete store[k];
    }),
    clear: jest.fn(async () => {
      Object.keys(store).forEach((k) => delete store[k]);
    }),
  };
});

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;
