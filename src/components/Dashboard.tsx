import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { useAuth } from '../App';
import { Expense } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Wallet, TrendingUp, TrendingDown, Clock, ChevronRight, Tag } from 'lucide-react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, isToday } from 'date-fns';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { MAJOR_CURRENCIES, DEFAULT_CATEGORIES } from '../constants';

export default function Dashboard() {
  const { user, profile } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [summary, setSummary] = useState({ today: 0, week: 0, month: 0 });

  const currencySymbol = MAJOR_CURRENCIES.find(c => c.code === profile?.currency)?.symbol || '৳';

  useEffect(() => {
    if (!user) return;

    // Recent transactions query (limited)
    const recentQ = query(
      collection(db, 'expenses'),
      where('uid', '==', user.uid),
      orderBy('date', 'desc'),
      limit(20)
    );

    const unsubscribeRecent = onSnapshot(recentQ, (snapshot) => {
      setExpenses(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Expense)));
    });

    // Summary query (unlimited for the current month)
    const monthStart = startOfMonth(new Date());
    const summaryQ = query(
      collection(db, 'expenses'),
      where('uid', '==', user.uid),
      where('date', '>=', monthStart.toISOString())
    );

    const unsubscribeSummary = onSnapshot(summaryQ, (snapshot) => {
      const allMonthDocs = snapshot.docs.map(doc => doc.data() as Expense);
      
      const now = new Date();
      const todayStart = new Date().setHours(0, 0, 0, 0);
      const weekStart = startOfWeek(now).getTime();

      let today = 0, week = 0, month = 0;
      
      allMonthDocs.forEach(exp => {
        const amount = Number(exp.amount) || 0;
        const expDate = new Date(exp.date).getTime();
        
        // Month total
        month = Math.round((month + amount) * 100) / 100;
        
        // Week total
        if (expDate >= weekStart) {
          week = Math.round((week + amount) * 100) / 100;
        }
        
        // Today total
        if (expDate >= todayStart) {
          today = Math.round((today + amount) * 100) / 100;
        }
      });

      setSummary({ today, week, month });
    });

    return () => {
      unsubscribeRecent();
      unsubscribeSummary();
    };
  }, [user]);

  const budget = profile?.monthlyBudget || 0;
  const remaining = budget - summary.month;
  const progress = Math.min((summary.month / budget) * 100, 100);

  const chartData = expenses.reduce((acc: any[], exp) => {
    const existing = acc.find(item => item.name === exp.category);
    const amount = Number(exp.amount) || 0;
    if (existing) {
      existing.value = Math.round((existing.value + amount) * 100) / 100;
    } else {
      acc.push({ name: exp.category, value: amount });
    }
    return acc;
  }, []).slice(0, 5);

  const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  return (
    <div className="space-y-8 pb-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            Hi, <span className="text-indigo-600 dark:text-indigo-400">{profile?.name?.split(' ')[0] || 'User'}</span>
          </h1>
          <p className="text-muted text-sm font-medium">{format(new Date(), 'EEEE, d MMMM')}</p>
        </div>
        <motion.div 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="w-12 h-12 bg-card rounded-2xl shadow-soft border border-card-border flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-lg"
        >
          {profile?.name?.[0] || 'U'}
        </motion.div>
      </header>

      {/* Budget Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ y: -4 }}
        className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-700 p-7 rounded-[2.5rem] text-white shadow-vibrant relative overflow-hidden group"
      >
        <div className="relative z-10">
          <div className="flex justify-between items-start mb-6">
            <div>
              <p className="text-indigo-100/80 text-xs font-bold uppercase tracking-widest mb-1">Monthly Budget</p>
              <h2 className="text-4xl font-bold tracking-tight">{currencySymbol} {budget.toLocaleString()}</h2>
            </div>
            <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center">
              <Wallet size={24} className="text-white" />
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between text-sm font-bold">
              <span className="text-indigo-100">Spent: {currencySymbol}{summary.month.toLocaleString()}</span>
              <span className="text-indigo-100">Left: {currencySymbol}{remaining.toLocaleString()}</span>
            </div>
            <div className="h-3 bg-black/20 rounded-full overflow-hidden backdrop-blur-sm">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className={`h-full rounded-full ${progress > 90 ? 'bg-rose-400' : 'bg-white shadow-[0_0_15px_rgba(255,255,255,0.5)]'}`}
              />
            </div>
          </div>
        </div>
        
        {/* Decorative shapes */}
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:bg-white/20 transition-colors duration-500" />
        <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-purple-500/20 rounded-full blur-3xl group-hover:bg-purple-500/30 transition-colors duration-500" />
      </motion.div>

      {/* Summary Grid */}
      <div className="grid grid-cols-2 gap-5">
        <motion.div 
          whileHover={{ y: -2 }}
          className="bg-card p-5 rounded-[2rem] shadow-soft border border-card-border transition-all"
        >
          <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-3">
            <TrendingUp size={20} />
          </div>
          <p className="text-muted text-xs font-bold uppercase tracking-wider mb-1">Today</p>
          <p className="text-xl font-bold text-foreground">{currencySymbol} {summary.today.toLocaleString()}</p>
        </motion.div>
        
        <motion.div 
          whileHover={{ y: -2 }}
          className="bg-card p-5 rounded-[2rem] shadow-soft border border-card-border transition-all"
        >
          <div className="w-10 h-10 bg-blue-50 dark:bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400 mb-3">
            <TrendingDown size={20} />
          </div>
          <p className="text-muted text-xs font-bold uppercase tracking-wider mb-1">Weekly</p>
          <p className="text-xl font-bold text-foreground">{currencySymbol} {summary.week.toLocaleString()}</p>
        </motion.div>
      </div>

      {/* Chart Section */}
      {chartData.length > 0 && (
        <div className="bg-card p-6 rounded-[2.5rem] shadow-soft border border-card-border transition-all">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-foreground">Spending Analysis</h3>
            <div className="px-3 py-1 bg-indigo-50 dark:bg-indigo-500/10 rounded-full text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">
              Top 5
            </div>
          </div>
          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={85}
                  paddingAngle={8}
                  dataKey="value"
                  stroke="none"
                >
                  {chartData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={COLORS[index % COLORS.length]} 
                      className="hover:opacity-80 transition-opacity cursor-pointer"
                    />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(15, 23, 42, 0.9)', 
                    backdropFilter: 'blur(8px)',
                    border: 'none', 
                    borderRadius: '16px',
                    color: 'white',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                  }}
                  itemStyle={{ color: 'white', fontWeight: 'bold' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-3 mt-6">
            {chartData.map((item, index) => (
              <div key={item.name} className="flex items-center gap-2 bg-background/50 p-2 rounded-xl border border-card-border">
                <div className="w-2.5 h-2.5 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.1)]" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                <span className="text-[11px] text-slate-600 dark:text-slate-400 font-bold truncate">{item.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Transactions */}
      <div className="space-y-5">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-lg font-bold flex items-center gap-2 dark:text-white">
            <div className="w-8 h-8 bg-indigo-50 dark:bg-indigo-500/10 rounded-lg flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <Clock size={18} />
            </div>
            Recent Activity
          </h3>
          <button className="text-indigo-600 dark:text-indigo-400 text-xs font-bold hover:underline">
            View All
          </button>
        </div>

        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {expenses.slice(0, 5).map((exp, index) => {
              const categoryConfig = DEFAULT_CATEGORIES.find(c => c.name === exp.category);
              const Icon = categoryConfig?.icon || Tag;
              return (
                <motion.div
                  key={exp.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-card p-4 rounded-[1.5rem] shadow-soft border border-card-border flex items-center justify-between group hover:bg-background/80 transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm ${categoryConfig?.color || 'bg-slate-50 dark:bg-slate-800 text-muted'}`}>
                      <Icon size={24} />
                    </div>
                    <div>
                      <p className="font-bold text-foreground group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{exp.title}</p>
                      <p className="text-[11px] text-muted font-bold uppercase tracking-wider">{exp.category} • {format(new Date(exp.date), 'MMM d')}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-foreground text-lg">-{currencySymbol}{exp.amount.toLocaleString()}</p>
                    <div className="w-full h-1 bg-indigo-600/0 group-hover:bg-indigo-600/20 rounded-full mt-1 transition-all" />
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
          {expenses.length === 0 && (
            <div className="text-center py-12 bg-card rounded-[2.5rem] border border-dashed border-card-border">
              <div className="w-16 h-16 bg-background rounded-full flex items-center justify-center mx-auto mb-4 text-muted">
                <Clock size={32} />
              </div>
              <p className="text-foreground font-bold">No transactions yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
