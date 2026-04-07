import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, addDoc, query, where, onSnapshot } from 'firebase/firestore';
import { useAuth } from '../App';
import { Category } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Wallet, Tag, Calendar, FileText, Check, ArrowLeft, Edit2, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { DEFAULT_CATEGORIES, MAJOR_CURRENCIES } from '../constants';

interface AddExpenseProps {
  onComplete: () => void;
}

export default function AddExpense({ onComplete }: AddExpenseProps) {
  const { user, profile } = useAuth();
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [notes, setNotes] = useState('');
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const currencySymbol = MAJOR_CURRENCIES.find(c => c.code === profile?.currency)?.symbol || '৳';

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'categories'), where('uid', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const customCats = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        name: doc.data().name,
        icon: Tag,
        color: 'bg-slate-100 text-slate-600 dark:bg-slate-900/30 dark:text-slate-400'
      }));
      const allCats = [...DEFAULT_CATEGORIES, ...customCats];
      setCategories(allCats);
      if (allCats.length > 0 && !category) setCategory(allCats[0].name);
    });
    return unsubscribe;
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !title || !amount || !category) return;

    setLoading(true);
    try {
      await addDoc(collection(db, 'expenses'), {
        uid: user.uid,
        title,
        amount: parseFloat(amount),
        category,
        date: new Date(date).toISOString(),
        notes,
        createdAt: new Date().toISOString(),
      });
      onComplete();
    } catch (err) {
      console.error("Error adding expense:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 pb-6">
      <header className="flex items-center gap-4">
        <motion.button 
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={onComplete} 
          className="p-3 bg-card rounded-2xl shadow-soft border border-card-border text-slate-500 dark:text-slate-400"
        >
          <ArrowLeft size={20} />
        </motion.button>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Add Expense</h1>
      </header>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="bg-card p-7 rounded-[2.5rem] shadow-soft border border-card-border space-y-6 transition-all">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-muted uppercase tracking-[0.2em] px-1">Transaction Title</label>
            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 group-focus-within:bg-indigo-600 group-focus-within:text-white transition-all">
                <FileText size={18} />
              </div>
              <input
                type="text"
                placeholder="What did you spend on?"
                className="w-full pl-16 pr-4 py-4 bg-background/50 rounded-2xl border-2 border-transparent focus:border-indigo-600/20 focus:bg-background outline-none transition-all text-foreground font-medium"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-muted uppercase tracking-[0.2em] px-1">Amount</label>
            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold group-focus-within:bg-emerald-600 group-focus-within:text-white transition-all">
                {currencySymbol}
              </div>
              <input
                type="number"
                placeholder="0.00"
                className="w-full pl-16 pr-4 py-5 bg-background/50 rounded-2xl border-2 border-transparent focus:border-emerald-600/20 focus:bg-background outline-none transition-all font-bold text-2xl text-foreground"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-[10px] font-bold text-muted uppercase tracking-[0.2em] px-1 flex items-center gap-2">
              <Tag size={12} /> Select Category
            </label>
            <div className="grid grid-cols-3 gap-3">
              {categories.map((cat, idx) => {
                const Icon = cat.icon;
                const isSelected = category === cat.name;
                return (
                  <motion.button
                    key={idx}
                    type="button"
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setCategory(cat.name)}
                    className={`p-4 rounded-[1.5rem] text-[10px] font-bold border-2 transition-all flex flex-col items-center gap-3 ${
                      isSelected
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-vibrant'
                        : 'bg-background/50 text-muted border-transparent hover:border-card-border'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isSelected ? 'bg-white/20' : cat.color}`}>
                      <Icon size={20} />
                    </div>
                    <span className="truncate w-full text-center tracking-tight">{cat.name}</span>
                  </motion.button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-muted uppercase tracking-[0.2em] px-1">Date</label>
              <div className="relative group">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
                <input
                  type="date"
                  className="w-full pl-12 pr-4 py-3.5 bg-background/50 rounded-2xl border-2 border-transparent focus:border-indigo-600/20 focus:bg-background outline-none transition-all text-foreground text-sm font-medium"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-muted uppercase tracking-[0.2em] px-1">Notes</label>
              <div className="relative group">
                <Edit2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
                <input
                  type="text"
                  placeholder="Optional"
                  className="w-full pl-12 pr-4 py-3.5 bg-background/50 rounded-2xl border-2 border-transparent focus:border-indigo-600/20 focus:bg-background outline-none transition-all text-foreground text-sm font-medium"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        <motion.button
          type="submit"
          disabled={loading}
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
          className="w-full py-5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-[2rem] font-bold shadow-vibrant hover:shadow-indigo-500/40 disabled:opacity-50 disabled:shadow-none transition-all flex items-center justify-center gap-3 text-lg"
        >
          {loading ? (
            <Loader2 className="animate-spin" size={24} />
          ) : (
            <>
              Save Transaction
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <Check size={18} />
              </div>
            </>
          )}
        </motion.button>
      </form>
    </div>
  );
}
