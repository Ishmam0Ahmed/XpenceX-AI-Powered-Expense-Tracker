import { Home, List, Plus, PieChart, MessageSquare, User } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

interface LayoutProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function Layout({ activeTab, setActiveTab }: LayoutProps) {
  const tabs = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'expenses', icon: List, label: 'Expenses' },
    { id: 'add', icon: Plus, label: 'Add', isSpecial: true },
    { id: 'reports', icon: PieChart, label: 'Reports' },
    { id: 'chat', icon: MessageSquare, label: 'Chat' },
    { id: 'profile', icon: User, label: 'Profile' },
  ];

  return (
    <nav className="fixed bottom-6 left-4 right-4 bg-card/80 backdrop-blur-xl border border-card-border px-2 py-3 flex justify-between items-center z-50 rounded-[2.5rem] shadow-2xl transition-all duration-300">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;

        if (tab.isSpecial) {
          return (
            <div key={tab.id} className="flex-1 flex justify-center">
              <button
                onClick={() => setActiveTab(tab.id)}
                className="flex flex-col items-center justify-center bg-gradient-to-br from-indigo-600 to-purple-600 text-white w-14 h-14 rounded-2xl shadow-vibrant hover:scale-110 active:scale-90 transition-all duration-300"
              >
                <Icon size={28} />
              </button>
            </div>
          );
        }

        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex-1 flex flex-col items-center justify-center p-2 rounded-2xl transition-all duration-300 relative group min-w-0",
              isActive ? "text-indigo-600 dark:text-indigo-400" : "text-muted hover:text-foreground"
            )}
          >
            <Icon size={20} className={cn("transition-transform duration-300", isActive && "scale-110")} />
            <span className={cn(
              "text-[8px] mt-1 font-bold uppercase tracking-tighter transition-all duration-300 truncate w-full text-center",
              isActive ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1"
            )}>
              {tab.label}
            </span>
            {isActive && (
              <motion.div 
                layoutId="activeTab"
                className="absolute -top-1 w-1 h-1 bg-indigo-600 dark:bg-indigo-400 rounded-full"
              />
            )}
          </button>
        );
      })}
    </nav>
  );
}
