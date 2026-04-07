import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, orderBy, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { useAuth } from '../App';
import { Expense } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Trash2, Edit2, Search, Filter, Calendar, ChevronRight, Tag } from 'lucide-react';
import { format } from 'date-fns';
import { MAJOR_CURRENCIES, DEFAULT_CATEGORIES } from '../constants';

export default function Expenses() {
  const { user, profile } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');

  const currencySymbol = MAJOR_CURRENCIES.find(c => c.code === profile?.currency)?.symbol || '৳';

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'expenses'),
      where('uid', '==', user.uid),
      orderBy('date', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setExpenses(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Expense)));
    });

    return unsubscribe;
  }, [user]);

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this expense?')) {
      await deleteDoc(doc(db, 'expenses', id));
    }
  };

  const filteredExpenses = expenses.filter(exp => {
    const matchesSearch = exp.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         exp.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'All' || exp.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = ['All', ...Array.from(new Set(expenses.map(e => e.category)))];

  return (
    <div className="space-y-8 pb-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Transactions</h1>
          <p className="text-indigo-600 dark:text-indigo-400 font-bold text-xs uppercase tracking-widest">{filteredExpenses.length} Total</p>
        </div>
        <div className="w-10 h-10 bg-card rounded-xl shadow-soft border border-card-border flex items-center justify-center text-slate-400">
          <Filter size={18} />
        </div>
      </header>

      {/* Search & Filter */}
      <div className="space-y-5">
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={20} />
          <input
            type="text"
            placeholder="Search transactions..."
            className="w-full pl-12 pr-4 py-4 bg-card rounded-2xl border border-card-border shadow-soft focus:ring-2 focus:ring-indigo-600 outline-none transition-all text-foreground"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar px-1">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-5 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all ${
                filterCategory === cat
                  ? 'bg-indigo-600 text-white shadow-vibrant'
                  : 'bg-card text-muted border border-card-border'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="space-y-4">
        <AnimatePresence mode="popLayout">
          {filteredExpenses.map((exp, index) => {
            const categoryConfig = DEFAULT_CATEGORIES.find(c => c.name === exp.category);
            const Icon = categoryConfig?.icon || Tag;
            return (
              <motion.div
                key={exp.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: index * 0.03 }}
                className="bg-card p-4 rounded-[2rem] shadow-soft border border-card-border group hover:shadow-lg transition-all overflow-hidden relative"
              >
                {/* Subtle category tint background */}
                <div className={`absolute inset-0 opacity-[0.03] dark:opacity-[0.05] ${categoryConfig?.color?.split(' ')[0] || 'bg-slate-500'}`} />
                
                <div className="relative z-10 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm ${categoryConfig?.color || 'bg-slate-50 dark:bg-slate-800 text-muted'}`}>
                      <Icon size={24} />
                    </div>
                    <div>
                      <p className="font-bold text-foreground group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{exp.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-bold text-muted uppercase tracking-widest">{exp.category}</span>
                        <span className="w-1 h-1 bg-slate-300 dark:bg-slate-700 rounded-full" />
                        <span className="flex items-center gap-1 text-[10px] font-bold text-muted uppercase tracking-widest">
                          <Calendar size={10} />
                          {format(new Date(exp.date), 'MMM d, yyyy')}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-foreground text-lg">-{currencySymbol}{exp.amount.toLocaleString()}</p>
                    <div className="flex items-center justify-end gap-2 mt-1 opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0">
                      <button
                        onClick={() => handleDelete(exp.id)}
                        className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
                {exp.notes && (
                  <div className="relative z-10 mt-4 px-4 py-3 bg-slate-50/50 dark:bg-slate-800/30 rounded-2xl border border-slate-100 dark:border-slate-700/50">
                    <p className="text-xs text-muted italic font-medium">
                      "{exp.notes}"
                    </p>
                  </div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>

        {filteredExpenses.length === 0 && (
          <div className="text-center py-24 bg-card rounded-[3rem] border border-dashed border-card-border">
            <div className="w-24 h-24 bg-background rounded-full flex items-center justify-center mx-auto mb-6 text-muted">
              <Search size={48} />
            </div>
            <p className="text-foreground font-bold text-lg">No matches found</p>
            <p className="text-muted text-sm mt-1">Try adjusting your filters</p>
          </div>
        )}
      </div>
    </div>
  );
}
