import { PrayerTimesData } from '../types';

export const getPrayerTimes = async (country: string, city: string): Promise<PrayerTimesData | null> => {
  try {
    // If invalid inputs, return null immediately
    if (!country || !city) return null;

    const date = new Date();
    // Format: DD-MM-YYYY
    const dateStr = `${date.getDate()}-${date.getMonth() + 1}-${date.getFullYear()}`;
    
    // Add timeout to fetch to prevent long hanging requests
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(
      `https://api.aladhan.com/v1/timingsByCity/${dateStr}?city=${encodeURIComponent(city)}&country=${encodeURIComponent(country)}&method=4`,
      { signal: controller.signal }
    );
    
    clearTimeout(timeoutId);

    if (!response.ok) return null;

    const data = await response.json();
    if (!data || !data.data) return null;

    const timings = data.data.timings;
    
    return {
      Fajr: timings.Fajr,
      Sunrise: timings.Sunrise,
      Dhuhr: timings.Dhuhr,
      Asr: timings.Asr,
      Maghrib: timings.Maghrib,
      Isha: timings.Isha,
      date: data.data.date.readable
    };
  } catch (error) {
    // Silently fail for prayer times (UI handles null) to avoid spamming console in offline mode
    // console.error("Failed to fetch prayer times", error); 
    return null;
  }
};