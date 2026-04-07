import { useState, useEffect, useRef } from 'react';
import { db } from '../firebase';
import { collection, addDoc, query, where, onSnapshot } from 'firebase/firestore';
import { useAuth } from '../App';
import { ChatMessage, Category, Expense } from '../types';
import { processInput, processAudioInput, scanReceipt } from '../services/geminiService';
import { motion, AnimatePresence } from 'motion/react';
import { Mic, Send, Camera, Image as ImageIcon, X, Check, Edit2, Loader2, Bot, User, MessageSquare } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { format } from 'date-fns';
import { DEFAULT_CATEGORIES, MAJOR_CURRENCIES } from '../constants';

export default function AIChat() {
  const { user, profile } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [pendingExpense, setPendingExpense] = useState<Partial<Expense> | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const currencySymbol = MAJOR_CURRENCIES.find(c => c.code === profile?.currency)?.symbol || '৳';

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'categories'), where('uid', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const customCats = snapshot.docs.map(doc => doc.data().name);
      setCategories([...DEFAULT_CATEGORIES.map(c => c.name), ...customCats]);
    });
    return unsubscribe;
  }, [user]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const addMessage = (role: 'user' | 'assistant', content: string, type: ChatMessage['type'] = 'text', pending?: Partial<Expense>) => {
    const newMessage: ChatMessage = {
      id: Math.random().toString(36).substr(2, 9),
      role,
      content,
      timestamp: Date.now(),
      type,
      pendingExpense: pending
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const handleSend = async (text: string = input) => {
    if (!text.trim() || loading) return;

    const userText = text.trim();
    setInput('');
    addMessage('user', userText);
    setLoading(true);

    try {
      const result = await processInput(userText, categories);
      
      if (result.type === 'expense' && result.expense) {
        if (result.expense.category === 'INVALID') {
          addMessage('assistant', "This category does not exist. Please add it manually first.", 'error');
        } else {
          addMessage('assistant', `I've prepared an expense entry for you. Please confirm the details:`, 'expense_confirmation', result.expense);
          setPendingExpense(result.expense);
        }
      } else {
        addMessage('assistant', result.content);
      }
    } catch (error) {
      addMessage('assistant', "I'm sorry, I encountered an error processing your request.", 'error');
    } finally {
      setLoading(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64Audio = reader.result as string;
          setLoading(true);
          addMessage('user', "🎤 *Voice message sent*");
          
          try {
            const result = await processAudioInput(base64Audio, 'audio/webm', categories);
            if (result.type === 'expense' && result.expense) {
              if (result.expense.category === 'INVALID') {
                addMessage('assistant', "This category does not exist. Please add it manually first.", 'error');
              } else {
                addMessage('assistant', `I've prepared an expense entry from your voice. Please confirm:`, 'expense_confirmation', result.expense);
                setPendingExpense(result.expense);
              }
            } else {
              addMessage('assistant', result.content);
            }
          } catch (error) {
            addMessage('assistant', "I couldn't process the audio. Please try again.", 'error');
          } finally {
            setLoading(false);
          }
        };
        reader.readAsDataURL(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Error starting recording:", error);
      alert("Could not access microphone. Please check permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleVoiceInput = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    addMessage('user', "Scanning receipt...");

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      const result = await scanReceipt(base64, categories);
      if (result) {
        addMessage('assistant', "I've extracted the following details from your receipt:", 'expense_confirmation', result);
        setPendingExpense(result);
      } else {
        addMessage('assistant', "I couldn't read the receipt clearly. Please try again or enter manually.", 'error');
      }
      setLoading(false);
    };
    reader.readAsDataURL(file);
  };

  const confirmExpense = async (expense: Partial<Expense>) => {
    if (!user) return;
    try {
      await addDoc(collection(db, 'expenses'), {
        uid: user.uid,
        title: expense.title,
        amount: expense.amount,
        category: expense.category,
        date: expense.date || new Date().toISOString(),
        notes: expense.notes || '',
        createdAt: new Date().toISOString(),
      });
      addMessage('assistant', `✅ Expense saved: **${expense.title}** for **${currencySymbol}${expense.amount}**.`);
      setPendingExpense(null);
    } catch (error) {
      addMessage('assistant', "Failed to save expense. Please try again.", 'error');
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-160px)] bg-card/50 backdrop-blur-xl rounded-[2.5rem] shadow-soft border border-card-border overflow-hidden transition-all">
      <header className="bg-gradient-to-r from-indigo-600 to-purple-600 p-5 text-white flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-inner">
            <Bot size={28} />
          </div>
          <div>
            <h2 className="font-bold text-lg tracking-tight">XpenceX AI</h2>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              <p className="text-[10px] text-indigo-100 uppercase tracking-[0.2em] font-bold">Online</p>
            </div>
          </div>
        </div>
        <button className="p-2 hover:bg-white/10 rounded-xl transition-colors">
          <MessageSquare size={20} />
        </button>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-6 no-scrollbar">
        {messages.length === 0 && (
          <div className="text-center py-12 space-y-6">
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-20 h-20 bg-indigo-50 dark:bg-indigo-500/10 rounded-[2rem] flex items-center justify-center mx-auto text-indigo-600 dark:text-indigo-400 shadow-soft"
            >
              <Bot size={40} />
            </motion.div>
            <div className="space-y-2">
              <h3 className="font-bold text-xl text-foreground tracking-tight">How can I help you?</h3>
              <p className="text-sm text-muted px-10 leading-relaxed">
                I can help you track expenses, analyze spending, or give budget advice.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-2 px-4">
              {["I spent 200 on food", "Show my weekly report", "Give me budget advice"].map((hint, i) => (
                <button 
                  key={i}
                  onClick={() => handleSend(hint)}
                  className="p-3 bg-card rounded-2xl text-xs font-bold text-muted border border-card-border hover:border-indigo-600 transition-all text-left"
                >
                  "{hint}"
                </button>
              ))}
            </div>
          </div>
        )}

        <AnimatePresence mode="popLayout">
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[85%] space-y-2 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div className={`p-4 rounded-[1.8rem] shadow-sm ${
                  msg.role === 'user' 
                    ? 'bg-gradient-to-br from-indigo-600 to-indigo-700 text-white rounded-tr-none' 
                    : 'bg-card text-foreground rounded-tl-none border border-card-border'
                }`}>
                  <div className="prose prose-sm prose-indigo dark:prose-invert max-w-none font-medium leading-relaxed">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                </div>
                
                {msg.type === 'expense_confirmation' && msg.pendingExpense && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-card p-5 rounded-[2rem] shadow-soft border border-card-border text-foreground space-y-4 w-full"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                        <Check size={20} />
                      </div>
                      <h4 className="font-bold">Confirm Transaction</h4>
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between items-center bg-background/50 p-3 rounded-xl">
                        <span className="text-[10px] font-bold text-muted uppercase tracking-wider">Title</span>
                        <span className="font-bold text-sm">{msg.pendingExpense.title}</span>
                      </div>
                      <div className="flex justify-between items-center bg-background/50 p-3 rounded-xl">
                        <span className="text-[10px] font-bold text-muted uppercase tracking-wider">Amount</span>
                        <span className="font-bold text-indigo-600 dark:text-indigo-400">{currencySymbol}{msg.pendingExpense.amount}</span>
                      </div>
                      <div className="flex justify-between items-center bg-background/50 p-3 rounded-xl">
                        <span className="text-[10px] font-bold text-muted uppercase tracking-wider">Category</span>
                        <span className="bg-indigo-600 text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">{msg.pendingExpense.category}</span>
                      </div>
                    </div>
                    
                    <div className="flex gap-3 pt-2">
                      <button
                        onClick={() => confirmExpense(msg.pendingExpense!)}
                        className="flex-1 py-3 bg-indigo-600 text-white rounded-2xl text-sm font-bold shadow-vibrant hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => addMessage('assistant', "Okay, let's try again. What was the expense?")}
                        className="flex-1 py-3 bg-slate-100 dark:bg-slate-700 text-muted rounded-2xl text-sm font-bold hover:bg-slate-200 dark:hover:bg-slate-600 transition-all"
                      >
                        Edit
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {loading && (
          <div className="flex justify-start">
            <div className="bg-card p-4 rounded-[1.5rem] rounded-tl-none border border-card-border">
              <Loader2 className="animate-spin text-indigo-600 dark:text-indigo-400" size={20} />
            </div>
          </div>
        )}
      </div>

      <div className="p-5 bg-card/80 backdrop-blur-md border-t border-card-border">
        <div className="flex items-center gap-2 bg-background/50 p-2 rounded-[2rem] border border-transparent focus-within:border-indigo-600/30 focus-within:bg-card transition-all shadow-inner">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => fileInputRef.current?.click()}
            className="p-3 text-slate-400 hover:text-indigo-600 transition-colors"
          >
            <Camera size={22} />
          </motion.button>
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            onChange={handleFileUpload}
          />
          <input
            type="text"
            placeholder="Ask me anything..."
            className="flex-1 bg-transparent border-none focus:ring-0 outline-none text-sm py-2 text-foreground font-medium"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          />
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleVoiceInput}
            className={`p-3 rounded-full transition-all ${isRecording ? 'bg-rose-500 text-white shadow-lg animate-pulse' : 'text-slate-400 hover:text-indigo-600'}`}
          >
            <Mic size={22} />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleSend()}
            disabled={!input.trim() || loading}
            className="p-3 bg-indigo-600 text-white rounded-2xl shadow-vibrant disabled:opacity-50 disabled:shadow-none transition-all"
          >
            <Send size={20} />
          </motion.button>
        </div>
      </div>
    </div>
  );
}
