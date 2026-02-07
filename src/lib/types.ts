export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export interface Person {
  id: string;
  name: string;
  email: string;
  company?: string;
  role?: string;
  phone?: string;
  homeCountry?: string;
  badgeColor?: string; // Selected color for initials badge
  notes?: string;
  photo?: string; // Base64 or URL of person's photo
  createdAt: string;
}

export interface Hotel {
  id: string;
  name: string;
  country: string;
  city: string;
  area: string;
  fullAddress: string;
  latitude?: number;
  longitude?: number;
  createdAt: string;
}

export interface Meeting {
  id: string;
  title: string;
  personId: string;
  hotelId?: string;
  destination: string; // country
  fromDate: string;
  toDate: string;
  notes?: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  createdAt: string;
}

// Note: SQL schema is in /database/schema.sql
