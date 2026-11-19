import { STORAGE_KEYS } from '../constants/storageKeys';
import { storageClient } from './api';
import { INITIAL_USERS } from '../data/initialData';

export const authService = {
  getCurrentUser: () => {
    return storageClient.get(STORAGE_KEYS.AUTH_USER, null);
  },

  login: (user, remember = true) => {
    if (remember) {
      storageClient.set(STORAGE_KEYS.AUTH_USER, user);
    }
    return user;
  },

  logout: () => {
    storageClient.remove(STORAGE_KEYS.AUTH_USER);
  },

  getUsers: () => {
    const raw = storageClient.get(STORAGE_KEYS.USERS, null);
    if (!raw) {
      storageClient.set(STORAGE_KEYS.USERS, INITIAL_USERS);
      return INITIAL_USERS;
    }
    return raw;
  },

  saveUser: (userData) => {
    try {
      const users = authService.getUsers();
      const cleanId = userData.id || `USR-${String(Date.now()).slice(-4)}`;
      const initials = (userData.name || 'User')
        .split(' ')
        .map(part => part[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

      const userObj = {
        ...userData,
        id: cleanId,
        avatar: userData.avatar || initials,
        createdDate: userData.createdDate || new Date().toISOString().slice(0, 10),
        status: userData.status || 'Active'
      };

      const existingIndex = users.findIndex(u => u.id === cleanId || (userData.empId && u.empId === userData.empId));
      let updated;
      if (existingIndex >= 0) {
        updated = [...users];
        updated[existingIndex] = { ...updated[existingIndex], ...userObj };
      } else {
        updated = [userObj, ...users];
      }
      storageClient.set(STORAGE_KEYS.USERS, updated);
      return updated;
    } catch (e) {
      console.error('Error saving user', e);
      return [];
    }
  },

  deleteUser: (userId) => {
    try {
      const users = authService.getUsers();
      const updated = users.filter(u => u.id !== userId);
      storageClient.set(STORAGE_KEYS.USERS, updated);
      return updated;
    } catch (e) {
      console.error('Error deleting user', e);
      return [];
    }
  }
};

export const {
  getCurrentUser,
  login,
  logout,
  getUsers,
  saveUser,
  deleteUser
} = authService;
