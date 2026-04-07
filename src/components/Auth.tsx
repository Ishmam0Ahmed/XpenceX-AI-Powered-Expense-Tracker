import { useState } from 'react';
import { auth, db } from '../firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { motion } from 'motion/react';
import { Wallet, Mail, Lock, User, ArrowRight } from 'lucide-react';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Convert username to internal email format
    const internalEmail = `${username.trim().toLowerCase()}@xpencex.com`;

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, internalEmail, password);
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, internalEmail, password);
        await updateProfile(userCredential.user, { displayName: name || username });
        
        // Create user profile in Firestore
        await setDoc(doc(db, 'users', userCredential.user.uid), {
          uid: userCredential.user.uid,
          email: internalEmail,
          username: username.trim(),
          name: name || username.trim(),
          currency: 'BDT',
          monthlyBudget: 5000,
          createdAt: new Date().toISOString(),
        });
      }
    } catch (err: any) {
      if (err.code === 'auth/invalid-credential') {
        setError('Invalid username or password.');
      } else if (err.code === 'auth/email-already-in-use') {
        setError('Username already taken.');
      } else if (err.code === 'auth/weak-password') {
        setError('Password should be at least 6 characters.');
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-6 py-12 transition-colors duration-300 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] bg-indigo-500/10 rounded-full blur-[120px]" />
        <div className="absolute -bottom-[10%] -right-[10%] w-[50%] h-[50%] bg-purple-500/10 rounded-full blur-[120px]" />
      </div>

      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="mb-10 flex flex-col items-center relative z-10"
      >
        <div className="w-24 h-24 bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-700 rounded-[2rem] flex items-center justify-center shadow-vibrant mb-6 rotate-12 group hover:rotate-0 transition-transform duration-500">
          <Wallet className="text-white -rotate-12 group-hover:rotate-0 transition-transform duration-500" size={48} />
        </div>
        <h1 className="text-5xl font-bold text-foreground tracking-tighter">
          Xpence<span className="text-indigo-600 dark:text-indigo-400">X</span>
        </h1>
        <p className="text-muted font-bold text-xs uppercase tracking-[0.3em] mt-2">By Ishmam Ahmed</p>
      </motion.div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="w-full max-w-sm bg-card/70 backdrop-blur-xl p-8 rounded-[3rem] shadow-soft border border-card-border transition-all relative z-10"
      >
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-foreground tracking-tight">{isLogin ? 'Welcome Back' : 'Join XpenceX'}</h2>
          <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            {isLogin ? <Lock size={20} /> : <User size={20} />}
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-5">
          {!isLogin && (
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted uppercase tracking-widest px-1">Full Name</label>
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={20} />
                <input
                  type="text"
                  placeholder="John Doe"
                  className="w-full pl-12 pr-4 py-4 bg-background/50 rounded-2xl border-2 border-transparent focus:border-indigo-600/20 focus:bg-background outline-none transition-all text-foreground font-medium"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            </div>
          )}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted uppercase tracking-widest px-1">Username</label>
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={20} />
              <input
                type="text"
                placeholder="ishmam_ahmed"
                className="w-full pl-12 pr-4 py-4 bg-background/50 rounded-2xl border-2 border-transparent focus:border-indigo-600/20 focus:bg-background outline-none transition-all text-foreground font-medium"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted uppercase tracking-widest px-1">Password</label>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={20} />
              <input
                type="password"
                placeholder="••••••••"
                className="w-full pl-12 pr-4 py-4 bg-background/50 rounded-2xl border-2 border-transparent focus:border-indigo-600/20 focus:bg-background outline-none transition-all text-foreground font-medium"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          {error && (
            <motion.p 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-rose-500 text-xs font-bold px-2"
            >
              {error}
            </motion.p>
          )}

          <motion.button
            type="submit"
            disabled={loading}
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            className="w-full py-5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-[2rem] font-bold shadow-vibrant hover:shadow-indigo-500/40 disabled:opacity-50 disabled:shadow-none transition-all flex items-center justify-center gap-3 text-lg mt-4"
          >
            {loading ? 'Processing...' : (isLogin ? 'Login' : 'Sign Up')}
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
              <ArrowRight size={18} />
            </div>
          </motion.button>
        </form>

        <div className="mt-10 text-center">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-muted text-sm font-bold hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
          >
            {isLogin ? (
              <>Don't have an account? <span className="text-indigo-600 dark:text-indigo-400 underline underline-offset-4">Sign Up</span></>
            ) : (
              <>Already have an account? <span className="text-indigo-600 dark:text-indigo-400 underline underline-offset-4">Login</span></>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
