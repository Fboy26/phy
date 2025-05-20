import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useCallback,
} from 'react';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import axios, { AxiosError } from 'axios';

type User = {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
  token?: string; // Optional: For token-based auth
};

interface ApiErrorResponse {
  error?: string;
}

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<boolean>;
  updateUserProfile: (firstName: string, lastName: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  signIn: async () => {},
  signUp: async () => {},
  signOut: async () => false,
  updateUserProfile: async () => {},
});

const API_BASE_URL = 'http://localhost:8080/api/auth';

// ------------------------
// Utility Functions
// ------------------------

const saveUserToStorage = async (user: User) => {
  const userJson = JSON.stringify(user);
  if (Platform.OS === 'web') {
    await AsyncStorage.setItem('user', userJson);
  } else {
    await SecureStore.setItemAsync('user', userJson);
  }
};

const loadUserFromStorage = async (): Promise<User | null> => {
  try {
    const userJson =
      Platform.OS === 'web'
        ? await AsyncStorage.getItem('user')
        : await SecureStore.getItemAsync('user');

    if (userJson) return JSON.parse(userJson);
  } catch (error) {
    console.error('Error loading user from storage:', error);
  }
  return null;
};

const clearUserStorage = async () => {
  if (Platform.OS !== 'web') {
    await SecureStore.deleteItemAsync('user');
  }
  await AsyncStorage.removeItem('user');
};

// ------------------------
// AuthProvider Component
// ------------------------

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeUser = async () => {
      setIsLoading(true);
      const storedUser = await loadUserFromStorage();
      if (storedUser) {
        setUser(storedUser);
        axios.defaults.headers.common['Authorization'] = `Bearer ${storedUser.token}`;
      }
      setIsLoading(false);
    };

    initializeUser();
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const response = await axios.post(`${API_BASE_URL}/signin`, { email, password });
      const userData: User = response.data;

      setUser(userData);
      await saveUserToStorage(userData);
      axios.defaults.headers.common['Authorization'] = `Bearer ${userData.token}`;
    } catch (error) {
      const err = error as AxiosError<ApiErrorResponse>;
      console.error('SignIn Error:', err.response?.data || err.message);
      throw new Error(err.response?.data?.error || 'Sign in failed');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const response = await axios.post(`${API_BASE_URL}/signup`, { email, password });
      const userData: User = response.data;

      setUser(userData);
      await saveUserToStorage(userData);
      axios.defaults.headers.common['Authorization'] = `Bearer ${userData.token}`;
    } catch (error) {
      const err = error as AxiosError<ApiErrorResponse>;
      console.error('SignUp Error:', err.response?.data || err.message);
      throw new Error(err.response?.data?.error || 'Sign up failed');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signOut = useCallback(async (): Promise<boolean> => {
    try {
      setIsLoading(true);
      await clearUserStorage();
      setUser(null);
      delete axios.defaults.headers.common['Authorization'];
      return true;
    } catch (error) {
      console.error('SignOut Error:', error);
      setUser(null);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateUserProfile = useCallback(async (firstName: string, lastName: string) => {
    if (!user) throw new Error('User not logged in');
    try {
      const updatedUser = { ...user, firstName, lastName };
      setUser(updatedUser);
      await saveUserToStorage(updatedUser);
    } catch (error) {
      console.error('Update Profile Error:', error);
      throw new Error('Failed to update profile');
    }
  }, [user]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        signIn,
        signUp,
        signOut,
        updateUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
