import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { startOfDay, endOfDay, setHours, setMinutes, isAfter, addDays, differenceInMilliseconds } from 'date-fns';

export const checkAndNotify = async (uid: string) => {
  try {
    const today = new Date();
    const start = startOfDay(today);
    const end = endOfDay(today);

    const q = query(
      collection(db, 'expenses'),
      where('uid', '==', uid),
      where('date', '>=', start.toISOString()),
      where('date', '<=', end.toISOString())
    );

    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      if (Notification.permission === 'granted') {
        new Notification("XpenceX 💸", {
          body: "Don't forget to track your expenses today!",
          icon: "/pwa-192x192.png" // Fallback icon
        });
      }
    }
  } catch (err) {
    console.error("Notification check error:", err);
  }
};

export const scheduleDailyReminder = (uid: string, enabled: boolean) => {
  if (!enabled) return;

  const now = new Date();
  let reminderTime = setMinutes(setHours(new Date(), 22), 0); // 10:00 PM

  if (isAfter(now, reminderTime)) {
    reminderTime = addDays(reminderTime, 1);
  }

  const delay = differenceInMilliseconds(reminderTime, now);

  setTimeout(() => {
    checkAndNotify(uid);
    // Re-schedule for next day
    scheduleDailyReminder(uid, enabled);
  }, delay);
};
