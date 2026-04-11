import React, { useState } from 'react';
import { X, Bell, TrendingUp, TrendingDown, Info, MessageSquare, Shield, Zap, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { StockData, PriceAlert, UserProfile } from '../types';
import { cn } from '../lib/utils';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { toast } from 'sonner';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
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
            className="relative w-full max-w-lg bg-card border border-border rounded-[2.5rem] shadow-2xl overflow-hidden"
          >
            <div className="flex items-center justify-between p-8 border-b border-border">
              <h3 className="text-xl font-bold">{title}</h3>
              <button onClick={onClose} className="p-2 hover:bg-foreground/5 rounded-xl transition-all">
                <X size={20} className="text-gray-500" />
              </button>
            </div>
            <div className="p-8">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export const AlertModal: React.FC<{
  stock: StockData;
  isOpen: boolean;
  onClose: () => void;
  onAdd: (symbol: string, targetValue: number, type: string, params?: any) => void;
}> = ({ stock, isOpen, onClose, onAdd }) => {
  const [type, setType] = useState('price_above');
  const [value, setValue] = useState('');
  const [maPeriod, setMaPeriod] = useState('50');

  const handleAdd = () => {
    const numValue = parseFloat(value);
    if (isNaN(numValue) && !type.startsWith('ma_cross')) {
      toast.error("Please enter a valid number");
      return;
    }
    onAdd(stock.symbol, numValue || 0, type, type.startsWith('ma_cross') ? { maPeriod: parseInt(maPeriod) } : undefined);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Set Alert for ${stock.symbol}`}>
      <div className="space-y-6">
        <div className="space-y-2">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Alert Type</label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: 'price_above', label: 'Price Above' },
              { id: 'price_below', label: 'Price Below' },
              { id: 'gain_above', label: 'Daily Gain >' },
              { id: 'loss_above', label: 'Daily Loss >' },
              { id: 'ma_cross_above', label: 'MA Cross Above' },
              { id: 'ma_cross_below', label: 'MA Cross Below' },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setType(t.id)}
                className={cn(
                  "p-3 rounded-xl border text-[10px] font-bold uppercase tracking-widest transition-all",
                  type === t.id 
                    ? "bg-green-500/10 border-green-500/30 text-green-500" 
                    : "bg-foreground/5 border-transparent text-gray-500 hover:bg-foreground/10"
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {type.startsWith('ma_cross') ? (
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Moving Average Period</label>
            <select 
              value={maPeriod}
              onChange={(e) => setMaPeriod(e.target.value)}
              className="w-full bg-foreground/5 border border-border rounded-xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20"
            >
              <option value="20">20 Day MA</option>
              <option value="50">50 Day MA</option>
              <option value="100">100 Day MA</option>
              <option value="200">200 Day MA</option>
            </select>
          </div>
        ) : (
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">
              {type.includes('price') ? 'Target Price (₦)' : 'Percentage (%)'}
            </label>
            <input
              type="number"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={type.includes('price') ? "e.g. 50.50" : "e.g. 5"}
              className="w-full bg-foreground/5 border border-border rounded-xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20"
            />
          </div>
        )}

        <button
          onClick={handleAdd}
          className="w-full py-4 bg-green-500 text-white font-bold rounded-2xl hover:bg-green-600 transition-all shadow-lg shadow-green-500/20"
        >
          Create Smart Alert
        </button>
      </div>
    </Modal>
  );
};

export const CompareModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  stock: StockData;
  onCompare: (symbol1: string, symbol2: string) => void;
}> = ({ isOpen, onClose, stock, onCompare }) => {
  const [compareSymbol, setCompareSymbol] = useState('');

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Compare ${stock.symbol}`}>
      <div className="space-y-6">
        <p className="text-sm text-gray-500">Enter another stock symbol to compare performance, valuation, and metrics.</p>
        <div className="space-y-2">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Compare With</label>
          <input
            type="text"
            value={compareSymbol}
            onChange={(e) => setCompareSymbol(e.target.value.toUpperCase())}
            placeholder="e.g. ZENITHBANK"
            className="w-full bg-foreground/5 border border-border rounded-xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20"
          />
        </div>
        <button
          onClick={() => {
            if (compareSymbol) {
              onCompare(stock.symbol, compareSymbol);
              onClose();
            }
          }}
          className="w-full py-4 bg-blue-500 text-white font-bold rounded-2xl hover:bg-blue-600 transition-all shadow-lg shadow-blue-500/20"
        >
          Start Comparison
        </button>
      </div>
    </Modal>
  );
};

export const LessonModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  lesson: any;
}> = ({ isOpen, onClose, lesson }) => {
  if (!lesson) return null;
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={lesson.title}>
      <div className="space-y-6">
        <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex items-center gap-3">
          <Info size={20} className="text-blue-500" />
          <p className="text-xs font-bold text-blue-500 uppercase tracking-widest">{lesson.category}</p>
        </div>
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <p className="text-gray-500 leading-relaxed">{lesson.content}</p>
        </div>
        <div className="space-y-4">
          <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Key Takeaways</h4>
          <ul className="space-y-2">
            {lesson.takeaways?.map((t: string, i: number) => (
              <li key={i} className="flex items-start gap-3 text-sm text-gray-400">
                <CheckCircle2 size={16} className="text-green-500 mt-0.5 shrink-0" />
                {t}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Modal>
  );
};

export const FeedbackModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  user: any;
}> = ({ isOpen, onClose, user }) => {
  const [type, setType] = useState<'suggestion' | 'issue'>('suggestion');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const handleSubmit = async () => {
    if (!message.trim()) return;
    setSending(true);
    try {
      await addDoc(collection(db, 'feedback'), {
        uid: user?.uid || 'guest',
        email: user?.email || 'guest@ngxintel.com',
        type,
        message,
        createdAt: serverTimestamp()
      });
      toast.success("Thank you for your feedback!");
      setMessage('');
      onClose();
    } catch (error) {
      console.error("Feedback error:", error);
      toast.error("Failed to send feedback");
    } finally {
      setSending(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Send Feedback">
      <div className="space-y-6">
        <div className="flex gap-2">
          <button
            onClick={() => setType('suggestion')}
            className={cn(
              "flex-1 p-3 rounded-xl border text-[10px] font-bold uppercase tracking-widest transition-all",
              type === 'suggestion' ? "bg-green-500/10 border-green-500/30 text-green-500" : "bg-foreground/5 border-transparent text-gray-500"
            )}
          >
            Suggestion
          </button>
          <button
            onClick={() => setType('issue')}
            className={cn(
              "flex-1 p-3 rounded-xl border text-[10px] font-bold uppercase tracking-widest transition-all",
              type === 'issue' ? "bg-red-500/10 border-red-500/30 text-red-500" : "bg-foreground/5 border-transparent text-gray-500"
            )}
          >
            Report Issue
          </button>
        </div>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Tell us what you think or report a problem..."
          className="w-full h-32 bg-foreground/5 border border-border rounded-2xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 resize-none"
        />
        <button
          onClick={handleSubmit}
          disabled={sending || !message.trim()}
          className="w-full py-4 bg-foreground text-background font-bold rounded-2xl hover:opacity-90 transition-all disabled:opacity-50"
        >
          {sending ? "Sending..." : "Submit Feedback"}
        </button>
      </div>
    </Modal>
  );
};

export const AuthModal: React.FC<{ isOpen: boolean; onClose: () => void }> = () => null;
