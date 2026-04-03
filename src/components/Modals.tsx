import React, { useState } from 'react';
import { 
  X, 
  TrendingUp, 
  Globe, 
  Loader2,
  Bell,
  BookOpen
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { toast } from 'sonner';
import { 
  auth, 
  db, 
  googleProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  User
} from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import ReactMarkdown from 'react-markdown';
import { StockData } from '../types';

export const AlertModal = ({ stock, isOpen, onClose, onAdd }: { stock: StockData, isOpen: boolean, onClose: () => void, onAdd: (symbol: string, price: number, type: 'above' | 'below') => void }) => {
  const [price, setPrice] = useState('');
  const [type, setType] = useState<'above' | 'below'>('above');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-card border border-border p-8 rounded-[2rem] w-full max-w-md relative"
      >
        <button onClick={onClose} className="absolute top-6 right-6 text-gray-500 hover:text-foreground">
          <X size={20} />
        </button>
        <h3 className="text-2xl font-bold mb-2 text-foreground">Set Price Alert</h3>
        <p className="text-gray-500 text-sm mb-8">Notify me when {stock.symbol} goes {type} a specific price.</p>
        
        <div className="space-y-6">
          <div className="flex bg-foreground/5 p-1 rounded-xl">
            <button 
              onClick={() => setType('above')}
              className={cn("flex-1 py-2 text-xs font-bold rounded-lg transition-all", type === 'above' ? "bg-foreground text-background" : "text-gray-500 hover:text-foreground")}
            >
              ABOVE
            </button>
            <button 
              onClick={() => setType('below')}
              className={cn("flex-1 py-2 text-xs font-bold rounded-lg transition-all", type === 'below' ? "bg-foreground text-background" : "text-gray-500 hover:text-foreground")}
            >
              BELOW
            </button>
          </div>

          <div>
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-2">Target Price (₦)</label>
            <input 
              type="number" 
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="e.g. 45.50"
              className="w-full bg-foreground/5 border border-border rounded-xl py-3 px-4 text-foreground focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500/50"
            />
          </div>

          <button 
            onClick={() => {
              const p = parseFloat(price);
              if (!isNaN(p)) {
                onAdd(stock.symbol, p, type);
                onClose();
              }
            }}
            disabled={!price}
            className="w-full py-4 bg-green-400 text-black font-bold rounded-xl hover:bg-green-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Create Alert
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export const CompareModal = ({ stock, isOpen, onClose, onCompare }: { stock: StockData, isOpen: boolean, onClose: () => void, onCompare: (symbol1: string, symbol2: string) => void }) => {
  const [symbol2, setSymbol2] = useState('');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-card border border-border p-6 md:p-8 rounded-2xl md:rounded-[2rem] w-full max-w-md relative"
      >
        <button onClick={onClose} className="absolute top-4 right-4 md:top-6 md:right-6 text-gray-500 hover:text-foreground">
          <X size={20} />
        </button>
        <h3 className="text-xl md:text-2xl font-bold mb-2 text-foreground">Compare Stocks</h3>
        <p className="text-gray-500 text-xs md:text-sm mb-6 md:mb-8">Compare {stock.symbol} with another NGX listed company.</p>
        
        <div className="space-y-6">
          <div>
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-2">Second Stock Symbol</label>
            <input 
              type="text" 
              value={symbol2}
              onChange={(e) => setSymbol2(e.target.value.toUpperCase())}
              placeholder="e.g. ZENITHBANK"
              className="w-full bg-foreground/5 border border-border rounded-xl py-3 px-4 text-foreground focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500/50 uppercase"
              autoFocus
            />
          </div>

          <button 
            onClick={() => {
              if (symbol2.trim()) {
                onCompare(stock.symbol, symbol2.trim());
                onClose();
                setSymbol2('');
              }
            }}
            disabled={!symbol2.trim()}
            className="w-full py-4 bg-green-500 text-white font-bold rounded-2xl hover:bg-green-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Compare Now
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export const LessonModal = ({ lesson, isOpen, onClose }: { lesson: any, isOpen: boolean, onClose: () => void }) => {
  if (!isOpen || !lesson) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-card border border-border p-0 rounded-2xl md:rounded-[2.5rem] w-full max-w-4xl max-h-[90vh] overflow-hidden relative flex flex-col"
      >
        <div className="p-4 md:p-8 border-b border-border flex justify-between items-center bg-foreground/5">
          <div className="flex items-center gap-3 md:gap-4">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-500/10 text-blue-500 rounded-xl md:rounded-2xl flex items-center justify-center shrink-0">
              {lesson.icon}
            </div>
            <div>
              <h3 className="text-lg md:text-2xl font-bold text-foreground line-clamp-1">{lesson.title}</h3>
              <div className="flex items-center gap-2 md:gap-3 text-[10px] md:text-xs text-gray-500 mt-0.5 md:mt-1">
                <span className="px-2 py-0.5 bg-blue-500/10 text-blue-500 rounded-full border border-blue-500/20 font-bold uppercase">{lesson.level}</span>
                <span>•</span>
                <span>{lesson.time}</span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-foreground/10 rounded-full transition-colors text-gray-500 hover:text-foreground">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6 md:p-10 overflow-y-auto flex-1 custom-scrollbar">
          <div className="prose prose-invert max-w-none text-gray-400 leading-relaxed text-base md:text-lg">
            <ReactMarkdown>{lesson.fullContent || lesson.content}</ReactMarkdown>
          </div>
        </div>

        <div className="p-4 md:p-8 border-t border-border bg-foreground/5 flex justify-end">
          <button 
            onClick={onClose}
            className="w-full md:w-auto px-8 py-3 bg-foreground text-background font-bold rounded-xl md:rounded-2xl hover:opacity-90 transition-all"
          >
            Finished Reading
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export const AuthModal = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
        toast.success("Welcome back!");
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName });
        toast.success("Account created successfully!");
      }
      onClose();
    } catch (error: any) {
      console.error("Auth error", error);
      toast.error(error.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
      toast.success("Logged in with Google!");
      onClose();
    } catch (error: any) {
      console.error("Google login failed", error);
      toast.error(error.message || "Google login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-md bg-card border border-border rounded-2xl md:rounded-3xl shadow-2xl overflow-hidden p-6 md:p-8"
      >
        <div className="text-center mb-6 md:mb-8">
          <div className="w-12 h-12 bg-green-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <TrendingUp size={24} className="text-white" />
          </div>
          <h2 className="text-2xl font-bold">{isLogin ? 'Welcome Back' : 'Join NGX Intel'}</h2>
          <p className="text-gray-500 text-sm mt-1">
            {isLogin ? 'Sign in to access your portfolio' : 'Start your investment journey today'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Full Name</label>
              <input 
                required
                type="text" 
                placeholder="John Doe"
                className="w-full bg-foreground/5 border border-border rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500/50 transition-all"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </div>
          )}
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Email Address</label>
            <input 
              required
              type="email" 
              placeholder="name@example.com"
              className="w-full bg-foreground/5 border border-border rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500/50 transition-all"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Password</label>
            <input 
              required
              type="password" 
              placeholder="••••••••"
              className="w-full bg-foreground/5 border border-border rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500/50 transition-all"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button 
            disabled={loading}
            type="submit"
            className="w-full py-4 bg-green-500 text-white font-bold rounded-xl hover:bg-green-600 transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : (isLogin ? 'Sign In' : 'Create Account')}
          </button>
        </form>

        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-gray-500 font-bold tracking-widest">Or continue with</span>
          </div>
        </div>

        <button 
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full py-4 bg-foreground/5 border border-border text-foreground font-bold rounded-xl hover:bg-foreground/10 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
        >
          <Globe size={18} /> Google Account
        </button>

        <p className="text-center text-sm text-gray-500 mt-8">
          {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
          <button 
            onClick={() => setIsLogin(!isLogin)}
            className="text-green-500 font-bold hover:underline"
          >
            {isLogin ? 'Sign Up' : 'Log In'}
          </button>
        </p>
      </motion.div>
    </div>
  );
};

export const FeedbackModal = ({ isOpen, onClose, user }: { isOpen: boolean, onClose: () => void, user: User | null }) => {
  const [type, setType] = useState<'suggestion' | 'issue'>('suggestion');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("You must be logged in to submit feedback");
      return;
    }
    if (!message.trim()) {
      toast.error("Please enter a message");
      return;
    }

    setLoading(true);
    try {
      await addDoc(collection(db, 'feedback'), {
        uid: user.uid,
        email: user.email,
        type,
        message,
        createdAt: serverTimestamp()
      });
      toast.success("Thank you for your feedback!");
      setMessage('');
      onClose();
    } catch (error: any) {
      console.error("Feedback submission error", error);
      toast.error("Failed to submit feedback. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-md bg-card border border-border rounded-2xl md:rounded-3xl shadow-2xl overflow-hidden p-6 md:p-8"
      >
        <div className="text-center mb-6 md:mb-8">
          <div className="w-12 h-12 bg-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Bell size={24} className="text-white" />
          </div>
          <h2 className="text-2xl font-bold">Share Your Feedback</h2>
          <p className="text-gray-500 text-sm mt-1">
            Help us improve NGX Intel with your suggestions or report issues.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex gap-2 p-1 bg-foreground/5 rounded-xl">
            <button
              type="button"
              onClick={() => setType('suggestion')}
              className={cn(
                "flex-1 py-2 text-xs font-bold rounded-lg transition-all",
                type === 'suggestion' ? "bg-card text-foreground shadow-sm" : "text-gray-500 hover:text-foreground"
              )}
            >
              Suggestion
            </button>
            <button
              type="button"
              onClick={() => setType('issue')}
              className={cn(
                "flex-1 py-2 text-xs font-bold rounded-lg transition-all",
                type === 'issue' ? "bg-card text-foreground shadow-sm" : "text-gray-500 hover:text-foreground"
              )}
            >
              Report Issue
            </button>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Message</label>
            <textarea 
              required
              rows={4}
              placeholder={type === 'suggestion' ? "What features would you like to see?" : "Describe the issue you encountered..."}
              className="w-full bg-foreground/5 border border-border rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all resize-none"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>

          <div className="flex gap-3">
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 py-4 bg-foreground/5 text-foreground font-bold rounded-xl hover:bg-foreground/10 transition-all"
            >
              Cancel
            </button>
            <button 
              disabled={loading}
              type="submit"
              className="flex-[2] py-4 bg-blue-500 text-white font-bold rounded-xl hover:bg-blue-600 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : 'Submit Feedback'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
