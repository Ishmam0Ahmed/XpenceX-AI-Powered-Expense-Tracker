import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { FileText, Check, X, Edit2, Trash2, AlertCircle } from 'lucide-react';
import { Expense } from '../types';

interface ExcelImportReviewProps {
  isOpen: boolean;
  data: Partial<Expense>[];
  onConfirm: (finalData: Partial<Expense>[]) => void;
  onCancel: () => void;
  currency: string;
}

export default function ExcelImportReview({
  isOpen,
  data,
  onConfirm,
  onCancel,
  currency
}: ExcelImportReviewProps) {
  const [items, setItems] = useState<Partial<Expense>[]>(data);

  // Sync state if data changes from props (initial load)
  React.useEffect(() => {
    setItems(data);
  }, [data]);

  const handleRemove = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleEdit = (index: number, field: string, value: any) => {
    setItems(prev => prev.map((item, i) => i === index ? { ...item, [field]: value } : item));
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/70 backdrop-blur-md"
            onClick={onCancel}
          />
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 50 }}
            className="relative bg-card w-full max-w-lg h-[85vh] flex flex-col rounded-[3rem] border border-card-border shadow-2xl overflow-hidden"
          >
            <header className="p-8 border-b border-card-border flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold text-foreground tracking-tight">Review Import</h3>
                <p className="text-muted text-sm">{items.length} sessions detected</p>
              </div>
              <button onClick={onCancel} className="p-3 bg-background rounded-2xl text-muted hover:text-foreground">
                <X size={24} />
              </button>
            </header>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar">
              {items.length === 0 ? (
                <div className="text-center py-20 space-y-4">
                  <AlertCircle size={48} className="mx-auto text-muted" />
                  <p className="text-muted font-bold">No valid expenses found to import.</p>
                </div>
              ) : (
                items.map((item, index) => (
                  <div key={index} className="bg-background/50 p-6 rounded-[2rem] border border-card-border space-y-4 group relative">
                    <button 
                      onClick={() => handleRemove(index)}
                      className="absolute top-4 right-4 p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 size={16} />
                    </button>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-muted uppercase tracking-widest">Title</label>
                        <input 
                          value={item.title} 
                          onChange={(e) => handleEdit(index, 'title', e.target.value)}
                          className="w-full bg-transparent font-bold text-foreground outline-none border-b border-transparent focus:border-indigo-600/30"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-muted uppercase tracking-widest">Amount ({currency})</label>
                        <input 
                          type="number"
                          value={item.amount} 
                          onChange={(e) => handleEdit(index, 'amount', Number(parseFloat(e.target.value).toFixed(2)))}
                          className="w-full bg-transparent font-bold text-indigo-600 dark:text-indigo-400 outline-none border-b border-transparent focus:border-indigo-600/30"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-muted uppercase tracking-widest">Category</label>
                        <input 
                          value={item.category} 
                          onChange={(e) => handleEdit(index, 'category', e.target.value)}
                          className="w-full bg-transparent text-sm font-medium text-foreground outline-none border-b border-transparent focus:border-indigo-600/30"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-muted uppercase tracking-widest">Date</label>
                        <p className="text-sm text-foreground font-medium">{new Date(item.date!).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <footer className="p-8 bg-background/80 backdrop-blur-md border-t border-card-border flex gap-4">
              <button
                onClick={onCancel}
                className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-muted rounded-2xl font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
              >
                Cancel
              </button>
              <button
                disabled={items.length === 0}
                onClick={() => onConfirm(items)}
                className="flex-3 py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-vibrant hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                Confirm Import & Save
                <Check size={20} />
              </button>
            </footer>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
