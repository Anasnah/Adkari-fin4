
export enum UserRole {
  ADMIN = 'ADMIN',
  USER = 'USER'
}

export enum SubscriptionStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
  BANNED = 'BANNED'
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  subscriptionStatus: SubscriptionStatus;
  subscriptionEndDate?: string;
  country: string;
  city: string;
}

export interface Order {
  id?: string;
  customerName: string;
  customerEmail: string;
  shippingAddress: string;
  productName: string;
  totalAmount: number;
  orderDate?: string;
}

export interface Dhikr {
  id: string;
  text: string;
  count: number;
  category: string; // 'morning', 'evening', 'prayer', 'sleep', 'waking'
  benefit?: string;
  source?: string;
  order: number;
}

export interface Hadith {
  id: string;
  text: string;
  source: string; // e.g., Bukhari
  category: string;
}

export interface NewsItem {
  id: string;
  title: string;
  content: string;
  date: string;
}

export interface AppBanner {
  id: string;
  imageUrl: string;
  title?: string;
}

export interface PrayerTimesData {
  Fajr: string;
  Sunrise: string;
  Dhuhr: string;
  Asr: string;
  Maghrib: string;
  Isha: string;
  date: string;
}

export type Theme = 'light' | 'dark';

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}