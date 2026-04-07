export interface UserProfile {
  uid: string;
  name?: string;
  email: string;
  photoURL?: string;
  monthlyBudget?: number;
  currency?: string;
}

export interface Expense {
  id: string;
  uid: string;
  title: string;
  amount: number;
  category: string;
  date: string;
  notes?: string;
}

export interface Category {
  id: string;
  uid: string;
  name: string;
  icon?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  type?: 'text' | 'expense_confirmation' | 'error';
  pendingExpense?: Partial<Expense>;
}
