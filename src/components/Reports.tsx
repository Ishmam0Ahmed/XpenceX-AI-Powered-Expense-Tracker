import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { useAuth } from '../App';
import { Expense } from '../types';
import { motion } from 'motion/react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { format, startOfMonth, subMonths, eachMonthOfInterval } from 'date-fns';
import { MAJOR_CURRENCIES } from '../constants';

export default function Reports() {
  const { user, profile, isDarkMode } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);

  const currencySymbol = MAJOR_CURRENCIES.find(c => c.code === profile?.currency)?.symbol || '৳';

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'expenses'), where('uid', '==', user.uid), orderBy('date', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setExpenses(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Expense)));
    });
    return unsubscribe;
  }, [user]);

  const monthlyData = eachMonthOfInterval({
    start: subMonths(new Date(), 5),
    end: new Date()
  }).map(month => {
    const monthStr = format(month, 'MMM');
    const total = expenses
      .filter(exp => format(new Date(exp.date), 'MMM yyyy') === format(month, 'MMM yyyy'))
      .reduce((sum, exp) => sum + exp.amount, 0);
    return { name: monthStr, total };
  });

  const categoryData = expenses.reduce((acc: any[], exp) => {
    const existing = acc.find(item => item.name === exp.category);
    if (existing) {
      existing.value += exp.amount;
    } else {
      acc.push({ name: exp.category, value: exp.amount });
    }
    return acc;
  }, []).sort((a, b) => b.value - a.value);

  const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  return (
    <div className="space-y-6 pb-6">
      <header>
        <h1 className="text-2xl font-bold text-foreground">Financial Reports</h1>
        <p className="text-muted text-sm font-medium">Insights into your spending</p>
      </header>

      {/* Monthly Trend */}
      <div className="bg-card p-6 rounded-3xl shadow-sm border border-card-border transition-colors">
        <h3 className="text-lg font-bold mb-6 text-foreground">Monthly Spending</h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? '#334155' : '#e2e8f0'} />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
              <Tooltip
                cursor={{ fill: isDarkMode ? '#1e293b' : '#f8fafc' }}
                contentStyle={{ 
                  backgroundColor: isDarkMode ? '#1e1e1e' : '#ffffff', 
                  borderRadius: '12px', 
                  border: isDarkMode ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.05)', 
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  color: isDarkMode ? '#ffffff' : '#000000'
                }}
              />
              <Bar dataKey="total" radius={[6, 6, 0, 0]}>
                {monthlyData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={index === monthlyData.length - 1 ? '#4f46e5' : (isDarkMode ? '#1e293b' : '#e2e8f0')} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="bg-card p-6 rounded-3xl shadow-sm border border-card-border transition-colors">
        <h3 className="text-lg font-bold mb-6 text-foreground">Category Breakdown</h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={5}
                dataKey="value"
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: isDarkMode ? '#1e1e1e' : '#ffffff', 
                  borderRadius: '12px', 
                  border: isDarkMode ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.05)',
                  color: isDarkMode ? '#ffffff' : '#000000'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="space-y-3 mt-6">
          {categoryData.map((item, index) => (
            <div key={item.name} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                <span className="text-sm font-bold text-muted">{item.name}</span>
              </div>
              <div className="text-right">
                <span className="text-sm font-bold text-foreground">{currencySymbol} {item.value.toLocaleString()}</span>
                <span className="text-[10px] text-muted font-bold ml-2">
                  {((item.value / expenses.reduce((s, e) => s + e.amount, 0)) * 100).toFixed(1)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
