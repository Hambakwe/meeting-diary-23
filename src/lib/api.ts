import type { User, Person, Hotel, Meeting } from './types';

// API Configuration
const API_BASE_URL = '/api';

// =====================================================
// PHOTO UPLOAD API
// =====================================================
export const photoApi = {
  /**
   * Upload a photo file and return the server path
   */
  upload: async (file: File, personId?: string): Promise<string> => {
    // In dev mode, we can't upload to PHP, so we'll use a data URL fallback
    if (isDevMode()) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
      });
    }

    const formData = new FormData();
    formData.append('photo', file);
    if (personId) {
      formData.append('personId', personId);
    }

    const response = await fetch(`${API_BASE_URL}/upload-photo.php`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Upload failed' }));
      throw new Error(error.message || 'Failed to upload photo');
    }

    const result = await response.json();
    return result.photo;
  },
};

// Detect if we're in dev mode (no PHP available)
const isDevMode = (): boolean => {
  try {
    if (typeof window === 'undefined') return false; // SSR - assume production
    const hostname = window.location?.hostname || '';
    // Only dev mode for specific development domains
    return hostname === 'localhost' ||
           hostname === '127.0.0.1' ||
           hostname.includes('same-app.com') ||
           hostname.includes('same.new');
  } catch {
    return false; // If anything fails, assume production
  }
};

// Development mode sample data (empty - no dummy data)
const devPersons: Person[] = [];
const devHotels: Hotel[] = [];
const devMeetings: Meeting[] = [];

// Generic fetch wrapper for API calls
async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  // Add cache-busting query parameter to bypass server cache
  const cacheBuster = `_t=${Date.now()}`;
  const separator = endpoint.includes('?') ? '&' : '?';
  const url = `${API_BASE_URL}${endpoint}${separator}${cacheBuster}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `HTTP error! status: ${response.status}`;
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.message || errorMessage;
      } catch {
        // Response wasn't JSON
        console.error('API Error Response:', errorText);
      }
      throw new Error(errorMessage);
    }

    const text = await response.text();
    if (!text) {
      return [] as unknown as T; // Return empty array for empty responses
    }

    try {
      return JSON.parse(text);
    } catch {
      console.error('Failed to parse API response:', text);
      throw new Error('Invalid API response');
    }
  } catch (error) {
    // If in dev mode and API fails, return empty data
    if (isDevMode()) {
      console.warn('API not available in dev mode, returning empty data');
      return [] as unknown as T;
    }
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Network error - could not connect to API');
  }
}

// =====================================================
// PERSONS API
// =====================================================
export const personsApi = {
  getAll: async (): Promise<Person[]> => {
    try {
      if (isDevMode()) {
        return devPersons;
      }
      return await apiFetch<Person[]>('/persons.php');
    } catch (err) {
      console.error('Error in personsApi.getAll:', err);
      return [];
    }
  },

  getById: async (id: string): Promise<Person | undefined> => {
    try {
      if (isDevMode()) {
        return devPersons.find(p => p.id === id);
      }
      return await apiFetch<Person>(`/persons.php?id=${id}`);
    } catch (err) {
      console.error('Error in personsApi.getById:', err);
      return undefined;
    }
  },

  create: async (person: Omit<Person, 'id' | 'createdAt'>): Promise<Person> => {
    try {
      if (isDevMode()) {
        const newPerson: Person = {
          ...person,
          id: `dev-${Date.now()}`,
          createdAt: new Date().toISOString(),
        };
        devPersons.push(newPerson);
        return newPerson;
      }
      return await apiFetch<Person>('/persons.php', {
        method: 'POST',
        body: JSON.stringify(person),
      });
    } catch (err) {
      console.error('Error in personsApi.create:', err);
      throw err;
    }
  },

  update: async (id: string, updates: Partial<Omit<Person, 'id' | 'createdAt'>>): Promise<Person | undefined> => {
    try {
      if (isDevMode()) {
        const index = devPersons.findIndex(p => p.id === id);
        if (index >= 0) {
          devPersons[index] = { ...devPersons[index], ...updates };
          return devPersons[index];
        }
        return undefined;
      }
      return await apiFetch<Person>(`/persons.php?id=${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
    } catch (err) {
      console.error('Error in personsApi.update:', err);
      return undefined;
    }
  },

  delete: async (id: string): Promise<boolean> => {
    try {
      if (isDevMode()) {
        const index = devPersons.findIndex(p => p.id === id);
        if (index >= 0) {
          devPersons.splice(index, 1);
          return true;
        }
        return false;
      }
      await apiFetch(`/persons.php?id=${id}`, { method: 'DELETE' });
      return true;
    } catch (err) {
      console.error('Error in personsApi.delete:', err);
      return false;
    }
  },
};

// =====================================================
// HOTELS API
// =====================================================
export const hotelsApi = {
  getAll: async (): Promise<Hotel[]> => {
    try {
      if (isDevMode()) {
        return devHotels;
      }
      return await apiFetch<Hotel[]>('/hotels.php');
    } catch (err) {
      console.error('Error in hotelsApi.getAll:', err);
      return [];
    }
  },

  getById: async (id: string): Promise<Hotel | undefined> => {
    try {
      if (isDevMode()) {
        return devHotels.find(h => h.id === id);
      }
      return await apiFetch<Hotel>(`/hotels.php?id=${id}`);
    } catch (err) {
      console.error('Error in hotelsApi.getById:', err);
      return undefined;
    }
  },

  getByCountry: async (country: string): Promise<Hotel[]> => {
    try {
      if (isDevMode()) {
        return devHotels.filter(h => h.country === country);
      }
      return await apiFetch<Hotel[]>(`/hotels.php?country=${encodeURIComponent(country)}`);
    } catch (err) {
      console.error('Error in hotelsApi.getByCountry:', err);
      return [];
    }
  },

  create: async (hotel: Omit<Hotel, 'id' | 'createdAt'>): Promise<Hotel> => {
    try {
      if (isDevMode()) {
        const newHotel: Hotel = {
          ...hotel,
          id: `dev-${Date.now()}`,
          createdAt: new Date().toISOString(),
        };
        devHotels.push(newHotel);
        return newHotel;
      }
      return await apiFetch<Hotel>('/hotels.php', {
        method: 'POST',
        body: JSON.stringify(hotel),
      });
    } catch (err) {
      console.error('Error in hotelsApi.create:', err);
      throw err;
    }
  },

  update: async (id: string, updates: Partial<Omit<Hotel, 'id' | 'createdAt'>>): Promise<Hotel | undefined> => {
    try {
      if (isDevMode()) {
        const index = devHotels.findIndex(h => h.id === id);
        if (index >= 0) {
          devHotels[index] = { ...devHotels[index], ...updates };
          return devHotels[index];
        }
        return undefined;
      }
      return await apiFetch<Hotel>(`/hotels.php?id=${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
    } catch (err) {
      console.error('Error in hotelsApi.update:', err);
      return undefined;
    }
  },

  delete: async (id: string): Promise<boolean> => {
    try {
      if (isDevMode()) {
        const index = devHotels.findIndex(h => h.id === id);
        if (index >= 0) {
          devHotels.splice(index, 1);
          return true;
        }
        return false;
      }
      await apiFetch(`/hotels.php?id=${id}`, { method: 'DELETE' });
      return true;
    } catch (err) {
      console.error('Error in hotelsApi.delete:', err);
      return false;
    }
  },
};

// =====================================================
// MEETINGS API
// =====================================================
export const meetingsApi = {
  getAll: async (): Promise<Meeting[]> => {
    try {
      if (isDevMode()) {
        return devMeetings;
      }
      return await apiFetch<Meeting[]>('/meetings.php');
    } catch (err) {
      console.error('Error in meetingsApi.getAll:', err);
      return [];
    }
  },

  getById: async (id: string): Promise<Meeting | undefined> => {
    try {
      if (isDevMode()) {
        return devMeetings.find(m => m.id === id);
      }
      return await apiFetch<Meeting>(`/meetings.php?id=${id}`);
    } catch (err) {
      console.error('Error in meetingsApi.getById:', err);
      return undefined;
    }
  },

  getByStatus: async (status: Meeting['status']): Promise<Meeting[]> => {
    try {
      if (isDevMode()) {
        return devMeetings.filter(m => m.status === status);
      }
      return await apiFetch<Meeting[]>(`/meetings.php?status=${status}`);
    } catch (err) {
      console.error('Error in meetingsApi.getByStatus:', err);
      return [];
    }
  },

  create: async (meeting: Omit<Meeting, 'id' | 'createdAt'>): Promise<Meeting> => {
    try {
      if (isDevMode()) {
        const newMeeting: Meeting = {
          ...meeting,
          id: `dev-${Date.now()}`,
          createdAt: new Date().toISOString(),
        };
        devMeetings.push(newMeeting);
        return newMeeting;
      }
      return await apiFetch<Meeting>('/meetings.php', {
        method: 'POST',
        body: JSON.stringify(meeting),
      });
    } catch (err) {
      console.error('Error in meetingsApi.create:', err);
      throw err;
    }
  },

  update: async (id: string, updates: Partial<Omit<Meeting, 'id' | 'createdAt'>>): Promise<Meeting | undefined> => {
    try {
      if (isDevMode()) {
        const index = devMeetings.findIndex(m => m.id === id);
        if (index >= 0) {
          devMeetings[index] = { ...devMeetings[index], ...updates };
          return devMeetings[index];
        }
        return undefined;
      }
      return await apiFetch<Meeting>(`/meetings.php?id=${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
    } catch (err) {
      console.error('Error in meetingsApi.update:', err);
      return undefined;
    }
  },

  delete: async (id: string): Promise<boolean> => {
    try {
      if (isDevMode()) {
        const index = devMeetings.findIndex(m => m.id === id);
        if (index >= 0) {
          devMeetings.splice(index, 1);
          return true;
        }
        return false;
      }
      await apiFetch(`/meetings.php?id=${id}`, { method: 'DELETE' });
      return true;
    } catch (err) {
      console.error('Error in meetingsApi.delete:', err);
      return false;
    }
  },
};

// =====================================================
// USERS API
// =====================================================
export const usersApi = {
  getAll: async (): Promise<User[]> => {
    try {
      if (isDevMode()) {
        return [];
      }
      return await apiFetch<User[]>('/users.php');
    } catch (err) {
      console.error('Error in usersApi.getAll:', err);
      return [];
    }
  },

  getById: async (id: string): Promise<User | undefined> => {
    try {
      if (isDevMode()) {
        return undefined;
      }
      return await apiFetch<User>(`/users.php?id=${id}`);
    } catch (err) {
      console.error('Error in usersApi.getById:', err);
      return undefined;
    }
  },

  create: async (user: Omit<User, 'id' | 'createdAt'>): Promise<User> => {
    try {
      return await apiFetch<User>('/users.php', {
        method: 'POST',
        body: JSON.stringify(user),
      });
    } catch (err) {
      console.error('Error in usersApi.create:', err);
      throw err;
    }
  },

  update: async (id: string, updates: Partial<Omit<User, 'id' | 'createdAt'>>): Promise<User | undefined> => {
    try {
      return await apiFetch<User>(`/users.php?id=${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
    } catch (err) {
      console.error('Error in usersApi.update:', err);
      return undefined;
    }
  },

  delete: async (id: string): Promise<boolean> => {
    try {
      await apiFetch(`/users.php?id=${id}`, { method: 'DELETE' });
      return true;
    } catch (err) {
      console.error('Error in usersApi.delete:', err);
      return false;
    }
  },
};
