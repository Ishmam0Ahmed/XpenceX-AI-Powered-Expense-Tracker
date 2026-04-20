/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, createContext, useContext } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db, testConnection } from './firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { UserProfile } from './types';
import Auth from './components/Auth';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import Expenses from './components/Expenses';
import AddExpense from './components/AddExpense';
import Reports from './components/Reports';
import AIChat from './components/AIChat';
import Profile from './components/Profile';
import { motion, AnimatePresence } from 'motion/react';
import { scheduleDailyReminder } from './services/notificationService';

const lightTheme = {
  background: '#FFFFFF',
  text: '#000000',
  card: '#F5F5F5',
};

const darkTheme = {
  background: '#121212',
  text: '#FFFFFF',
  card: '#1E1E1E',
};

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  theme: typeof lightTheme;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  refreshProfile: async () => {},
  isDarkMode: false,
  toggleDarkMode: () => {},
  theme: lightTheme,
});

export const useAuth = () => useContext(AuthContext);

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('home');
  const [isFirestoreAvailable, setIsFirestoreAvailable] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    if (saved !== null) return JSON.parse(saved);
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const theme = isDarkMode ? darkTheme : lightTheme;

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(isDarkMode));
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => setIsDarkMode(!isDarkMode);

  useEffect(() => {
    const checkConnection = () => {
      testConnection().then(available => setIsFirestoreAvailable(available));
    };

    checkConnection();

    // Re-check when user tab becomes active (helps if they left it open over midnight)
    window.addEventListener('focus', checkConnection);
    return () => window.removeEventListener('focus', checkConnection);
  }, []);
  
  useEffect(() => {
    let unsubscribeProfile: (() => void) | undefined;

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        const docRef = doc(db, 'users', user.uid);
        unsubscribeProfile = onSnapshot(docRef, async (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            setProfile({
              uid: docSnap.id,
              email: data.email,
              name: data.name,
              currency: data.currency,
              monthlyBudget: data.monthlyBudget,
              notificationsEnabled: data.notificationsEnabled,
              ...data
            } as UserProfile);
          } else {
            // Initial profile creation
            const newProfile: UserProfile = {
              uid: user.uid,
              email: user.email || '',
              name: user.displayName || '',
              currency: 'BDT',
              monthlyBudget: 5000,
              notificationsEnabled: false,
            };
            await setDoc(docRef, newProfile);
            // onSnapshot will trigger again after setDoc
          }
          setLoading(false);
        });
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) unsubscribeProfile();
    };
  }, []);

  useEffect(() => {
    if (user && profile?.notificationsEnabled) {
      scheduleDailyReminder(user.uid, profile.notificationsEnabled);
    }
  }, [user, profile?.notificationsEnabled]);

  const refreshProfile = async () => {
    // With onSnapshot, manual refresh is no longer strictly necessary
    // but kept for compatibility with components calling it
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background transition-colors duration-300">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'home': return <Dashboard />;
      case 'expenses': return <Expenses />;
      case 'add': return <AddExpense onComplete={() => setActiveTab('expenses')} />;
      case 'reports': return <Reports />;
      case 'chat': return <AIChat />;
      case 'profile': return <Profile />;
      default: return <Dashboard />;
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, refreshProfile, isDarkMode, toggleDarkMode, theme }}>
      <div className="min-h-screen bg-background text-foreground font-sans pb-24 transition-colors duration-300 relative overflow-x-hidden">
        {/* Decorative background elements */}
        <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
          <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-indigo-500/10 dark:bg-indigo-500/5 rounded-full blur-[120px]" />
          <div className="absolute top-[20%] -right-[10%] w-[35%] h-[35%] bg-purple-500/10 dark:bg-purple-500/5 rounded-full blur-[100px]" />
          <div className="absolute -bottom-[10%] left-[20%] w-[30%] h-[30%] bg-teal-500/10 dark:bg-teal-500/5 rounded-full blur-[80px]" />
        </div>

        <div className="relative z-10">
          {!isFirestoreAvailable && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 mx-4 bg-rose-500 text-white px-4 py-3 rounded-2xl flex flex-col gap-1 shadow-lg"
            >
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                <p className="text-[10px] font-bold uppercase tracking-widest leading-none pt-0.5">Firestore Unavailable</p>
              </div>
              <p className="text-[9px] opacity-90 leading-tight">
                Please check your Internet connection or Firebase configuration. If you've been using the app heavily, you may have reached the Spark plan quota (resets daily). 
                Check pricing details at <a href="https://firebase.google.com/pricing#cloud-firestore" target="_blank" className="underline">firebase.google.com/pricing</a>
              </p>
            </motion.div>
          )}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, scale: 0.98, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 1.02, y: -10 }}
              transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
              className="max-w-md mx-auto px-4 pt-6"
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </div>
        <Layout activeTab={activeTab} setActiveTab={setActiveTab} />
      </div>
    </AuthContext.Provider>
  );
}

