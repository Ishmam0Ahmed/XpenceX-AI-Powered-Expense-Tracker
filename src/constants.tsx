import { 
  HeartPulse, 
  GraduationCap, 
  Zap, 
  Home, 
  Plane, 
  Sparkles, 
  Utensils, 
  Car, 
  ShoppingBag, 
  FileText, 
  Clapperboard, 
  MoreHorizontal 
} from 'lucide-react';

export const MAJOR_CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'CHF', symbol: 'Fr', name: 'Swiss Franc' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'BDT', symbol: '৳', name: 'Bangladeshi Taka' },
];

export const DEFAULT_CATEGORIES = [
  { name: 'Food', icon: Utensils, color: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400' },
  { name: 'Transport', icon: Car, color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' },
  { name: 'Shopping', icon: ShoppingBag, color: 'bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400' },
  { name: 'Bills', icon: FileText, color: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' },
  { name: 'Entertainment', icon: Clapperboard, color: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400' },
  { name: 'Health', icon: HeartPulse, color: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' },
  { name: 'Education', icon: GraduationCap, color: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400' },
  { name: 'Utilities', icon: Zap, color: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400' },
  { name: 'Housing', icon: Home, color: 'bg-cyan-100 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400' },
  { name: 'Travel', icon: Plane, color: 'bg-teal-100 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400' },
  { name: 'Personal Care', icon: Sparkles, color: 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400' },
  { name: 'Other', icon: MoreHorizontal, color: 'bg-slate-100 text-slate-600 dark:bg-slate-900/30 dark:text-slate-400' },
];
