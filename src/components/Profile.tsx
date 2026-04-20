import { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { signOut } from 'firebase/auth';
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { useAuth } from '../App';
import { Category } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { LogOut, Plus, Trash2, Settings, Wallet, Tag, ChevronRight, User, Mail, Bell, Moon, Sun, Globe, Download, Upload, FileSpreadsheet } from 'lucide-react';
import { MAJOR_CURRENCIES } from '../constants';
import { exportToExcel, parseExcelFile } from '../services/excelService';
import ExcelImportReview from './ExcelImportReview';

export default function Profile() {
  const { user, profile, refreshProfile, isDarkMode, toggleDarkMode } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [budget, setBudget] = useState(profile?.monthlyBudget?.toString() || '5000');
  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [isEditingCurrency, setIsEditingCurrency] = useState(false);
  const [importData, setImportData] = useState<any[] | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  useEffect(() => {
    if (!user) return;
    const catQ = query(collection(db, 'categories'), where('uid', '==', user.uid));
    const unsubscribeCats = onSnapshot(catQ, (snapshot) => {
      setCategories(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category)));
    });

    const expQ = query(collection(db, 'expenses'), where('uid', '==', user.uid));
    const unsubscribeExps = onSnapshot(expQ, (snapshot) => {
      setExpenses(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubscribeCats();
      unsubscribeExps();
    };
  }, [user]);

  const handleLogout = () => signOut(auth);

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newCategoryName.trim()) return;
    try {
      await addDoc(collection(db, 'categories'), {
        uid: user.uid,
        name: newCategoryName.trim(),
        icon: 'Tag',
        createdAt: new Date().toISOString(),
      });
      setNewCategoryName('');
    } catch (err) {
      console.error("Error adding category:", err);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this category?')) {
      await deleteDoc(doc(db, 'categories', id));
    }
  };

  const handleUpdateBudget = async () => {
    if (!user) return;
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        monthlyBudget: parseFloat(budget),
      });
      await refreshProfile();
      setIsEditingBudget(false);
    } catch (err) {
      console.error("Error updating budget:", err);
    }
  };

  const handleUpdateCurrency = async (code: string) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        currency: code,
      });
      await refreshProfile();
      setIsEditingCurrency(false);
    } catch (err) {
      console.error("Error updating currency:", err);
    }
  };

  return (
    <div className="space-y-6 pb-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Profile & Settings</h1>
        <button onClick={handleLogout} className="p-2 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors">
          <LogOut size={20} />
        </button>
      </header>

      {/* User Info Card */}
      <div className="bg-card p-6 rounded-3xl shadow-sm border border-card-border flex items-center gap-4 transition-colors">
        <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-2xl">
          {profile?.name?.[0] || 'U'}
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground">{profile?.name || 'User'}</h2>
          <p className="text-sm text-muted font-medium">
            @{profile?.email?.split('@')[0] || 'user'}
          </p>
        </div>
      </div>

      {/* Theme Toggle */}
      <div className="bg-card p-6 rounded-3xl shadow-sm border border-card-border transition-colors">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDarkMode ? 'bg-indigo-900/30 text-indigo-400' : 'bg-indigo-50 text-indigo-600'}`}>
              {isDarkMode ? <Moon size={20} /> : <Sun size={20} />}
            </div>
            <div>
              <p className="font-bold text-foreground">Night Mode</p>
              <p className="text-xs text-muted font-medium">Switch between light and dark themes</p>
            </div>
          </div>
          <button
            onClick={toggleDarkMode}
            className={`w-12 h-6 rounded-full transition-colors relative ${isDarkMode ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-white/5'}`}
          >
            <motion.div
              animate={{ x: isDarkMode ? 24 : 2 }}
              className="absolute top-1 left-0 w-4 h-4 bg-white rounded-full shadow-sm"
            />
          </button>
        </div>
      </div>

      {/* Notifications Toggle */}
      <div className="bg-card p-6 rounded-3xl shadow-sm border border-card-border transition-colors">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-50 dark:bg-amber-900/30 rounded-xl flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Bell size={20} />
            </div>
            <div>
              <p className="font-bold text-foreground">Daily Reminder</p>
              <p className="text-xs text-muted font-medium">Notify if I forget to log daily</p>
            </div>
          </div>
          <button
            onClick={async () => {
              if (!user) return;
              const currentValue = !!profile?.notificationsEnabled;
              const newValue = !currentValue;
              
              if (newValue) {
                try {
                  const permission = await Notification.requestPermission();
                  if (permission !== 'granted') {
                    console.warn("Notification permission not granted:", permission);
                  }
                } catch (err) {
                  console.error("Notification API error:", err);
                }
              }

              try {
                await updateDoc(doc(db, 'users', user.uid), {
                  notificationsEnabled: newValue,
                });
              } catch (err) {
                console.error("Error updating profile:", err);
              }
            }}
            className={`w-12 h-6 rounded-full transition-colors relative ${profile?.notificationsEnabled ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-white/5'}`}
          >
            <motion.div
              animate={{ x: profile?.notificationsEnabled ? 24 : 2 }}
              className="absolute top-1 left-0 w-4 h-4 bg-white rounded-full shadow-sm"
            />
          </button>
        </div>
      </div>

      {/* Excel Data Management */}
      <div className="bg-card p-6 rounded-3xl shadow-sm border border-card-border space-y-6 transition-colors">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <FileSpreadsheet size={20} />
          </div>
          <h3 className="font-bold text-foreground">Data Management</h3>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => exportToExcel(expenses)}
            className="p-4 bg-emerald-600 text-white rounded-2xl font-bold flex flex-col items-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
          >
            <Download size={24} />
            <span className="text-xs">Export to Excel</span>
          </button>
          
          <label className="p-4 bg-blue-600 text-white rounded-2xl font-bold flex flex-col items-center gap-2 shadow-lg shadow-blue-500/20 active:scale-95 transition-all cursor-pointer">
            <Upload size={24} />
            <span className="text-xs">Import from Excel</span>
            <input 
              type="file" 
              accept=".xlsx,.xls" 
              className="hidden" 
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (file) {
                  try {
                    const data = await parseExcelFile(file);
                    setImportData(data);
                    setIsImporting(true);
                  } catch (err) {
                    alert("Failed to parse Excel file. Ensure it has Title, Amount, Category columns.");
                  }
                }
              }}
            />
          </label>
        </div>
      </div>

      {/* Currency Settings */}
      <div className="bg-card p-6 rounded-3xl shadow-sm border border-card-border space-y-4 transition-colors">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/30 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Globe size={20} />
            </div>
            <h3 className="font-bold text-foreground">Preferred Currency</h3>
          </div>
          <button onClick={() => setIsEditingCurrency(!isEditingCurrency)} className="text-indigo-600 dark:text-indigo-400 font-bold text-sm">
            {isEditingCurrency ? 'Cancel' : 'Change'}
          </button>
        </div>
        
        {isEditingCurrency ? (
          <div className="grid grid-cols-2 gap-2">
            {MAJOR_CURRENCIES.map((curr) => (
              <button
                key={curr.code}
                onClick={() => handleUpdateCurrency(curr.code)}
                className={`p-3 rounded-xl text-sm font-bold border transition-all ${
                  profile?.currency === curr.code
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-background/50 text-muted border-card-border'
                }`}
              >
                {curr.code} ({curr.symbol})
              </button>
            ))}
          </div>
        ) : (
          <p className="text-xl font-bold text-foreground">
            {MAJOR_CURRENCIES.find(c => c.code === profile?.currency)?.name || profile?.currency || 'Bangladeshi Taka'} ({profile?.currency || 'BDT'})
          </p>
        )}
      </div>

      {/* Budget Settings */}
      <div className="bg-card p-6 rounded-3xl shadow-sm border border-card-border space-y-4 transition-colors">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <Wallet size={20} />
            </div>
            <h3 className="font-bold text-foreground">Monthly Budget</h3>
          </div>
          {!isEditingBudget ? (
            <button onClick={() => setIsEditingBudget(true)} className="text-indigo-600 dark:text-indigo-400 font-bold text-sm">Edit</button>
          ) : (
            <button onClick={handleUpdateBudget} className="text-emerald-600 dark:text-emerald-400 font-bold text-sm">Save</button>
          )}
        </div>
        
        {isEditingBudget ? (
          <div className="flex gap-2">
            <input
              type="number"
              className="flex-1 px-4 py-3 bg-background/50 rounded-xl border-none focus:ring-2 focus:ring-indigo-600 outline-none text-foreground"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
            />
          </div>
        ) : (
          <p className="text-2xl font-bold text-foreground">{profile?.currency || 'BDT'} {parseFloat(budget).toLocaleString()}</p>
        )}
      </div>

      {/* Category Management */}
      <div className="bg-card p-6 rounded-3xl shadow-sm border border-card-border space-y-6 transition-colors">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <Tag size={20} />
          </div>
          <h3 className="font-bold text-foreground">Custom Categories</h3>
        </div>

        <form onSubmit={handleAddCategory} className="flex gap-2">
          <input
            type="text"
            placeholder="New category name"
            className="flex-1 px-4 py-3 bg-background/50 rounded-xl border-none focus:ring-2 focus:ring-indigo-600 outline-none text-sm text-foreground"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
          />
          <button
            type="submit"
            className="p-3 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-100 dark:shadow-indigo-900/20"
          >
            <Plus size={20} />
          </button>
        </form>

        <div className="space-y-2">
          <AnimatePresence mode="popLayout">
            {categories.map((cat) => (
              <motion.div
                key={cat.id}
                layout
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="flex items-center justify-between p-3 bg-background/50 rounded-xl border border-card-border"
              >
                <span className="text-sm font-bold text-muted">{cat.name}</span>
                <button
                  onClick={() => handleDeleteCategory(cat.id!)}
                  className="p-1.5 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-lg transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
          {categories.length === 0 && (
            <p className="text-center py-4 text-slate-400 dark:text-slate-500 text-sm font-medium italic">No custom categories added</p>
          )}
        </div>
      </div>

      {/* App Info */}
      <div className="text-center py-6">
        <p className="text-muted text-xs font-bold uppercase tracking-widest">XpenceX v1.1.0</p>
        <p className="text-muted text-[10px] mt-1">Made with ❤️ by Ishmam Ahmed</p>
      </div>

      <ExcelImportReview 
        isOpen={isImporting}
        data={importData || []}
        currency={MAJOR_CURRENCIES.find(c => c.code === profile?.currency)?.symbol || '৳'}
        onCancel={() => {
          setIsImporting(false);
          setImportData(null);
        }}
        onConfirm={async (finalData) => {
          if (!user) return;
          try {
            const batch = finalData.map(item => addDoc(collection(db, 'expenses'), {
              ...item,
              uid: user.uid,
              createdAt: new Date().toISOString()
            }));
            await Promise.all(batch);
            setIsImporting(false);
            setImportData(null);
            alert("Successfully imported " + finalData.length + " transactions!");
          } catch (err) {
            alert("Failed to save imported data.");
          }
        }}
      />
    </div>
  );
}
