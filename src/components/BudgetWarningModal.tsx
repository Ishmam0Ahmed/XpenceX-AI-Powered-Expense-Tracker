import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, Check, X } from 'lucide-react';
import { cn } from '../lib/utils';

interface BudgetWarningModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  budget: number;
  currentTotal: number;
  newExpenseAmount: number;
  currency: string;
}

export default function BudgetWarningModal({
  isOpen,
  onConfirm,
  onCancel,
  budget,
  currentTotal,
  newExpenseAmount,
  currency
}: BudgetWarningModalProps) {
  const afterExpense = currentTotal + newExpenseAmount;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onCancel}
          />
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative bg-card w-full max-w-sm p-8 rounded-[2.5rem] border border-card-border shadow-2xl space-y-8"
          >
            <div className="w-20 h-20 bg-amber-50 dark:bg-amber-500/10 rounded-[2rem] flex items-center justify-center mx-auto text-amber-500 shadow-inner">
              <AlertTriangle size={40} />
            </div>

            <div className="text-center space-y-3">
              <h3 className="text-2xl font-bold text-foreground tracking-tight">Budget Exceeded ⚠️</h3>
              <p className="text-sm text-muted leading-relaxed">
                You are about to exceed your monthly budget.
              </p>
            </div>

            <div className="bg-background/50 rounded-3xl p-6 border border-card-border space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-muted uppercase tracking-widest">Budget</span>
                <span className="font-bold text-foreground">{currency} {budget.toLocaleString()}</span>
              </div>
              <div className="h-px bg-card-border" />
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-muted uppercase tracking-widest">After this expense</span>
                <span className="font-bold text-rose-500">{currency} {afterExpense.toLocaleString()}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={onCancel}
                className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-muted rounded-2xl font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                className="flex-1 py-4 bg-amber-500 text-white rounded-2xl font-bold shadow-lg shadow-amber-500/30 hover:bg-amber-600 transition-all flex items-center justify-center gap-2"
              >
                Add Anyway
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
