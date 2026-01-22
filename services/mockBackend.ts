import { User, UserRole, SubscriptionStatus, Dhikr, Hadith, NewsItem, AppBanner, Order } from '../types';
import { supabase, isSupabaseConfigured } from './supabaseClient';

// --- Local Storage Keys ---
const LS_KEYS = {
  USER: 'adkari_user',
  DHIKRS: 'adkari_dhikrs',
  HADITHS: 'adkari_hadiths',
  NEWS: 'adkari_news',
  BANNERS: 'adkari_banners',
  USERS_DB: 'adkari_users_db', // Simulate a users database
  ORDERS: 'adkari_orders'
};

// --- Initial Mock Data ---
const INITIAL_DHIKRS: Dhikr[] = [
  { id: '1', text: 'سبحان الله وبحمده', count: 33, category: 'morning', order: 1, benefit: 'غفرت ذنوبه وإن كانت مثل زبد البحر' },
  { id: '2', text: 'أستغفر الله العظيم', count: 100, category: 'evening', order: 2 },
  { id: '3', text: 'الله أكبر', count: 33, category: 'prayer', order: 3 },
  { id: '4', text: 'لا إله إلا الله وحده لا شريك له', count: 10, category: 'morning', order: 4 }
];

const INITIAL_HADITHS: Hadith[] = [
  { id: '1', text: 'إنما الأعمال بالنيات', source: 'البخاري', category: 'النية' },
  { id: '2', text: 'الدين النصيحة', source: 'مسلم', category: 'عام' }
];

const INITIAL_NEWS: NewsItem[] = [
  { id: '1', title: 'تحديث جديد', content: 'تم إضافة الوضع الليلي وميزة الأذكار التلقائية', date: new Date().toISOString().split('T')[0] }
];

class MockBackendService {
  
  // --- Helpers for Local Mode ---
  
  private getLocal<T>(key: string, defaultVal: T): T {
    try {
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : defaultVal;
    } catch (e) {
      return defaultVal;
    }
  }

  private setLocal(key: string, val: any) {
    try {
      localStorage.setItem(key, JSON.stringify(val));
    } catch (e) {
      console.error('LocalStorage error', e);
    }
  }

  // --- Auth ---

  async login(email: string, password: string): Promise<User> {
    if (isSupabaseConfigured) {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError) throw new Error(authError.message);
      if (!authData.user) throw new Error('User not found');

      const { data: profile } = await supabase.from('profiles').select('*').eq('id', authData.user.id).single();
      
      return {
        id: authData.user.id,
        email: authData.user.email || '',
        name: profile?.name || 'User',
        role: (profile?.role as UserRole) || UserRole.USER,
        subscriptionStatus: (profile?.subscription_status as SubscriptionStatus) || SubscriptionStatus.ACTIVE,
        country: profile?.country || 'Morocco',
        city: profile?.city || 'Rabat'
      };
    } else {
      // Mock Login
      
      // *** SPECIAL ADMIN RESTORE LOGIC ***
      if (email.toLowerCase() === 'anasnahilo20@gmail.com' && password === 'Anas@2000') {
        const usersDB = this.getLocal<User[]>(LS_KEYS.USERS_DB, []);
        let adminUser = usersDB.find(u => u.email.toLowerCase() === email.toLowerCase());

        // Create or Update Admin User
        if (!adminUser) {
          adminUser = {
            id: 'admin-anas-special',
            email: 'anasnahilo20@gmail.com',
            name: 'Anas Admin',
            role: UserRole.ADMIN,
            subscriptionStatus: SubscriptionStatus.ACTIVE,
            country: 'Morocco',
            city: 'Rabat'
          };
          usersDB.push(adminUser);
          this.setLocal(LS_KEYS.USERS_DB, usersDB);
        } else if (adminUser.role !== UserRole.ADMIN) {
          // Force upgrade to admin if exists but lost privileges
          adminUser.role = UserRole.ADMIN;
          this.setLocal(LS_KEYS.USERS_DB, usersDB);
        }

        this.setLocal(LS_KEYS.USER, adminUser);
        return adminUser;
      }

      const usersDB = this.getLocal<User[]>(LS_KEYS.USERS_DB, []);
      const user = usersDB.find(u => u.email.toLowerCase() === email.toLowerCase());
      
      // Simple mock password check (in real app, never store plain text passwords)
      if (user) {
        this.setLocal(LS_KEYS.USER, user);
        return user;
      }
      throw new Error('بيانات الدخول غير صحيحة (وضع تجريبي: أنشئ حساباً جديداً أولاً)');
    }
  }

  async register(name: string, email: string, password: string, country: string, city: string): Promise<User> {
    if (isSupabaseConfigured) {
      const { data: authData, error: authError } = await supabase.auth.signUp({ email, password });
      if (authError) throw new Error(authError.message);
      if (!authData.user) throw new Error('Registration failed');

      const initialRole = (email.toLowerCase().endsWith('@adkari.com') || email.toLowerCase() === 'anasnahilo20@gmail.com') ? UserRole.ADMIN : UserRole.USER;
      const newUser: User = {
        id: authData.user.id,
        email: email,
        name: name,
        role: initialRole,
        subscriptionStatus: SubscriptionStatus.ACTIVE,
        country: country,
        city: city
      };

      await supabase.from('profiles').insert([{
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
        subscription_status: newUser.subscriptionStatus,
        country: newUser.country,
        city: newUser.city
      }]);

      return newUser;
    } else {
      // Mock Register
      const usersDB = this.getLocal<User[]>(LS_KEYS.USERS_DB, []);
      if (usersDB.find(u => u.email === email)) throw new Error('البريد الإلكتروني مسجل مسبقاً');

      const initialRole = (email.toLowerCase().endsWith('@adkari.com') || email.toLowerCase() === 'anasnahilo20@gmail.com') ? UserRole.ADMIN : UserRole.USER;
      const newUser: User = {
        id: Math.random().toString(36).substr(2, 9),
        email,
        name,
        role: initialRole,
        subscriptionStatus: SubscriptionStatus.ACTIVE,
        country,
        city
      };

      usersDB.push(newUser);
      this.setLocal(LS_KEYS.USERS_DB, usersDB);
      this.setLocal(LS_KEYS.USER, newUser);
      return newUser;
    }
  }

  async logout(): Promise<void> {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
    localStorage.removeItem(LS_KEYS.USER);
  }

  async checkSession(): Promise<User | null> {
    if (isSupabaseConfigured) {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) return null;
        
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
        if (!profile) return null;

        return {
          id: session.user.id,
          email: session.user.email || '',
          name: profile.name,
          role: profile.role as UserRole,
          subscriptionStatus: profile.subscription_status as SubscriptionStatus,
          country: profile.country,
          city: profile.city
        };
      } catch (error) {
        console.warn("Supabase session check failed, ignoring...", error);
        return null;
      }
    } else {
      return this.getLocal<User | null>(LS_KEYS.USER, null);
    }
  }

  async resetPassword(email: string): Promise<void> {
    if (isSupabaseConfigured) {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw new Error(error.message);
    } else {
      // Mock reset
      console.log(`Mock reset password email sent to ${email}`);
    }
  }

  async updatePassword(email: string, oldPass: string, newPass: string): Promise<void> {
    if (isSupabaseConfigured) {
      const { error } = await supabase.auth.updateUser({ password: newPass });
      if (error) throw new Error(error.message);
    } else {
      console.log('Mock password updated');
    }
  }

  // --- Orders ---
  
  async createOrder(order: Order): Promise<void> {
    if (isSupabaseConfigured) {
      const { error } = await supabase.from('orders').insert([{
        customer_name: order.customerName,
        customer_email: order.customerEmail,
        shipping_address: order.shippingAddress,
        product_name: order.productName,
        total_amount: order.totalAmount,
        // order_date is handled by default now() in SQL
      }]);
      if (error) throw new Error(error.message);
    } else {
      const orders = this.getLocal<Order[]>(LS_KEYS.ORDERS, []);
      orders.push({
        ...order,
        id: Math.random().toString(36).substr(2, 9),
        orderDate: new Date().toISOString()
      });
      this.setLocal(LS_KEYS.ORDERS, orders);
    }
  }

  // --- Admin Functions ---

  async getAllUsers(): Promise<User[]> {
    if (isSupabaseConfigured) {
      const { data } = await supabase.from('profiles').select('*').order('name');
      return (data || []).map((p: any) => ({
        id: p.id,
        email: p.email,
        name: p.name,
        role: p.role,
        subscriptionStatus: p.subscription_status,
        country: p.country,
        city: p.city
      }));
    } else {
      return this.getLocal<User[]>(LS_KEYS.USERS_DB, []);
    }
  }

  async updateUserRole(userId: string, role: UserRole): Promise<void> {
    if (isSupabaseConfigured) {
      await supabase.from('profiles').update({ role }).eq('id', userId);
    } else {
      const users = this.getLocal<User[]>(LS_KEYS.USERS_DB, []);
      const idx = users.findIndex(u => u.id === userId);
      if (idx !== -1) {
        users[idx].role = role;
        this.setLocal(LS_KEYS.USERS_DB, users);
        // If updating current user
        const currentUser = this.getLocal<User | null>(LS_KEYS.USER, null);
        if (currentUser && currentUser.id === userId) {
          currentUser.role = role;
          this.setLocal(LS_KEYS.USER, currentUser);
        }
      }
    }
  }

  async updateUserSubscription(userId: string, status: SubscriptionStatus): Promise<void> {
    if (isSupabaseConfigured) {
      await supabase.from('profiles').update({ subscription_status: status }).eq('id', userId);
    } else {
      const users = this.getLocal<User[]>(LS_KEYS.USERS_DB, []);
      const idx = users.findIndex(u => u.id === userId);
      if (idx !== -1) {
        users[idx].subscriptionStatus = status;
        this.setLocal(LS_KEYS.USERS_DB, users);
      }
    }
  }
  
  async deleteUser(userId: string): Promise<void> {
    if (isSupabaseConfigured) {
      await supabase.from('profiles').delete().eq('id', userId);
    } else {
      let users = this.getLocal<User[]>(LS_KEYS.USERS_DB, []);
      users = users.filter(u => u.id !== userId);
      this.setLocal(LS_KEYS.USERS_DB, users);
    }
  }

  // --- Global Content ---

  async getDhikrs(): Promise<Dhikr[]> {
    if (isSupabaseConfigured) {
      const { data } = await supabase.from('dhikrs').select('*').order('order', { ascending: true });
      return (data as Dhikr[]) || [];
    } else {
      return this.getLocal<Dhikr[]>(LS_KEYS.DHIKRS, INITIAL_DHIKRS);
    }
  }

  async saveDhikr(dhikr: Dhikr): Promise<void> {
    if (isSupabaseConfigured) {
      await supabase.from('dhikrs').upsert(dhikr);
    } else {
      const items = this.getLocal<Dhikr[]>(LS_KEYS.DHIKRS, INITIAL_DHIKRS);
      const idx = items.findIndex(i => i.id === dhikr.id);
      if (idx !== -1) items[idx] = dhikr;
      else items.push(dhikr);
      this.setLocal(LS_KEYS.DHIKRS, items);
    }
  }

  async deleteDhikr(id: string): Promise<void> {
    if (isSupabaseConfigured) {
      await supabase.from('dhikrs').delete().eq('id', id);
    } else {
      let items = this.getLocal<Dhikr[]>(LS_KEYS.DHIKRS, INITIAL_DHIKRS);
      items = items.filter(i => i.id !== id);
      this.setLocal(LS_KEYS.DHIKRS, items);
    }
  }

  async getHadiths(): Promise<Hadith[]> {
    if (isSupabaseConfigured) {
      const { data } = await supabase.from('hadiths').select('*');
      return (data as Hadith[]) || [];
    } else {
      return this.getLocal<Hadith[]>(LS_KEYS.HADITHS, INITIAL_HADITHS);
    }
  }

  async saveHadith(hadith: Hadith): Promise<void> {
    if (isSupabaseConfigured) {
      await supabase.from('hadiths').upsert(hadith);
    } else {
      const items = this.getLocal<Hadith[]>(LS_KEYS.HADITHS, INITIAL_HADITHS);
      const idx = items.findIndex(i => i.id === hadith.id);
      if (idx !== -1) items[idx] = hadith;
      else items.push(hadith);
      this.setLocal(LS_KEYS.HADITHS, items);
    }
  }

  async deleteHadith(id: string): Promise<void> {
    if (isSupabaseConfigured) {
      await supabase.from('hadiths').delete().eq('id', id);
    } else {
      let items = this.getLocal<Hadith[]>(LS_KEYS.HADITHS, INITIAL_HADITHS);
      items = items.filter(i => i.id !== id);
      this.setLocal(LS_KEYS.HADITHS, items);
    }
  }

  // --- News & Banners ---

  async getNews(): Promise<NewsItem[]> {
    if (isSupabaseConfigured) {
      const { data } = await supabase.from('news').select('*').order('date', { ascending: false });
      return (data as NewsItem[]) || [];
    } else {
      return this.getLocal<NewsItem[]>(LS_KEYS.NEWS, INITIAL_NEWS);
    }
  }

  async saveNews(news: NewsItem): Promise<void> {
    if (isSupabaseConfigured) {
      await supabase.from('news').upsert(news);
    } else {
      const items = this.getLocal<NewsItem[]>(LS_KEYS.NEWS, INITIAL_NEWS);
      const idx = items.findIndex(i => i.id === news.id);
      if (idx !== -1) items[idx] = news;
      else items.push(news);
      this.setLocal(LS_KEYS.NEWS, items);
    }
  }

  async deleteNews(id: string): Promise<void> {
    if (isSupabaseConfigured) {
      await supabase.from('news').delete().eq('id', id);
    } else {
      let items = this.getLocal<NewsItem[]>(LS_KEYS.NEWS, INITIAL_NEWS);
      items = items.filter(i => i.id !== id);
      this.setLocal(LS_KEYS.NEWS, items);
    }
  }

  async getBanners(): Promise<AppBanner[]> {
    if (isSupabaseConfigured) {
      const { data } = await supabase.from('banners').select('*');
      return (data as AppBanner[]) || [];
    } else {
      return this.getLocal<AppBanner[]>(LS_KEYS.BANNERS, []);
    }
  }

  async saveBanner(banner: AppBanner): Promise<void> {
    if (isSupabaseConfigured) {
      await supabase.from('banners').upsert(banner);
    } else {
      const items = this.getLocal<AppBanner[]>(LS_KEYS.BANNERS, []);
      const idx = items.findIndex(i => i.id === banner.id);
      if (idx !== -1) items[idx] = banner;
      else items.push(banner);
      this.setLocal(LS_KEYS.BANNERS, items);
    }
  }

  async deleteBanner(id: string): Promise<void> {
    if (isSupabaseConfigured) {
      await supabase.from('banners').delete().eq('id', id);
    } else {
      let items = this.getLocal<AppBanner[]>(LS_KEYS.BANNERS, []);
      items = items.filter(i => i.id !== id);
      this.setLocal(LS_KEYS.BANNERS, items);
    }
  }
}

export const mockBackend = new MockBackendService();