/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Search, 
  TrendingUp, 
  TrendingDown,
  PieChart, 
  LayoutDashboard, 
  Bookmark, 
  Compass, 
  BookOpen, 
  User as UserIcon,
  ArrowUpRight,
  ArrowDownRight,
  ArrowRight,
  Loader2,
  ChevronRight,
  BarChart3,
  Activity,
  Zap,
  Globe,
  Trash2,
  Settings,
  Shield,
  Bell,
  BellOff,
  X,
  Sun,
  Moon,
  Lock,
  LogOut,
  CreditCard,
  Mic,
  Bot,
  Volume2,
  VolumeX,
  Pause,
  Play,
  MessageSquare
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { analyzeQuery, refreshStocks, getMarketTrends } from './services/geminiService';
import { SearchResult, StockData, PriceAlert, MarketTrends } from './types';
import { cn } from './lib/utils';
import { Toaster, toast } from 'sonner';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import ReactMarkdown from 'react-markdown';
import { 
  auth, 
  db, 
  googleProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged, 
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile
} from './firebase';
import { doc, getDoc, setDoc, updateDoc, increment, onSnapshot, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { textToSpeech } from './services/geminiService';

// --- Helpers ---

const playAudio = (base64: string) => {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  const blob = new Blob([bytes], { type: 'audio/mp3' });
  const url = URL.createObjectURL(blob);
  const audio = new Audio(url);
  audio.play();
  return audio;
};

// --- Components ---

const SidebarItem = ({ icon: Icon, label, active, onClick }: { icon: any, label: string, active?: boolean, onClick?: () => void }) => (
  <button 
    onClick={onClick}
    className={cn(
      "flex items-center gap-3 px-4 py-3 w-full text-left transition-all duration-200 rounded-lg group",
      active 
        ? "bg-foreground/10 text-foreground" 
        : "text-gray-500 hover:bg-foreground/5 hover:text-foreground"
    )}
  >
    <Icon size={20} className={cn("transition-transform group-hover:scale-110", active ? "text-green-500" : "text-gray-400")} />
    <span className="font-medium text-sm">{label}</span>
    {active && <motion.div layoutId="active-pill" className="ml-auto w-1 h-4 bg-green-500 rounded-full" />}
  </button>
);

const MetricCard = ({ label, value, score, explanation, trend }: any) => (
  <div className="bg-card border border-border p-5 rounded-2xl hover:border-foreground/10 transition-all group">
    <div className="flex justify-between items-start mb-4">
      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</span>
      {trend === 'up' ? (
        <ArrowUpRight size={16} className="text-green-500" />
      ) : trend === 'down' ? (
        <ArrowDownRight size={16} className="text-red-500" />
      ) : (
        <Activity size={16} className="text-blue-500" />
      )}
    </div>
    <div className="text-2xl font-bold text-foreground mb-2">{value}</div>
    <div className="w-full bg-foreground/5 h-1.5 rounded-full overflow-hidden mb-3">
      <motion.div 
        initial={{ width: 0 }}
        animate={{ width: `${score}%` }}
        className={cn(
          "h-full rounded-full",
          score > 70 ? "bg-green-500" : score > 40 ? "bg-yellow-500" : "bg-red-500"
        )}
      />
    </div>
    <p className="text-xs text-gray-500 leading-relaxed group-hover:text-gray-400 transition-colors">
      {explanation}
    </p>
  </div>
);

const CompactMetric = ({ label, value, score }: { label: string, value: string, score: number }) => (
  <div className="flex flex-col gap-1">
    <div className="flex justify-between items-center">
      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{label}</span>
      <span className="text-[10px] font-bold text-foreground">{value}</span>
    </div>
    <div className="w-full bg-foreground/5 h-1 rounded-full overflow-hidden">
      <motion.div 
        initial={{ width: 0 }}
        animate={{ width: `${score}%` }}
        className={cn(
          "h-full rounded-full",
          score > 70 ? "bg-green-500" : score > 40 ? "bg-yellow-500" : "bg-red-500"
        )}
      />
    </div>
  </div>
);

const StockChart = ({ data = [], historicalData }: { data: any[], historicalData?: { [key: string]: any[] } }) => {
  const [timeframe, setTimeframe] = useState('1M');
  const [chartData, setChartData] = useState(data);

  useEffect(() => {
    if (timeframe === '1M') setChartData(data);
    else if (historicalData && historicalData[timeframe]) setChartData(historicalData[timeframe]);
  }, [timeframe, data, historicalData]);

  return (
    <div className="space-y-6 mt-8 pt-8 border-t border-border">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Performance Chart</h3>
        <div className="flex bg-foreground/5 p-1 rounded-xl">
          {['1D', '1M', '1Y'].map((tf) => (
            <button 
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={cn(
                "px-4 py-1.5 text-[10px] font-bold rounded-lg transition-all",
                timeframe === tf ? "bg-green-500 text-white" : "text-gray-500 hover:text-foreground"
              )}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22C55E" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#22C55E" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-border" vertical={false} />
            <XAxis 
              dataKey="date" 
              stroke="currentColor"
              className="text-gray-500"
              fontSize={10} 
              tickLine={false} 
              axisLine={false}
              tickFormatter={(val) => {
                if (timeframe === '1D') return val.split(' ')[1] || val;
                return val.split('-')[2] || val;
              }}
            />
            <YAxis 
              stroke="currentColor"
              className="text-gray-500"
              fontSize={10} 
              tickLine={false} 
              axisLine={false}
              tickFormatter={(val) => `₦${val}`}
              domain={['auto', 'auto']}
            />
            <Tooltip 
              contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '16px', fontSize: '12px', color: 'var(--foreground)' }}
              itemStyle={{ color: '#22C55E' }}
              labelStyle={{ color: 'var(--foreground)', opacity: 0.6, marginBottom: '4px' }}
              formatter={(val: any) => [`₦${val}`, 'Price']}
            />
            <Area 
              type="monotone" 
              dataKey="price" 
              stroke="#22C55E" 
              strokeWidth={2}
              fillOpacity={1} 
              fill="url(#colorPrice)" 
              animationDuration={1500}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

const LivePrice = ({ value, change, changePercent, size = "large" }: { value: string, change: string, changePercent: string, size?: "small" | "large" }) => {
  const [prevValue, setPrevValue] = useState(value);
  const [flash, setFlash] = useState<"up" | "down" | null>(null);

  useEffect(() => {
    if (value !== prevValue) {
      const oldNum = parseFloat(prevValue.replace(/[^\d.]/g, ''));
      const newNum = parseFloat(value.replace(/[^\d.]/g, ''));
      
      if (!isNaN(oldNum) && !isNaN(newNum)) {
        setFlash(newNum > oldNum ? "up" : "down");
        const timer = setTimeout(() => setFlash(null), 2000);
        setPrevValue(value);
        return () => clearTimeout(timer);
      }
      setPrevValue(value);
    }
  }, [value, prevValue]);

  const isPositive = change?.startsWith('+');

  return (
    <div className="relative">
      <AnimatePresence mode="wait">
        <motion.div
          key={value}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -5 }}
          className={cn(
            "font-bold transition-colors duration-500",
            size === "large" ? "text-2xl" : "text-lg",
            flash === "up" ? "text-green-500" : flash === "down" ? "text-red-500" : "text-foreground"
          )}
        >
          {value}
          {flash && (
            <motion.span
              initial={{ opacity: 1, scale: 1 }}
              animate={{ opacity: 0, scale: 1.5 }}
              className={cn(
                "absolute -right-4 top-0",
                flash === "up" ? "text-green-500" : "text-red-500"
              )}
            >
              {flash === "up" ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
            </motion.span>
          )}
        </motion.div>
      </AnimatePresence>
      <div className={cn("text-[10px] font-medium flex items-center gap-1", isPositive ? "text-green-500" : "text-red-500")}>
        {change} ({changePercent})
      </div>
    </div>
  );
};

const SpeakButton = ({ text }: { text: string }) => {
  const [loading, setLoading] = useState(false);
  const [playing, setPlaying] = useState(false);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  const handleSpeak = async () => {
    if (playing) {
      audioRef.current?.pause();
      setPlaying(false);
      return;
    }

    setLoading(true);
    try {
      const base64 = await textToSpeech(text);
      if (base64) {
        audioRef.current = playAudio(base64);
        setPlaying(true);
        audioRef.current.onended = () => setPlaying(false);
      } else {
        toast.error("Speech generation failed");
      }
    } catch (error) {
      console.error("TTS Error", error);
      toast.error("Failed to generate speech");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button 
      onClick={handleSpeak}
      disabled={loading}
      className={cn(
        "p-2 rounded-xl transition-all border border-border flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest",
        playing ? "bg-green-500 text-white border-green-500" : "bg-foreground/5 text-gray-500 hover:text-foreground hover:bg-foreground/10"
      )}
    >
      {loading ? (
        <Loader2 className="animate-spin" size={14} />
      ) : playing ? (
        <Volume2 size={14} />
      ) : (
        <VolumeX size={14} />
      )}
      {playing ? "Playing" : "Listen"}
    </button>
  );
};

const StockAnalysisView = ({ stock, compact = false, onWatch, isWatched, onViewDetails, onCompare }: { stock: StockData, compact?: boolean, onWatch: (s: StockData) => void, isWatched: boolean, onViewDetails?: (s: StockData) => void, onCompare?: (s: StockData) => void }) => (
  <div className={cn("space-y-8", compact ? "bg-card border border-border p-6 rounded-3xl" : "")}>
    {/* Hero Section */}
    <div className={cn("flex flex-col gap-8 items-start", compact ? "" : "md:flex-row")}>
      <div className="flex-1 bg-card border border-border p-8 rounded-3xl w-full">
        <div className="flex justify-between items-start mb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h2 className={cn("font-bold", compact ? "text-xl" : "text-3xl")}>{stock.name}</h2>
              <span className="px-3 py-1 bg-green-500/10 text-green-500 text-xs font-bold rounded-full border border-green-500/20">
                {stock.symbol}
              </span>
              {stock.splits && stock.splits.length > 0 && (
                <span className="px-3 py-1 bg-blue-500/10 text-blue-500 text-[10px] font-bold rounded-full border border-blue-500/20 flex items-center gap-1">
                  <PieChart size={10} />
                  {stock.splits.length} Split{stock.splits.length > 1 ? 's' : ''}
                </span>
              )}
            </div>
            <p className="text-gray-500 text-sm">{stock.sector} • {stock.marketCap} Market Cap</p>
          </div>
          <div className="flex items-center gap-2">
            {!compact && onCompare && (
              <button 
                onClick={() => onCompare(stock)}
                className="px-4 py-2 bg-foreground/5 rounded-xl hover:bg-foreground/10 transition-all border border-border text-[10px] font-bold uppercase tracking-widest text-gray-500 hover:text-foreground flex items-center gap-2"
              >
                <BarChart3 size={16} />
                Compare
              </button>
            )}
            {compact && onViewDetails && (
              <button 
                onClick={() => onViewDetails(stock)}
                className="px-4 py-2 bg-foreground/5 rounded-xl hover:bg-foreground/10 transition-all border border-border text-[10px] font-bold uppercase tracking-widest text-gray-500 hover:text-foreground"
              >
                More Info
              </button>
            )}
            <SpeakButton text={stock.aiSummary} />
            <button 
              onClick={() => onWatch(stock)}
              className="p-3 bg-foreground/5 rounded-xl hover:bg-foreground/10 transition-all border border-border"
            >
              <Bookmark size={20} className={isWatched ? "fill-green-500 text-green-500" : "text-gray-500"} />
            </button>
          </div>
        </div>

        <div className={cn("grid gap-8 mb-8", compact ? "grid-cols-2" : "grid-cols-2 md:grid-cols-4")}>
          <div>
            <span className="text-[10px] font-bold text-gray-600 uppercase tracking-widest block mb-1">Current Price</span>
            <LivePrice value={stock.price} change={stock.change} changePercent={stock.changePercent} />
          </div>
          {!compact && (
            <>
              <div>
                <span className="text-[10px] font-bold text-gray-600 uppercase tracking-widest block mb-1">52W High/Low</span>
                <div className="text-sm font-medium">{stock.high52} / {stock.low52}</div>
              </div>
              <div>
                <span className="text-[10px] font-bold text-gray-600 uppercase tracking-widest block mb-1">P/E Ratio</span>
                <div className="text-sm font-medium">{stock.peRatio}</div>
              </div>
              <div>
                <span className="text-[10px] font-bold text-gray-600 uppercase tracking-widest block mb-1">Dividend Yield</span>
                <div className="text-sm font-medium">{stock.dividendYield}</div>
              </div>
            </>
          )}
          {compact && (
            <div>
              <span className="text-[10px] font-bold text-gray-600 uppercase tracking-widest block mb-1">Div. Yield</span>
              <div className="text-sm font-medium">{stock.dividendYield}</div>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-white/5">
          {stock.lastUpdated && (
            <div className="flex items-center gap-1.5 text-[10px] text-gray-500">
              <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              <span>LIVE DATA AS OF: {stock.lastUpdated}</span>
            </div>
          )}
          {stock.source && (
            <div className="flex items-center gap-1.5 text-[10px] text-gray-500">
              <Globe size={12} className="text-blue-400" />
              <span>SOURCE: {stock.source}</span>
            </div>
          )}
        </div>

        {!compact && <StockChart data={stock.chartData} historicalData={stock.historicalData} />}

        {compact && (
          <div className="grid grid-cols-1 gap-4 mt-6 pt-6 border-t border-white/5">
            {(stock.metrics || []).map((metric, i) => (
              <CompactMetric key={i} label={metric.label} value={metric.value} score={metric.score} />
            ))}
          </div>
        )}
      </div>

      {/* Score Panel */}
      <div className={cn("bg-gradient-to-b from-[#1A1A1A] to-[#111] border border-white/5 p-8 rounded-3xl flex flex-col items-center text-center", compact ? "w-full" : "w-full md:w-80")}>
        <span className="text-xs font-bold text-gray-500 uppercase tracking-[0.2em] mb-6">Investment Score</span>
        <div className="relative w-32 h-32 mb-6">
          <svg className="w-full h-full transform -rotate-90">
            <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-white/5" />
            <motion.circle 
              cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent" 
              strokeDasharray={364}
              initial={{ strokeDashoffset: 364 }}
              animate={{ strokeDashoffset: 364 - (364 * stock.investmentScore) / 100 }}
              className="text-green-400"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold">{stock.investmentScore}</span>
            <span className="text-[10px] text-gray-500">/ 100</span>
          </div>
        </div>
        <h3 className="text-xl font-bold mb-2">{stock.rating}</h3>
        <div className="space-y-2 w-full text-left">
          {(stock.scoreReasoning || []).map((reason, i) => (
            <div key={i} className="flex items-start gap-2 text-[11px] text-gray-400">
              <div className="w-1 h-1 rounded-full bg-green-400 mt-1.5" />
              <span>{reason}</span>
            </div>
          ))}
        </div>
      </div>
    </div>

    {/* AI Explanation */}
    {!compact && (
      <div className="bg-card border border-border p-8 rounded-3xl">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Zap size={20} className="text-yellow-500" />
          AI Intelligence Report
        </h3>
        <div className="prose prose-invert max-w-none text-gray-500 leading-relaxed">
          <ReactMarkdown>{stock.aiSummary}</ReactMarkdown>
        </div>
      </div>
    )}

    {/* Recent News Section */}
    {!compact && stock.news && stock.news.length > 0 && (
      <div className="bg-card border border-border p-8 rounded-3xl">
        <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
          <Globe size={20} className="text-blue-500" />
          Recent News & Market Sentiment
        </h3>
        <div className="space-y-4">
          {stock.news.map((item, i) => (
            <a 
              key={i} 
              href={item.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="block p-5 bg-foreground/5 rounded-2xl border border-border hover:border-blue-500/30 transition-all group"
            >
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1">
                  <h4 className="font-bold text-sm mb-2 group-hover:text-blue-500 transition-colors line-clamp-2">
                    {item.headline}
                  </h4>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{item.source}</span>
                    <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-700" />
                    <span className="text-[10px] text-gray-500">{item.date}</span>
                  </div>
                </div>
                <div className="p-2 bg-foreground/5 rounded-lg text-gray-500 group-hover:text-blue-500 transition-colors">
                  <ArrowRight size={14} />
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>
    )}

    {/* Stock Splits Section */}
    {!compact && stock.splits && stock.splits.length > 0 && (
      <div className="bg-card border border-border p-8 rounded-3xl">
        <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
          <PieChart size={20} className="text-blue-500" />
          Corporate Actions: Stock Splits
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {stock.splits.map((split, i) => (
            <div key={i} className="p-6 bg-foreground/5 rounded-2xl border border-border hover:border-blue-500/30 transition-all">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">Date</span>
                  <div className="text-sm font-bold">{split.date}</div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">Ratio</span>
                  <div className="text-sm font-bold text-blue-500">{split.ratio}</div>
                </div>
              </div>
              <div className="mb-4">
                <span className={cn(
                  "px-2 py-0.5 text-[10px] font-bold rounded uppercase tracking-widest",
                  split.type === 'split' ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
                )}>
                  {split.type === 'split' ? 'Stock Split' : 'Reverse Split'}
                </span>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">{split.description}</p>
            </div>
          ))}
        </div>
      </div>
    )}

    {/* Metrics Grid */}
    {!compact && (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {(stock.metrics || []).map((metric, i) => (
          <MetricCard key={i} {...metric} />
        ))}
      </div>
    )}

    {/* Disclaimer */}
    {!compact && (
      <div className="p-6 bg-white/5 rounded-2xl border border-white/5 text-center">
        <p className="text-[10px] text-gray-500 uppercase tracking-widest">
          Disclaimer: This analysis is for informational purposes only and does not constitute financial advice. Investing in stocks involves risk.
        </p>
      </div>
    )}
  </div>
);

const ProfileView = ({ 
  user, 
  watchlistCount, 
  notificationsEnabled, 
  setNotificationsEnabled,
  movementThreshold,
  setMovementThreshold
}: { 
  user: { name: string, email: string, plan: string }, 
  watchlistCount: number,
  notificationsEnabled: boolean,
  setNotificationsEnabled: (val: boolean) => void,
  movementThreshold: number,
  setMovementThreshold: (val: number) => void
}) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="max-w-4xl mx-auto space-y-8"
  >
    <div className="flex items-center gap-6 p-8 bg-[#111] border border-white/5 rounded-[2.5rem]">
      <div className="w-24 h-24 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center text-3xl font-bold text-black">
        {user.name.charAt(0)}
      </div>
      <div>
        <h2 className="text-3xl font-bold mb-1">{user.name}</h2>
        <p className="text-gray-500 mb-4">{user.email}</p>
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-400/10 text-green-400 text-xs font-bold rounded-full border border-green-400/20">
          <Zap size={12} className="fill-green-400" />
          {user.plan}
        </div>
      </div>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="bg-[#111] border border-white/5 p-8 rounded-3xl text-center">
        <div className="text-3xl font-bold mb-2">{watchlistCount}</div>
        <div className="text-xs text-gray-500 uppercase tracking-widest font-bold">Watchlist Items</div>
      </div>
      <div className="bg-[#111] border border-white/5 p-8 rounded-3xl text-center">
        <div className="text-3xl font-bold mb-2">4</div>
        <div className="text-xs text-gray-500 uppercase tracking-widest font-bold">Academy Lessons</div>
      </div>
      <div className="bg-[#111] border border-white/5 p-8 rounded-3xl text-center">
        <div className="text-3xl font-bold mb-2">12</div>
        <div className="text-xs text-gray-500 uppercase tracking-widest font-bold">Analyses Run</div>
      </div>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="p-8 bg-[#111] border border-white/5 rounded-3xl">
        <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
          <Bell size={20} className="text-gray-400" />
          Notification Settings
        </h3>
        <div className="space-y-6">
          <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl">
            <div>
              <div className="text-sm font-medium">Price Change Alerts</div>
              <div className="text-[10px] text-gray-500">Notify me of significant price movements in my watchlist.</div>
            </div>
            <button 
              onClick={() => setNotificationsEnabled(!notificationsEnabled)}
              className={cn(
                "w-12 h-6 rounded-full p-1 transition-all",
                notificationsEnabled ? "bg-green-400" : "bg-white/10"
              )}
            >
              <div className={cn(
                "w-4 h-4 rounded-full bg-black transition-all",
                notificationsEnabled ? "translate-x-6" : "translate-x-0"
              )} />
            </button>
          </div>

          <div className="p-4 bg-foreground/5 rounded-2xl">
            <div className="flex justify-between items-center mb-4">
              <span className="text-sm font-medium">Alert Threshold</span>
              <span className="text-xs font-bold text-green-500">{movementThreshold}%</span>
            </div>
            <input 
              type="range" 
              min="0.5" 
              max="10" 
              step="0.5" 
              value={movementThreshold}
              onChange={(e) => setMovementThreshold(parseFloat(e.target.value))}
              className="w-full accent-green-500"
            />
            <div className="flex justify-between mt-2">
              <span className="text-[8px] text-gray-500 font-bold uppercase tracking-widest">Sensitive (0.5%)</span>
              <span className="text-[8px] text-gray-500 font-bold uppercase tracking-widest">Conservative (10%)</span>
            </div>
          </div>
        </div>
      </div>

      <div className="p-8 bg-card border border-border rounded-3xl">
        <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
          <Shield size={20} className="text-gray-500" />
          Subscription & Billing
        </h3>
        <div className="p-6 bg-green-500/5 border border-green-500/10 rounded-2xl mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-bold text-green-500">Current Plan</span>
            <span className="text-xs font-bold text-gray-500">₦5,000 / month</span>
          </div>
          <div className="text-xl font-bold mb-4 text-foreground">Premium NGX Intel</div>
          <div className="text-xs text-gray-500 leading-relaxed">
            Next billing date: April 30, 2026. You have access to all premium features including real-time AI analysis and unlimited watchlists.
          </div>
        </div>
        <button className="w-full py-4 bg-foreground/5 rounded-2xl hover:bg-foreground/10 transition-all text-sm font-bold border border-border">
          Manage Subscription
        </button>
      </div>
    </div>
  </motion.div>
);

const AlertModal = ({ stock, isOpen, onClose, onAdd }: { stock: StockData, isOpen: boolean, onClose: () => void, onAdd: (symbol: string, price: number, type: 'above' | 'below') => void }) => {
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

const CompareModal = ({ stock, isOpen, onClose, onCompare }: { stock: StockData, isOpen: boolean, onClose: () => void, onCompare: (symbol1: string, symbol2: string) => void }) => {
  const [symbol2, setSymbol2] = useState('');

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
        <h3 className="text-2xl font-bold mb-2 text-foreground">Compare Stocks</h3>
        <p className="text-gray-500 text-sm mb-8">Compare {stock.symbol} with another NGX listed company.</p>
        
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

const LessonModal = ({ lesson, isOpen, onClose }: { lesson: any, isOpen: boolean, onClose: () => void }) => {
  if (!isOpen || !lesson) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-card border border-border p-0 rounded-[2.5rem] w-full max-w-4xl max-h-[90vh] overflow-hidden relative flex flex-col"
      >
        <div className="p-8 border-b border-border flex justify-between items-center bg-foreground/5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-500/10 text-blue-500 rounded-2xl flex items-center justify-center">
              {lesson.icon}
            </div>
            <div>
              <h3 className="text-2xl font-bold text-foreground">{lesson.title}</h3>
              <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                <span className="px-2 py-0.5 bg-blue-500/10 text-blue-500 rounded-full border border-blue-500/20 font-bold uppercase">{lesson.level}</span>
                <span>•</span>
                <span>{lesson.time}</span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-foreground/10 rounded-full transition-colors text-gray-500 hover:text-foreground">
            <X size={24} />
          </button>
        </div>
        
        <div className="p-10 overflow-y-auto flex-1 custom-scrollbar">
          <div className="prose prose-invert max-w-none text-gray-400 leading-relaxed text-lg">
            <ReactMarkdown>{lesson.fullContent || lesson.content}</ReactMarkdown>
          </div>
        </div>

        <div className="p-8 border-t border-border bg-foreground/5 flex justify-end">
          <button 
            onClick={onClose}
            className="px-8 py-3 bg-foreground text-background font-bold rounded-2xl hover:opacity-90 transition-all"
          >
            Finished Reading
          </button>
        </div>
      </motion.div>
    </div>
  );
};

const AuthModal = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
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
        className="relative w-full max-w-md bg-card border border-border rounded-3xl shadow-2xl overflow-hidden p-8"
      >
        <div className="text-center mb-8">
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

const LandingPage = ({ onSignIn }: { onSignIn: () => void }) => {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-green-500/10 rounded-full blur-[120px] -z-10 animate-pulse" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px] -z-10 animate-pulse delay-700" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl w-full text-center space-y-10"
      >
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-foreground/5 border border-border rounded-full mb-4">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500">The Future of NGX Investing</span>
        </div>
        
        <h1 className="text-6xl md:text-8xl font-bold tracking-tighter leading-[0.9]">
          Analyze the Market <br />
          <span className="text-green-500">Like a Pro.</span>
        </h1>
        
        <p className="text-xl text-gray-500 max-w-2xl mx-auto leading-relaxed">
          NGX Intel provides real-time insights, AI-powered stock analysis, and 
          comprehensive learning tools for the Nigerian Stock Exchange.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
          <button 
            onClick={onSignIn}
            className="px-10 py-5 bg-foreground text-background font-bold rounded-2xl hover:opacity-90 transition-all flex items-center gap-3 text-lg group"
          >
            Get Started Now
            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
          </button>
          <button 
            onClick={() => window.open('https://ngxgroup.com/', '_blank')}
            className="px-10 py-5 bg-foreground/5 border border-border text-foreground font-bold rounded-2xl hover:bg-foreground/10 transition-all text-lg"
          >
            Explore Market
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-20">
          {[
            { icon: <Zap className="text-yellow-500" />, title: "AI Analysis", desc: "Instant insights on any NGX stock using Gemini Pro." },
            { icon: <TrendingUp className="text-green-500" />, title: "Real-time Data", desc: "Live price feeds and market movement tracking." },
            { icon: <Shield className="text-blue-500" />, title: "Secure Portfolio", desc: "Manage your watchlist with enterprise-grade security." }
          ].map((feature, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + (i * 0.1) }}
              className="p-8 bg-card border border-border rounded-3xl text-left hover:border-foreground/10 transition-all group"
            >
              <div className="w-12 h-12 bg-foreground/5 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
              <p className="text-gray-500 leading-relaxed">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>
      
      <footer className="absolute bottom-10 text-gray-500 text-xs font-medium uppercase tracking-widest">
        © 2026 NGX Intel • Built for the Nigerian Investor
      </footer>
    </div>
  );
};

const FeedbackModal = ({ isOpen, onClose, user }: { isOpen: boolean, onClose: () => void, user: User | null }) => {
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
        className="relative w-full max-w-md bg-card border border-border rounded-3xl shadow-2xl overflow-hidden p-8"
      >
        <div className="text-center mb-8">
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

const VoiceAgent = ({ onCommand, isListening, startListening }: { onCommand: (cmd: string) => void, isListening: boolean, startListening: () => void }) => {
  return (
    <div className="fixed bottom-8 right-8 z-50 flex flex-col items-end gap-4">
      <AnimatePresence>
        {isListening && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className="bg-card border border-border p-4 rounded-2xl shadow-2xl flex items-center gap-4 mb-2"
          >
            <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center animate-pulse">
              <Mic size={20} className="text-white" />
            </div>
            <div>
              <p className="text-xs font-bold text-foreground">Listening...</p>
              <p className="text-[10px] text-gray-500">Ask me to analyze or compare stocks</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <motion.button 
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={startListening}
        className={cn(
          "w-16 h-16 rounded-full shadow-2xl flex items-center justify-center transition-all duration-500 border-4 border-background",
          isListening ? "bg-green-500 text-white scale-110" : "bg-foreground text-background hover:bg-green-500 hover:text-white"
        )}
      >
        {isListening ? (
          <div className="flex gap-1">
            <motion.div animate={{ height: [10, 20, 10] }} transition={{ repeat: Infinity, duration: 0.5 }} className="w-1 bg-white rounded-full" />
            <motion.div animate={{ height: [20, 10, 20] }} transition={{ repeat: Infinity, duration: 0.5 }} className="w-1 bg-white rounded-full" />
            <motion.div animate={{ height: [10, 20, 10] }} transition={{ repeat: Infinity, duration: 0.5 }} className="w-1 bg-white rounded-full" />
          </div>
        ) : (
          <Bot size={32} />
        )}
      </motion.button>
    </div>
  );
};

const TagManager = ({ stock, onAdd, onRemove }: { stock: StockData, onAdd: (tag: string) => void, onRemove: (tag: string) => void }) => {
  const [newTag, setNewTag] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  return (
    <div className="mt-4 space-y-2">
      <div className="flex flex-wrap gap-1">
        {(stock.tags || []).map(tag => (
          <span key={tag} className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-400/10 text-blue-400 text-[10px] font-bold rounded-md border border-blue-400/20">
            {tag}
            <button onClick={() => onRemove(tag)} className="hover:text-red-400">
              <X size={10} />
            </button>
          </span>
        ))}
        {isAdding ? (
          <div className="flex items-center gap-1">
            <input 
              autoFocus
              type="text" 
              className="bg-white/5 border border-white/10 rounded px-2 py-0.5 text-[10px] focus:outline-none focus:border-blue-400/50 w-20"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  onAdd(newTag);
                  setNewTag('');
                  setIsAdding(false);
                } else if (e.key === 'Escape') {
                  setIsAdding(false);
                }
              }}
              onBlur={() => {
                if (!newTag) setIsAdding(false);
              }}
            />
          </div>
        ) : (
          <button 
            onClick={() => setIsAdding(true)}
            className="px-2 py-0.5 bg-white/5 text-gray-500 text-[10px] font-bold rounded-md border border-dashed border-white/10 hover:border-white/20 hover:text-gray-300"
          >
            + Add Tag
          </button>
        )}
      </div>
    </div>
  );
};

// --- Main App ---

interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  isPremium: boolean;
  searchCount: number;
  trendsClickCount: number;
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SearchResult | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [watchlist, setWatchlist] = useState<StockData[]>([]);
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);
  const [selectedStockForAlert, setSelectedStockForAlert] = useState<StockData | null>(null);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);
  const [selectedStockForCompare, setSelectedStockForCompare] = useState<StockData | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<any | null>(null);
  const [isLessonModalOpen, setIsLessonModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<string>(new Date().toLocaleTimeString());
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [movementThreshold, setMovementThreshold] = useState(1.5);
  const [selectedSector, setSelectedSector] = useState<string | null>(null);
  const [selectedMarketCap, setSelectedMarketCap] = useState<string | null>(null);
  const [selectedWatchlistTag, setSelectedWatchlistTag] = useState<string | null>(null);
  const [marketTrends, setMarketTrends] = useState<MarketTrends | null>(null);
  const [isTrendsLoading, setIsTrendsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('ngx-intel-theme');
    return (saved as 'dark' | 'light') || 'dark';
  });

  // Firebase Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Fetch or create user profile
        const userDocRef = doc(db, 'users', currentUser.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
          setUserProfile(userDoc.data() as UserProfile);
        } else {
          const newProfile: UserProfile = {
            uid: currentUser.uid,
            email: currentUser.email || '',
            displayName: currentUser.displayName || 'Investor',
            isPremium: true, // Default to true for testing phase
            searchCount: 0,
            trendsClickCount: 0
          };
          await setDoc(userDocRef, {
            ...newProfile,
            createdAt: new Date().toISOString()
          });
          setUserProfile(newProfile);
        }

        // Listen for real-time profile updates
        const unsubProfile = onSnapshot(userDocRef, (doc) => {
          if (doc.exists()) {
            setUserProfile(doc.data() as UserProfile);
          }
        });
        return () => unsubProfile();
      } else {
        setUserProfile(null);
        setMarketTrends(null);
        setResult(null);
      }
      setIsAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = () => {
    setIsAuthModalOpen(true);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast.success("Logged out successfully");
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  const isAdmin = user?.email === 'Sasdraze@gmail.com';

  const handleUpgrade = async () => {
    if (!user) {
      handleLogin();
      return;
    }
    try {
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, { isPremium: true });
      toast.success("Welcome to NGX Intel Premium!");
    } catch (error) {
      console.error("Upgrade failed", error);
      toast.error("Upgrade failed. Please try again.");
    }
  };

  useEffect(() => {
    localStorage.setItem('ngx-intel-theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const allWatchlistTags = Array.from(new Set(watchlist.flatMap(s => s.tags || [])));

  const addTagToStock = (symbol: string, tag: string) => {
    if (!tag.trim()) return;
    setWatchlist(prev => prev.map(s => {
      if (s.symbol === symbol) {
        const tags = s.tags || [];
        if (!tags.includes(tag.trim())) {
          return { ...s, tags: [...tags, tag.trim()] };
        }
      }
      return s;
    }));
  };

  const removeTagFromStock = (symbol: string, tag: string) => {
    setWatchlist(prev => prev.map(s => {
      if (s.symbol === symbol) {
        return { ...s, tags: (s.tags || []).filter(t => t !== tag) };
      }
      return s;
    }));
  };

  // Background refresh logic
  useEffect(() => {
    const interval = setInterval(async () => {
      const symbolsToRefresh = watchlist.map(s => s.symbol);
      
      // Also refresh currently viewed stock if it's an analysis
      if (result?.type === 'analysis' && result.data && !Array.isArray(result.data)) {
        if (!symbolsToRefresh.includes(result.data.symbol)) {
          symbolsToRefresh.push(result.data.symbol);
        }
      }

      if (symbolsToRefresh.length === 0) return;

      setIsRefreshing(true);
      try {
        const updatedStocks = await refreshStocks(symbolsToRefresh);
        
        if (updatedStocks.length > 0) {
          // Update watchlist and notify of significant changes
          setWatchlist(prev => prev.map(stock => {
            const updated = updatedStocks.find(u => u.symbol === stock.symbol);
            if (updated) {
              const oldPrice = parseFloat(stock.price.replace(/[^\d.]/g, ''));
              const newPrice = parseFloat(updated.price.replace(/[^\d.]/g, ''));
              
              if (!isNaN(oldPrice) && !isNaN(newPrice) && oldPrice > 0 && notificationsEnabled) {
                const movement = ((newPrice - oldPrice) / oldPrice) * 100;
                if (Math.abs(movement) >= movementThreshold) { // Use configurable threshold
                  toast(movement > 0 ? 'Significant Gain' : 'Significant Drop', {
                    description: `${stock.symbol} moved ${movement.toFixed(2)}% to ${updated.price}`,
                    icon: movement > 0 ? <TrendingUp size={16} className="text-green-400" /> : <TrendingDown size={16} className="text-red-400" />,
                    duration: 8000,
                  });
                }
              }
              return { ...stock, ...updated };
            }
            return stock;
          }));

          // Update current result if it's an analysis
          setResult(prev => {
            if (prev?.type === 'analysis' && prev.data && !Array.isArray(prev.data)) {
              const updated = updatedStocks.find(u => u.symbol === (prev.data as StockData).symbol);
              if (updated) {
                return { ...prev, data: { ...(prev.data as StockData), ...updated } };
              }
            }
            return prev;
          });

          setLastRefreshed(new Date().toLocaleTimeString());
        }
      } catch (error) {
        console.error("Background refresh failed", error);
      } finally {
        setIsRefreshing(false);
      }
    }, 60000); // Refresh every 60 seconds

    return () => clearInterval(interval);
  }, [watchlist, result]);

  // Load watchlist and alerts from localStorage
  useEffect(() => {
    const savedWatchlist = localStorage.getItem('ngx-intel-watchlist');
    if (savedWatchlist) {
      try {
        setWatchlist(JSON.parse(savedWatchlist));
      } catch (e) {
        console.error("Failed to load watchlist", e);
      }
    }

    const savedAlerts = localStorage.getItem('ngx-intel-alerts');
    if (savedAlerts) {
      try {
        setAlerts(JSON.parse(savedAlerts));
      } catch (e) {
        console.error("Failed to load alerts", e);
      }
    }
  }, []);

  // Save watchlist and alerts to localStorage
  useEffect(() => {
    localStorage.setItem('ngx-intel-watchlist', JSON.stringify(watchlist));
  }, [watchlist]);

  useEffect(() => {
    localStorage.setItem('ngx-intel-alerts', JSON.stringify(alerts));
  }, [alerts]);

  // Check alerts whenever watchlist or alerts change
  useEffect(() => {
    const checkAlerts = () => {
      let triggeredAny = false;
      const updatedAlerts = alerts.map(alert => {
        if (!alert.active) return alert;
        
        const stock = watchlist.find(s => s.symbol === alert.symbol);
        if (!stock) return alert;

        // Extract numeric price from string like "₦38.20"
        const currentPrice = parseFloat(stock.price.replace(/[^\d.]/g, ''));
        if (isNaN(currentPrice)) return alert;

        let triggered = false;
        if (alert.type === 'above' && currentPrice >= alert.targetPrice) triggered = true;
        if (alert.type === 'below' && currentPrice <= alert.targetPrice) triggered = true;

        if (triggered) {
          triggeredAny = true;
          toast.success(`Price Alert: ${stock.symbol} has reached ₦${alert.targetPrice}!`, {
            description: `Current price: ${stock.price}`,
            duration: 10000,
          });
          return { ...alert, active: false };
        }
        return alert;
      });

      if (triggeredAny) {
        setAlerts(updatedAlerts);
      }
    };

    checkAlerts();
  }, [watchlist, alerts]);

  useEffect(() => {
    if (activeTab === 'trends' && (!marketTrends || (marketTrends.gainers.length === 0 && marketTrends.losers.length === 0))) {
      const fetchTrends = async () => {
        if (!user) {
          toast.error("Please sign in to see market trends");
          return;
        }

        if (!userProfile?.isPremium && !isAdmin && userProfile?.trendsClickCount && userProfile.trendsClickCount >= 1) {
          toast.error("Freemium limit reached: 1 Market Trend view. Upgrade for unlimited access!");
          return;
        }

        setIsTrendsLoading(true);
        try {
          const trends = await getMarketTrends();
          setMarketTrends(trends);
          
          // Increment trends click count
          if (user) {
            const userDocRef = doc(db, 'users', user.uid);
            await updateDoc(userDocRef, { trendsClickCount: increment(1) });
          }
        } catch (error) {
          console.error("Failed to fetch market trends", error);
        } finally {
          setIsTrendsLoading(false);
        }
      };
      fetchTrends();
    }
  }, [activeTab, marketTrends, user, userProfile]);

  const handleSearch = async (e?: React.FormEvent, customQuery?: string) => {
    if (e) e.preventDefault();
    const searchQuery = customQuery || query;
    if (!searchQuery.trim()) return;

    if (!user) {
      toast.error("Please sign up to analyze stocks");
      return;
    }

    if (!userProfile?.isPremium && !isAdmin && userProfile?.searchCount && userProfile.searchCount >= 1) {
      toast.error("Freemium limit reached: 1 search per account. Upgrade for unlimited access!");
      return;
    }

    setLoading(true);
    const res = await analyzeQuery(searchQuery);
    setResult(res);
    setLoading(false);

    // Increment search count
    if (user) {
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, { searchCount: increment(1) });
    }
    
    if (activeTab === 'explorer' && res.type === 'discovery') {
      // Stay on explorer tab if we are already there and it's a discovery result
      return;
    }

    if (res.type === 'analysis') setActiveTab('analysis');
    else if (res.type === 'comparison') setActiveTab('comparison');
    else if (res.type === 'discovery') setActiveTab('discovery');
    else if (res.type === 'error') setActiveTab('dashboard');
  };

  const handleVoiceSearch = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      toast.error("Voice search is not supported in your browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
      toast.info("Listening... Speak now.");
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setQuery(transcript);
      setIsListening(false);
      toast.success(`Heard: "${transcript}"`);
      handleSearch(undefined, transcript);
    };

    recognition.onerror = (event: any) => {
      setIsListening(false);
      console.error("Speech recognition error", event.error);
      if (event.error === 'not-allowed') {
        toast.error("Microphone access denied. Please enable it in your browser settings.");
      } else {
        toast.error("Could not recognize speech. Please try again.");
      }
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  const handleViewDetails = (stock: StockData) => {
    setQuery(`Analyze ${stock.symbol}`);
    handleSearch(undefined, `Analyze ${stock.symbol}`);
  };

  const handleCompareRequest = (stock: StockData) => {
    setSelectedStockForCompare(stock);
    setIsCompareModalOpen(true);
  };

  const handleCompare = (symbol1: string, symbol2: string) => {
    const comparisonQuery = `Compare ${symbol1} vs ${symbol2}`;
    setQuery(comparisonQuery);
    handleSearch(undefined, comparisonQuery);
  };

  const addToWatchlist = (stock: StockData) => {
    if (!watchlist.find(s => s.symbol === stock.symbol)) {
      setWatchlist([...watchlist, stock]);
    }
  };

  const removeFromWatchlist = (symbol: string) => {
    setWatchlist(watchlist.filter(s => s.symbol !== symbol));
  };

  const isWatched = (symbol: string) => watchlist.some(s => s.symbol === symbol);

  const addAlert = (symbol: string, targetPrice: number, type: 'above' | 'below') => {
    const newAlert: PriceAlert = {
      id: Math.random().toString(36).substr(2, 9),
      symbol,
      targetPrice,
      type,
      active: true,
      createdAt: new Date().toISOString(),
    };
    setAlerts([...alerts, newAlert]);
    toast.success(`Alert set for ${symbol} at ₦${targetPrice}`);
  };

  const removeAlert = (id: string) => {
    setAlerts(alerts.filter(a => a.id !== id));
  };

  if (isAuthLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background">
        <Loader2 className="animate-spin text-green-500" size={48} />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background text-foreground font-sans selection:bg-green-500/30">
        <Toaster position="top-right" theme={theme} />
        <AuthModal 
          isOpen={isAuthModalOpen} 
          onClose={() => setIsAuthModalOpen(false)} 
        />
        <LandingPage onSignIn={() => setIsAuthModalOpen(true)} />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background text-foreground font-sans selection:bg-green-500/30">
      <Toaster position="top-right" theme={theme} />
      {selectedStockForAlert && (
        <AlertModal 
          stock={selectedStockForAlert} 
          isOpen={isAlertModalOpen} 
          onClose={() => setIsAlertModalOpen(false)} 
          onAdd={addAlert} 
        />
      )}
      {selectedStockForCompare && (
        <CompareModal 
          isOpen={isCompareModalOpen} 
          onClose={() => setIsCompareModalOpen(false)} 
          stock={selectedStockForCompare} 
          onCompare={handleCompare} 
        />
      )}
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
      />
      <FeedbackModal 
        isOpen={isFeedbackModalOpen} 
        onClose={() => setIsFeedbackModalOpen(false)} 
        user={user}
      />
      <LessonModal 
        isOpen={isLessonModalOpen} 
        onClose={() => setIsLessonModalOpen(false)} 
        lesson={selectedLesson} 
      />
      <VoiceAgent 
        isListening={isListening} 
        startListening={handleVoiceSearch} 
        onCommand={(cmd) => handleSearch(undefined, cmd)} 
      />
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-card flex flex-col p-4 hidden lg:flex">
        <div className="flex items-center gap-2 px-4 mb-10 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
          <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
            <TrendingUp size={20} className="text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight">NGX Intel</span>
        </div>

        <nav className="space-y-1 flex-1">
          <SidebarItem 
            icon={LayoutDashboard} 
            label="Dashboard" 
            active={activeTab === 'dashboard'} 
            onClick={() => setActiveTab('dashboard')} 
          />
          <SidebarItem 
            icon={Compass} 
            label="Explorer" 
            active={activeTab === 'explorer' || activeTab === 'discovery'} 
            onClick={() => setActiveTab('explorer')} 
          />
          <SidebarItem 
            icon={Bookmark} 
            label="Watchlist" 
            active={activeTab === 'watchlist'} 
            onClick={() => setActiveTab('watchlist')} 
          />
          <SidebarItem 
            icon={PieChart} 
            label="Market Trends" 
            active={activeTab === 'trends'} 
            onClick={() => setActiveTab('trends')} 
          />
          <div className="pt-4 pb-2 px-4">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">Learning</span>
          </div>
          <SidebarItem 
            icon={BookOpen} 
            label="Academy" 
            active={activeTab === 'academy'} 
            onClick={() => setActiveTab('academy')} 
          />
          <SidebarItem 
            icon={Bell} 
            label="Feedback" 
            active={false} 
            onClick={() => setIsFeedbackModalOpen(true)} 
          />
        </nav>

        <div className="mt-auto pt-4 border-t border-border">
          {user ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 px-4 py-3 bg-foreground/5 rounded-xl">
                <div className="w-10 h-10 bg-foreground/10 rounded-full flex items-center justify-center overflow-hidden">
                  {user.photoURL ? (
                    <img src={user.photoURL} alt={user.displayName || ''} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <UserIcon size={20} className="text-gray-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate">{user.displayName || 'Investor'}</p>
                  <p className="text-[10px] text-gray-500 truncate">
                    {isAdmin ? 'Admin' : (userProfile?.isPremium ? 'Premium Plan' : 'Freemium Plan')}
                  </p>
                </div>
              </div>
              {isAdmin && (
                <div className="px-4 py-2 bg-green-500/10 border border-green-500/20 rounded-xl mb-2">
                  <p className="text-[10px] font-bold text-green-500 uppercase tracking-widest">Admin Access</p>
                </div>
              )}
              {!userProfile?.isPremium && !isAdmin && (
                <button 
                  onClick={handleUpgrade}
                  className="w-full py-3 bg-green-500 text-white font-bold rounded-xl hover:bg-green-600 transition-all flex items-center justify-center gap-2"
                >
                  <Zap size={16} /> Upgrade
                </button>
              )}
              <button 
                onClick={handleLogout}
                className="w-full py-3 bg-foreground/5 text-gray-500 font-bold rounded-xl hover:bg-red-500/10 hover:text-red-500 transition-all flex items-center justify-center gap-2"
              >
                <LogOut size={16} /> Logout
              </button>
            </div>
          ) : (
            <button 
              onClick={handleLogin}
              className="w-full py-4 bg-foreground text-background font-bold rounded-xl hover:opacity-90 transition-all flex items-center justify-center gap-2"
            >
              <UserIcon size={20} /> Sign In
            </button>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* Top Header */}
        <header className="h-16 border-b border-border flex items-center justify-between px-8 bg-background/80 backdrop-blur-md z-10">
          <div className="flex-1 max-w-2xl">
            <form onSubmit={handleSearch} className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-green-500 transition-colors" size={18} />
              <input 
                type="text"
                placeholder="Analyze GTCO, Compare Zenith vs UBA, Best dividend stocks..."
                className="w-full bg-foreground/5 border border-border rounded-full py-2 pl-10 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500/50 transition-all"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                {loading ? (
                  <Loader2 className="animate-spin text-green-500" size={18} />
                ) : (
                  <button
                    type="button"
                    onClick={handleVoiceSearch}
                    className={cn(
                      "p-1.5 rounded-full transition-all duration-300",
                      isListening ? "bg-green-500 text-white animate-pulse" : "text-gray-500 hover:text-green-500 hover:bg-green-500/10"
                    )}
                    title="Voice Search"
                  >
                    <Mic size={18} />
                  </button>
                )}
              </div>
            </form>
          </div>
          
          <div className="flex items-center gap-6 ml-8">
            <button 
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 bg-foreground/5 rounded-xl hover:bg-foreground/10 transition-all border border-border text-gray-500 hover:text-foreground"
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <div className="hidden md:flex flex-col items-end">
              <div className="flex items-center gap-2">
                <div className={cn("w-1.5 h-1.5 rounded-full bg-green-500", isRefreshing ? "animate-ping" : "animate-pulse")} />
                <span className="text-[10px] font-bold text-green-500 uppercase tracking-widest">Live Feed</span>
              </div>
              <span className="text-[8px] text-gray-500 uppercase tracking-widest font-bold">
                Updated: {lastRefreshed}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex flex-col items-end">
                <span className="text-xs font-medium text-foreground">{user?.displayName || (isAuthLoading ? 'Loading...' : 'Guest')}</span>
                <span className="text-[10px] text-gray-500">
                  {isAdmin ? 'Admin' : (userProfile?.isPremium ? 'Premium Plan' : 'Freemium Plan')}
                </span>
              </div>
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-blue-500 overflow-hidden border-2 border-border">
                {user?.photoURL && <img src={user.photoURL} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />}
              </div>
            </div>
          </div>
        </header>

        {/* Scrollable Area */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <AnimatePresence mode="wait">
            {activeTab === 'dashboard' && (
              <motion.div 
                key="dashboard"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="max-w-6xl mx-auto space-y-12 pb-20"
              >
                <div className="text-center pt-10 space-y-6">
                  <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5 }}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/10 text-green-500 rounded-full text-[10px] font-bold border border-green-500/20 tracking-widest uppercase"
                  >
                    <Zap size={12} className="fill-green-500" />
                    AI-Powered Market Intelligence
                  </motion.div>
                  <h1 className="text-6xl font-bold tracking-tight bg-gradient-to-r from-foreground via-gray-500 to-gray-700 bg-clip-text text-transparent leading-tight">
                    Smart Stock Intelligence <br /> for Nigerian Investors
                  </h1>
                  <p className="text-gray-500 text-xl max-w-2xl mx-auto leading-relaxed">
                    Analyze NGX companies, compare performance, and understand the market in plain English.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {[
                    { title: "Analyze Stocks", desc: "Get deep AI-powered insights on any listed company.", icon: Zap, color: "text-yellow-500", q: "Analyze GTCO" },
                    { title: "Compare Peers", desc: "Side-by-side comparison of banking, oil, and consumer stocks.", icon: BarChart3, color: "text-blue-500", q: "Compare Zenith vs UBA" },
                    { title: "Discover Gems", desc: "Find undervalued or high-dividend stocks effortlessly.", icon: Compass, color: "text-green-500", q: "Best dividend stocks in Nigeria" }
                  ].map((feat, i) => (
                    <motion.div 
                      key={i} 
                      whileHover={{ y: -5 }}
                      onClick={() => { setQuery(feat.q); handleSearch(undefined, feat.q); }}
                      className="bg-card border border-border p-8 rounded-3xl hover:border-foreground/10 transition-all cursor-pointer group relative overflow-hidden"
                    >
                      <div className="absolute top-0 right-0 w-32 h-32 bg-foreground/5 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-green-500/10 transition-all" />
                      <feat.icon className={cn("mb-6 relative z-10", feat.color)} size={40} />
                      <h3 className="text-2xl font-bold mb-3 group-hover:text-green-500 transition-colors relative z-10">{feat.title}</h3>
                      <p className="text-gray-500 leading-relaxed relative z-10">{feat.desc}</p>
                    </motion.div>
                  ))}
                </div>

                <div className="bg-card border border-border rounded-[2.5rem] p-10 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent pointer-events-none" />
                  <div className="relative z-10">
                    <h2 className="text-2xl font-bold mb-8 flex items-center gap-3">
                      <TrendingUp size={24} className="text-green-500" />
                      Trending on NGX
                    </h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {['GTCO', 'ZENITHBANK', 'DANGCEM', 'MTNN', 'SEPLAT', 'NESTLE', 'ACCESSCORP', 'UBA'].map((ticker) => (
                        <button 
                          key={ticker}
                          onClick={() => { setQuery(`Analyze ${ticker}`); handleSearch(undefined, `Analyze ${ticker}`); }}
                          className="flex items-center justify-between p-5 bg-foreground/5 rounded-2xl hover:bg-foreground/10 transition-all border border-transparent hover:border-border group"
                        >
                          <span className="font-bold text-lg group-hover:text-green-500 transition-colors">{ticker}</span>
                          <ArrowRight size={18} className="text-gray-500 group-hover:text-green-500 transition-all group-hover:translate-x-1" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="bg-card border border-border p-10 rounded-[2.5rem] flex flex-col justify-between">
                    <div>
                      <h3 className="text-2xl font-bold mb-4">New to Investing?</h3>
                      <p className="text-gray-500 mb-8 leading-relaxed">
                        Our Investor Academy helps you understand the basics of the Nigerian stock market, from opening a CSCS account to advanced analysis.
                      </p>
                    </div>
                    <button 
                      onClick={() => setActiveTab('academy')}
                      className="w-fit px-8 py-4 bg-foreground text-background font-bold rounded-2xl hover:opacity-90 transition-all flex items-center gap-2"
                    >
                      Go to Academy <ArrowRight size={20} />
                    </button>
                  </div>
                  <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-10 rounded-[2.5rem] text-black">
                    <h3 className="text-2xl font-bold mb-4">Build Your Watchlist</h3>
                    <p className="text-black/70 mb-8 leading-relaxed font-medium">
                      Never miss a market move. Save companies you're interested in and track their performance in real-time with AI-powered alerts.
                    </p>
                    <button 
                      onClick={() => setActiveTab('explorer')}
                      className="w-fit px-8 py-4 bg-black text-white font-bold rounded-2xl hover:bg-black/80 transition-all flex items-center gap-2"
                    >
                      Start Exploring <ArrowRight size={20} />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {(activeTab === 'analysis' || activeTab === 'comparison' || activeTab === 'discovery') && result && (
              <motion.div 
                key="search-result"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="max-w-6xl mx-auto space-y-8 pb-20"
              >
                {result.type === 'analysis' && result.data && (
                  <StockAnalysisView 
                    stock={result.data as StockData} 
                    onWatch={addToWatchlist} 
                    isWatched={isWatched((result.data as StockData).symbol)} 
                    onCompare={handleCompareRequest}
                  />
                )}

                {result.type === 'comparison' && Array.isArray(result.data) && (
                  <div className="space-y-8">
                    <div className="flex items-center justify-between">
                      <h2 className="text-3xl font-bold">Stock Comparison</h2>
                      <div className="px-4 py-2 bg-blue-400/10 text-blue-400 rounded-full text-xs font-bold border border-blue-400/20">
                        Side-by-Side Analysis
                      </div>
                    </div>
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                      {(result.data as StockData[]).map((stock, i) => (
                        <div key={i} className="space-y-6">
                          <StockAnalysisView 
                            stock={stock} 
                            compact 
                            onWatch={addToWatchlist} 
                            isWatched={isWatched(stock.symbol)} 
                            onViewDetails={handleViewDetails}
                            onCompare={handleCompareRequest}
                          />
                        </div>
                      ))}
                    </div>
                    <div className="bg-card border border-border p-8 rounded-3xl">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-bold flex items-center gap-2">
                          <Zap size={20} className="text-yellow-500" />
                          AI Comparison Verdict
                        </h3>
                        <SpeakButton text={result.message || ""} />
                      </div>
                      <div className="prose prose-invert max-w-none text-gray-500 leading-relaxed">
                        <ReactMarkdown>{result.message || ""}</ReactMarkdown>
                      </div>
                    </div>
                  </div>
                )}

                {result.type === 'discovery' && Array.isArray(result.data) && (
                  <div className="space-y-8">
                    <div className="flex flex-col gap-2">
                      <h2 className="text-3xl font-bold">Discovery Results</h2>
                      <div className="prose prose-invert max-w-none text-gray-500 leading-relaxed">
                        <ReactMarkdown>{result.message || ""}</ReactMarkdown>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {(result.data as StockData[]).map((stock, i) => (
                        <div key={i} className="bg-card border border-border p-6 rounded-2xl hover:border-green-500/30 transition-all group flex flex-col h-full">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h3 className="font-bold text-lg group-hover:text-green-500 transition-colors">{stock.name}</h3>
                              <p className="text-xs text-gray-500">{stock.symbol} • {stock.sector}</p>
                            </div>
                            <div className="text-right">
                              <LivePrice value={stock.price} change={stock.change} changePercent={stock.changePercent} size="small" />
                            </div>
                          </div>
                          <div className="flex items-center gap-2 mb-4">
                            <div className="flex-1 h-1 bg-foreground/5 rounded-full overflow-hidden">
                              <div className="h-full bg-green-500" style={{ width: `${stock.investmentScore}%` }} />
                            </div>
                            <span className="text-[10px] font-bold text-gray-500">{stock.investmentScore}</span>
                          </div>
                          <p className="text-xs text-gray-500 line-clamp-2 mb-6 flex-1">{stock.aiSummary}</p>
                          <div className="flex items-center gap-2 pt-4 border-t border-border mt-auto">
                            <button 
                              onClick={() => handleViewDetails(stock)}
                              className="flex-1 px-4 py-2 bg-foreground/5 rounded-xl hover:bg-foreground/10 transition-all border border-border text-[10px] font-bold uppercase tracking-widest text-gray-500 hover:text-foreground flex items-center justify-center gap-2"
                            >
                              More Info <ArrowRight size={12} />
                            </button>
                            <button 
                              onClick={() => addToWatchlist(stock)}
                              className="p-2 bg-foreground/5 rounded-xl hover:bg-foreground/10 transition-all border border-border"
                            >
                              <Bookmark size={16} className={isWatched(stock.symbol) ? "fill-green-500 text-green-500" : "text-gray-500"} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {result.type === 'error' && (
                  <div className="bg-red-500/10 border border-red-500/20 p-8 rounded-3xl text-center">
                    <h3 className="text-xl font-bold text-red-500 mb-2">Analysis Error</h3>
                    <p className="text-gray-500">{result.message}</p>
                    <button 
                      onClick={() => setActiveTab('dashboard')}
                      className="mt-6 px-6 py-2 bg-foreground/5 rounded-full hover:bg-foreground/10 transition-all text-sm font-medium"
                    >
                      Back to Dashboard
                    </button>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'watchlist' && (
              <motion.div 
                key="watchlist"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-6xl mx-auto space-y-8"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-3xl font-bold">My Watchlist</h2>
                    <p className="text-gray-500">Track your favorite companies and their performance.</p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">{watchlist.length}</div>
                    <div className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Companies</div>
                  </div>
                </div>

                {watchlist.length > 0 && allWatchlistTags.length > 0 && (
                  <div className="flex flex-wrap gap-2 items-center">
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mr-2">Filter by Tag:</span>
                    <button 
                      onClick={() => setSelectedWatchlistTag(null)}
                      className={cn(
                        "px-3 py-1 text-[10px] font-bold rounded-full border transition-all",
                        selectedWatchlistTag === null 
                          ? "bg-foreground text-background border-foreground" 
                          : "bg-foreground/5 text-gray-500 border-border hover:border-foreground/20"
                      )}
                    >
                      ALL
                    </button>
                    {allWatchlistTags.map(tag => (
                      <button 
                        key={tag}
                        onClick={() => setSelectedWatchlistTag(selectedWatchlistTag === tag ? null : tag)}
                        className={cn(
                          "px-3 py-1 text-[10px] font-bold rounded-full border transition-all",
                          selectedWatchlistTag === tag 
                            ? "bg-blue-500 text-white border-blue-500" 
                            : "bg-blue-500/5 text-blue-500 border-blue-500/20 hover:border-blue-500/40"
                        )}
                      >
                        {tag.toUpperCase()}
                      </button>
                    ))}
                  </div>
                )}

                {watchlist.length === 0 ? (
                  <div className="bg-card border border-border p-20 rounded-3xl text-center">
                    <div className="w-16 h-16 bg-foreground/5 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Bookmark size={32} className="text-gray-500" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">Your Watchlist is Empty</h3>
                    <p className="text-gray-500 max-w-md mx-auto mb-8">Start searching for companies and click the bookmark icon to add them to your watchlist for easy tracking.</p>
                    <button 
                      onClick={() => setActiveTab('dashboard')}
                      className="px-8 py-3 bg-green-500 text-white font-bold rounded-full hover:bg-green-600 transition-all"
                    >
                      Explore Market
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {watchlist
                      .filter(stock => !selectedWatchlistTag || (stock.tags || []).includes(selectedWatchlistTag))
                      .map((stock) => (
                      <div key={stock.symbol} className="bg-[#111] border border-white/5 p-6 rounded-2xl relative group">
                        <button 
                          onClick={() => removeFromWatchlist(stock.symbol)}
                          className="absolute top-4 right-4 p-2 bg-white/5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-400/10 hover:text-red-400"
                        >
                          <Trash2 size={16} />
                        </button>
                        <div className="flex flex-col h-full">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h3 className="font-bold text-lg group-hover:text-green-400 transition-colors">{stock.name}</h3>
                              <p className="text-xs text-gray-500">{stock.symbol} • {stock.sector}</p>
                            </div>
                            <div className="text-right">
                              <LivePrice value={stock.price} change={stock.change} changePercent={stock.changePercent} size="small" />
                            </div>
                          </div>
                          <div className="flex items-center gap-2 mb-4">
                            <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
                              <div className="h-full bg-green-400" style={{ width: `${stock.investmentScore}%` }} />
                            </div>
                            <span className="text-[10px] font-bold text-gray-400">{stock.investmentScore}</span>
                          </div>
                          <p className="text-xs text-gray-500 line-clamp-2 mb-4 flex-1">{stock.aiSummary}</p>
                          
                          <TagManager 
                            stock={stock} 
                            onAdd={(tag) => addTagToStock(stock.symbol, tag)} 
                            onRemove={(tag) => removeTagFromStock(stock.symbol, tag)} 
                          />

                          <div className="flex items-center gap-2 pt-4 border-t border-white/5 mt-4">
                            <button 
                              onClick={() => handleViewDetails(stock)}
                              className="flex-1 px-4 py-2 bg-white/5 rounded-xl hover:bg-white/10 transition-all border border-white/10 text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-white flex items-center justify-center gap-2"
                            >
                              More Info <ArrowRight size={12} />
                            </button>
                            <button 
                              onClick={() => {
                                setSelectedStockForAlert(stock);
                                setIsAlertModalOpen(true);
                              }}
                              className="p-2 bg-white/5 rounded-xl hover:bg-white/10 transition-all border border-white/10 text-gray-400 hover:text-yellow-400"
                              title="Set Price Alert"
                            >
                              <Bell size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Active Alerts Section */}
                {alerts.length > 0 && (
                  <div className="mt-12 space-y-6">
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Active Price Alerts</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {alerts.map(alert => (
                        <div key={alert.id} className={cn(
                          "p-4 rounded-2xl border flex items-center justify-between transition-all",
                          alert.active ? "bg-yellow-400/5 border-yellow-400/20" : "bg-white/5 border-white/10 opacity-50"
                        )}>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-bold">{alert.symbol}</span>
                              <span className="text-[10px] px-1.5 py-0.5 bg-white/10 rounded uppercase">
                                {alert.type}
                              </span>
                            </div>
                            <div className="text-lg font-bold">₦{alert.targetPrice}</div>
                          </div>
                          <button 
                            onClick={() => removeAlert(alert.id)}
                            className="p-2 hover:bg-white/10 rounded-lg text-gray-500 hover:text-red-400 transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'explorer' && (
              <motion.div 
                key="explorer"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-6xl mx-auto space-y-12 pb-20"
              >
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <h2 className="text-3xl font-bold">Market Explorer</h2>
                    <p className="text-gray-500">Discover companies across different sectors and sizes of the NGX.</p>
                  </div>
                  <button 
                    onClick={() => {
                      let q = "Show me top stocks on NGX";
                      if (selectedSector && selectedMarketCap) q = `Show me ${selectedMarketCap} stocks in the ${selectedSector} sector on NGX`;
                      else if (selectedSector) q = `Show me top stocks in the ${selectedSector} sector on NGX`;
                      else if (selectedMarketCap) q = `Show me ${selectedMarketCap} stocks on NGX`;
                      
                      setQuery(q);
                      handleSearch(undefined, q);
                    }}
                    disabled={loading}
                    className="px-8 py-3 bg-green-500 text-white font-bold rounded-2xl hover:bg-green-600 transition-all flex items-center gap-2 disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="animate-spin" size={18} /> : <Search size={18} />}
                    Search Market
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-1 space-y-8">
                    <div className="bg-card border border-border p-8 rounded-[2rem] space-y-8">
                      <div className="space-y-4">
                        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-[0.2em]">Market Cap</h3>
                        <div className="space-y-2">
                          {['Large Cap', 'Mid Cap', 'Small Cap'].map((cap) => (
                            <button
                              key={cap}
                              onClick={() => setSelectedMarketCap(selectedMarketCap === cap ? null : cap)}
                              className={cn(
                                "w-full flex items-center justify-between p-4 rounded-2xl border transition-all",
                                selectedMarketCap === cap 
                                  ? "bg-blue-500/10 border-blue-500/30 text-blue-500" 
                                  : "bg-foreground/5 border-transparent text-gray-500 hover:bg-foreground/10"
                              )}
                            >
                              <span className="text-sm font-bold">{cap}</span>
                              {selectedMarketCap === cap && <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-[0.2em]">Sector</h3>
                        <div className="grid grid-cols-2 gap-2">
                          {['Banking', 'Industrial', 'Consumer', 'Oil & Gas', 'Agriculture', 'ICT', 'Insurance', 'Services'].map((sector) => (
                            <button
                              key={sector}
                              onClick={() => setSelectedSector(selectedSector === sector ? null : sector)}
                              className={cn(
                                "p-3 rounded-xl border text-[10px] font-bold uppercase tracking-widest transition-all",
                                selectedSector === sector 
                                  ? "bg-green-500/10 border-green-500/30 text-green-500" 
                                  : "bg-foreground/5 border-transparent text-gray-500 hover:bg-foreground/10"
                              )}
                            >
                              {sector}
                            </button>
                          ))}
                        </div>
                      </div>

                      <button 
                        onClick={() => {
                          setSelectedSector(null);
                          setSelectedMarketCap(null);
                          setResult(null);
                        }}
                        className="w-full py-3 text-[10px] font-bold text-gray-500 uppercase tracking-widest hover:text-foreground transition-colors"
                      >
                        Reset Filters
                      </button>
                    </div>
                  </div>

                  <div className="lg:col-span-2">
                    {loading ? (
                      <div className="h-full min-h-[400px] bg-card border border-border rounded-[2rem] flex flex-col items-center justify-center text-center p-12">
                        <Loader2 className="animate-spin text-green-500 mb-6" size={48} />
                        <h3 className="text-xl font-bold mb-2">Analyzing Market Data...</h3>
                        <p className="text-gray-500 max-w-xs">Our AI is scanning the NGX for stocks matching your criteria.</p>
                      </div>
                    ) : result?.type === 'discovery' && Array.isArray(result.data) ? (
                      <div className="space-y-6">
                        <div className="flex items-center justify-between px-2">
                          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                            Found {result.data.length} Matching Stocks
                          </h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {(result.data as StockData[]).map((stock, i) => (
                            <div key={i} className="bg-card border border-border p-6 rounded-2xl hover:border-green-500/30 transition-all group flex flex-col h-full">
                              <div className="flex justify-between items-start mb-4">
                                <div>
                                  <h3 className="font-bold text-lg group-hover:text-green-500 transition-colors">{stock.name}</h3>
                                  <p className="text-xs text-gray-500">{stock.symbol} • {stock.sector}</p>
                                </div>
                                <div className="text-right">
                                  <LivePrice value={stock.price} change={stock.change} changePercent={stock.changePercent} size="small" />
                                </div>
                              </div>
                              <div className="flex items-center gap-2 mb-4">
                                <div className="flex-1 h-1 bg-foreground/5 rounded-full overflow-hidden">
                                  <div className="h-full bg-green-500" style={{ width: `${stock.investmentScore}%` }} />
                                </div>
                                <span className="text-[10px] font-bold text-gray-500">{stock.investmentScore}</span>
                              </div>
                              <p className="text-xs text-gray-500 line-clamp-2 mb-6 flex-1">{stock.aiSummary}</p>
                              <div className="flex items-center gap-2 pt-4 border-t border-border mt-auto">
                                <button 
                                  onClick={() => handleViewDetails(stock)}
                                  className="flex-1 px-4 py-2 bg-foreground/5 rounded-xl hover:bg-foreground/10 transition-all border border-border text-[10px] font-bold uppercase tracking-widest text-gray-500 hover:text-foreground flex items-center justify-center gap-2"
                                >
                                  More Info <ArrowRight size={12} />
                                </button>
                                <button 
                                  onClick={() => addToWatchlist(stock)}
                                  className="p-2 bg-foreground/5 rounded-xl hover:bg-foreground/10 transition-all border border-border"
                                >
                                  <Bookmark size={16} className={isWatched(stock.symbol) ? "fill-green-500 text-green-500" : "text-gray-500"} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="h-full min-h-[400px] bg-card border border-border rounded-[2rem] flex flex-col items-center justify-center text-center p-12">
                        <div className="w-20 h-20 bg-foreground/5 rounded-full flex items-center justify-center mb-8">
                          <Compass size={40} className="text-gray-500" />
                        </div>
                        <h3 className="text-2xl font-bold mb-3">Explore the Market</h3>
                        <p className="text-gray-500 max-w-sm mx-auto">
                          Select a market cap and sector to discover top-performing companies listed on the Nigerian Exchange.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'trends' && (
              <motion.div 
                key="trends"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-6xl mx-auto space-y-8"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-3xl font-bold">Market Trends</h2>
                    <div className="flex items-center gap-2">
                      <p className="text-gray-500">Real-time insights into the Nigerian Exchange performance.</p>
                      {marketTrends?.lastUpdated && (
                        <span className="text-[10px] text-gray-500 bg-foreground/5 px-2 py-0.5 rounded-full">
                          Updated: {marketTrends.lastUpdated}
                        </span>
                      )}
                    </div>
                  </div>
                  <button 
                    onClick={async () => {
                      setIsTrendsLoading(true);
                      const trends = await getMarketTrends();
                      setMarketTrends(trends);
                      setIsTrendsLoading(false);
                    }}
                    disabled={isTrendsLoading}
                    className="flex items-center gap-2 px-4 py-2 bg-foreground/5 rounded-xl hover:bg-foreground/10 transition-all border border-border text-xs font-bold text-gray-500 hover:text-foreground disabled:opacity-50"
                  >
                    {isTrendsLoading ? <Loader2 size={14} className="animate-spin" /> : <Activity size={14} />}
                    Refresh Trends
                  </button>
                </div>

                {isTrendsLoading && !marketTrends ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {[1, 2].map(i => (
                      <div key={i} className="bg-card border border-border p-8 rounded-3xl animate-pulse">
                        <div className="h-6 w-48 bg-foreground/5 rounded mb-8" />
                        <div className="space-y-4">
                          {[1, 2, 3, 4, 5].map(j => (
                            <div key={j} className="h-16 bg-foreground/5 rounded-2xl" />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (marketTrends && (marketTrends.gainers.length > 0 || marketTrends.losers.length > 0)) ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="bg-card border border-border p-8 rounded-3xl">
                      <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                        <TrendingUp size={20} className="text-green-500" />
                        Top Gainers Today
                      </h3>
                      <div className="space-y-4">
                        {marketTrends.gainers.map((stock, i) => (
                          <div key={i} className="flex items-center justify-between p-4 bg-foreground/5 rounded-2xl hover:bg-foreground/10 transition-all cursor-pointer" onClick={() => { setQuery(`Analyze ${stock.symbol}`); handleSearch(undefined, `Analyze ${stock.symbol}`); }}>
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 bg-green-500/10 rounded-xl flex items-center justify-center text-green-500 font-bold text-xs">
                                {stock.symbol.slice(0, 2)}
                              </div>
                              <div>
                                <div className="font-bold text-sm">{stock.name}</div>
                                <div className="text-[10px] text-gray-500">{stock.symbol}</div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-bold text-sm">{stock.price}</div>
                              <div className="text-xs text-green-500 font-bold">{stock.change}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-card border border-border p-8 rounded-3xl">
                      <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                        <TrendingDown size={20} className="text-red-500" />
                        Top Losers Today
                      </h3>
                      <div className="space-y-4">
                        {marketTrends.losers.map((stock, i) => (
                          <div key={i} className="flex items-center justify-between p-4 bg-foreground/5 rounded-2xl hover:bg-foreground/10 transition-all cursor-pointer" onClick={() => { setQuery(`Analyze ${stock.symbol}`); handleSearch(undefined, `Analyze ${stock.symbol}`); }}>
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 bg-red-500/10 rounded-xl flex items-center justify-center text-red-500 font-bold text-xs">
                                {stock.symbol.slice(0, 2)}
                              </div>
                              <div>
                                <div className="font-bold text-sm">{stock.name}</div>
                                <div className="text-[10px] text-gray-500">{stock.symbol}</div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-bold text-sm">{stock.price}</div>
                              <div className="text-xs text-red-500 font-bold">{stock.change}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-card border border-border p-20 rounded-3xl text-center">
                    <div className="w-16 h-16 bg-foreground/5 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Activity size={32} className="text-gray-500" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">No Trends Data Available</h3>
                    <p className="text-gray-500 max-w-md mx-auto mb-8">We couldn't fetch the latest market trends. Please try refreshing.</p>
                    <button 
                      onClick={async () => {
                        setIsTrendsLoading(true);
                        const trends = await getMarketTrends();
                        setMarketTrends(trends);
                        setIsTrendsLoading(false);
                      }}
                      className="px-8 py-3 bg-green-500 text-white font-bold rounded-full hover:bg-green-600 transition-all"
                    >
                      Retry Fetching
                    </button>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'academy' && (
              <motion.div 
                key="academy"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-6xl mx-auto space-y-12 pb-20"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-4xl font-bold mb-2">Investor Academy</h2>
                    <p className="text-gray-500 text-lg">Master the art of investing in the Nigerian stock market (NGX).</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {[
                    { 
                      title: 'NGX Basics: Getting Started', 
                      desc: 'The foundation of your investment journey in Nigeria.', 
                      icon: <BookOpen size={24} />, 
                      level: 'Beginner', 
                      time: '7 min read', 
                      content: "To start investing on the NGX, you need three things: 1. A CSCS (Central Securities Clearing System) account, which acts as your digital vault for shares. 2. A stockbroker licensed by the SEC. 3. Capital.",
                      fullContent: `
### How to Get Started with NGX Investment

Investing in the Nigerian Stock Exchange (NGX) is one of the most effective ways to build long-term wealth in Nigeria. Whether you're a student, a professional, or a business owner, the market offers opportunities for everyone.

#### Step 1: Understand the Requirements
To start your journey, you need three fundamental things:
1. **CSCS Account:** The Central Securities Clearing System (CSCS) is the "digital vault" where all your shares are stored. You don't get physical paper certificates anymore; everything is electronic.
2. **Stockbroker:** You cannot buy shares directly from the NGX. You must go through a licensed stockbroking firm. They act as intermediaries between you and the exchange.
3. **Bank Account & BVN:** You'll need a Nigerian bank account and your Bank Verification Number (BVN) for identity verification.

#### Step 2: Choose Your Platform
In the past, you had to visit a physical office to trade. Today, you can use modern apps like:
*   **Bamboo, Chaka, or Trove:** These apps allow you to buy NGX stocks alongside US stocks.
*   **Traditional Broker Apps:** Many top brokers like Stanbic IBTC Stockbrokers or CardinalStone have their own mobile apps.

#### Step 3: Fund Your Account and Start Small
You don't need millions to start. Many stocks on the NGX trade for less than ₦50 per share. The minimum units you can buy is usually 100. 

**Pro Tip:** Start with "Blue Chip" companies—large, stable companies with a history of profit, like GTCO, Zenith Bank, or Dangote Cement.
                      `
                    },
                    { 
                      title: 'Fundamental Analysis: The NGX Way', 
                      desc: 'How to pick winning companies by looking at their numbers.', 
                      icon: <BarChart3 size={24} />, 
                      level: 'Intermediate', 
                      time: '10 min read', 
                      content: "In the Nigerian market, focus on: 1. Dividend Yield (aim for 8-15% for top banks). 2. P/E Ratio (NGX average is often lower than US markets, look for under 10x). 3. Earnings Growth.",
                      fullContent: `
### Fundamental Analysis in the Nigerian Market

Fundamental analysis is the process of looking at a business's health to determine if its stock is a good investment. In Nigeria, certain metrics carry more weight than others.

#### 1. Dividend Yield (Passive Income)
Nigerian investors love dividends. The "Dividend Yield" tells you how much a company pays out in dividends relative to its share price. 
*   **What to look for:** Aim for yields between 8% and 15%. Top tier banks like Zenith and GTCO are famous for high yields.

#### 2. P/E Ratio (Price-to-Earnings)
The P/E ratio tells you how much you are paying for every ₦1 of profit the company makes. 
*   **The NGX Context:** While US tech stocks might have P/E ratios of 50x, many solid Nigerian companies trade at 3x to 8x. This often means they are "undervalued" or cheap.

#### 3. Earnings Per Share (EPS) Growth
Is the company making more money this year than last year? Consistent EPS growth over 3-5 years is a sign of a healthy, growing business.

#### 4. The "Tier 1" Factor
In the banking sector, look for "FUGAZ" (First Bank, UBA, GTCO, Access, Zenith). these are the Tier 1 banks that dominate the market and are generally considered safer bets.
                      `
                    },
                    { 
                      title: 'Dividend Aristocrats of Nigeria', 
                      desc: 'Building a passive income stream with the most reliable payers.', 
                      icon: <Zap size={24} />, 
                      level: 'Beginner', 
                      time: '8 min read', 
                      content: "Nigerian 'Dividend Aristocrats' are companies that have paid dividends consistently for years. Top names include Zenith Bank, GTCO, Dangote Cement, and MTN Nigeria.",
                      fullContent: `
### Building Wealth with Nigerian Dividend Aristocrats

A "Dividend Aristocrat" is a company that has a long and reliable history of paying dividends to its shareholders. In Nigeria, dividends are a primary driver of stock market returns.

#### Why Dividends Matter in Nigeria
With high inflation, receiving cash payouts twice a year (Interim and Final dividends) helps investors maintain liquidity and reinvest for compound growth.

#### Top Dividend Payers to Watch
1. **Zenith Bank & GTCO:** These are the kings of dividends in the banking sector. They have never missed a payout in over a decade.
2. **Dangote Cement:** As the largest company on the NGX, it pays massive dividends due to its dominant market position.
3. **MTN Nigeria:** A "cash cow" in the telecoms sector with high margins and consistent payouts.
4. **Nestle Nigeria:** A favorite for defensive investors who want stability and regular income.

#### The Dividend Calendar
*   **Interim Dividends:** Usually paid around August/September based on half-year results.
*   **Final Dividends:** Usually paid around April/May after the full-year audited results are released at the Annual General Meeting (AGM).
                      `
                    },
                    { 
                      title: 'Technical Analysis & Market Timing', 
                      desc: 'Using charts to identify entry and exit points.', 
                      icon: <TrendingUp size={24} />, 
                      level: 'Advanced', 
                      time: '12 min read', 
                      content: "While fundamentals tell you *what* to buy, technicals tell you *when*. Watch the 50-day and 200-day Moving Averages. In the NGX, volume is a key indicator.",
                      fullContent: `
### Mastering Charts: Technical Analysis for the NGX

Technical analysis involves studying past market data, primarily price and volume, to predict future price movements.

#### 1. Moving Averages (The Trend is Your Friend)
*   **50-Day MA:** Shows the short-term trend.
*   **200-Day MA:** Shows the long-term "health" of the stock.
When the price stays above the 200-day MA, the stock is in a long-term uptrend.

#### 2. Support and Resistance
*   **Support:** The price level where a stock tends to stop falling and "bounce" back up. In Nigeria, this is often where pension funds start buying.
*   **Resistance:** The price level where a stock struggles to break above.

#### 3. Volume: The Secret Ingredient
In the NGX, volume is critical. A price increase on **low volume** is often a "fake out." A price increase on **high volume** suggests that big institutional investors are buying in, which is a strong bullish signal.

#### 4. Relative Strength Index (RSI)
RSI tells you if a stock is "Overbought" (above 70) or "Oversold" (below 30). Buying a great company when its RSI is below 30 is often a winning strategy.
                      `
                    },
                    { 
                      title: 'Inflation & Currency Hedging', 
                      desc: 'Protecting your wealth against Naira devaluation.', 
                      icon: <Shield size={24} />, 
                      level: 'Intermediate', 
                      time: '10 min read', 
                      content: "With high inflation in Nigeria, stocks are a key hedge. Focus on companies with 'Dollar-linked' earnings, such as Seplat Energy or companies with strong export components.",
                      fullContent: `
### Protecting Your Wealth: Hedging Against Inflation

In an environment with high inflation and currency fluctuations, simply saving cash in a bank account can lead to a loss of purchasing power. Investing in the right NGX stocks can protect you.

#### 1. Asset-Rich Companies
Companies like **Dangote Cement** or **BUA Foods** own massive physical factories and land. As the cost of building these things rises with inflation, the value of the company's assets (and its stock) tends to rise as well.

#### 2. Dollar-Linked Revenues
Some companies on the NGX earn their revenue in US Dollars but report in Naira.
*   **Seplat Energy:** Sells oil in USD. When the Naira weakens, their Naira-reported profits skyrocket.
*   **MTN Nigeria:** While they earn in Naira, their infrastructure costs are often USD-linked, but their dominant market position allows them to adjust pricing to protect margins.

#### 3. Pricing Power
Look for companies that can raise their prices without losing customers. Consumer goods giants like **Nestle** or **Unilever** often have this "pricing power," allowing them to pass inflation costs on to consumers and maintain profits for shareholders.
                      `
                    },
                    { 
                      title: 'Portfolio Diversification', 
                      desc: 'Spreading risk across sectors and asset classes.', 
                      icon: <PieChart size={24} />, 
                      level: 'Beginner', 
                      time: '6 min read', 
                      content: "Don't put all your eggs in one basket. A balanced NGX portfolio might include: 40% Banking, 30% Industrial, 20% Telecoms, and 10% Consumer Goods.",
                      fullContent: `
### Diversification: The Only Free Lunch in Investing

Diversification is the practice of spreading your investments around so that your exposure to any one type of asset is limited. This helps reduce risk.

#### Sector Diversification in Nigeria
The NGX is dominated by a few key sectors. A well-diversified portfolio should touch them all:
1.  **Banking (The Engine):** High dividends and liquidity. (e.g., GTCO, Zenith)
2.  **Industrial (The Builders):** Infrastructure growth. (e.g., Dangote Cement, BUA Cement)
3.  **Consumer Goods (The Essentials):** Stability during downturns. (e.g., Nestle, Guinness)
4.  **Telecoms (The Future):** Digital growth and data consumption. (e.g., MTN, Airtel)
5.  **Oil & Gas (The Hedge):** Protection against currency shifts. (e.g., Seplat)

#### The 5-10-20 Rule
*   Don't put more than **20%** of your money in one sector.
*   Don't put more than **10%** of your money in one single stock.
*   Keep at least **5%** in cash or near-cash (like Money Market funds) to buy opportunities when the market dips.
                      `
                    },
                  ].map((course, i) => (
                    <div 
                      key={i} 
                      onClick={() => {
                        if (!userProfile?.isPremium && i > 0) {
                          toast.error("Upgrade to Premium to access this lesson!");
                          return;
                        }
                        setSelectedLesson(course);
                        setIsLessonModalOpen(true);
                      }}
                      className={cn(
                        "bg-card border border-border p-8 rounded-3xl transition-all group flex flex-col h-full relative",
                        (!userProfile?.isPremium && i > 0) ? "opacity-60 cursor-not-allowed" : "hover:border-blue-500/30 cursor-pointer"
                      )}
                    >
                      {!userProfile?.isPremium && i > 0 && (
                        <div className="absolute top-4 right-4 text-gray-500">
                          <Lock size={16} />
                        </div>
                      )}
                      <div className="flex justify-between items-start mb-6">
                        <div className="w-12 h-12 bg-foreground/5 rounded-2xl flex items-center justify-center text-gray-500 group-hover:text-blue-500 transition-colors">
                          {course.icon}
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <span className="px-3 py-1 bg-blue-500/10 text-blue-500 text-[10px] font-bold rounded-full border border-blue-500/20">
                            {course.level}
                          </span>
                          <span className="text-[10px] text-gray-500">{course.time}</span>
                        </div>
                      </div>
                      <h3 className="text-2xl font-bold mb-3 group-hover:text-blue-500 transition-colors">{course.title}</h3>
                      <p className="text-gray-500 leading-relaxed mb-6 flex-1">{course.desc}</p>
                      
                      <button 
                        disabled={!userProfile?.isPremium && i > 0}
                        className={cn(
                          "flex items-center justify-center w-full py-4 text-xs font-bold rounded-2xl transition-all gap-2",
                          (!userProfile?.isPremium && i > 0) 
                            ? "bg-foreground/5 text-gray-500" 
                            : "bg-foreground/5 text-blue-500 hover:bg-blue-500 hover:text-white group-hover:bg-blue-500 group-hover:text-white"
                        )}
                      >
                        {(!userProfile?.isPremium && i > 0) ? "LOCKED" : "READ FULL ARTICLE"} <ChevronRight size={14} />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="bg-card border border-border p-10 rounded-[2.5rem] relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent pointer-events-none" />
                  <div className="relative z-10">
                    <h2 className="text-2xl font-bold mb-8 flex items-center gap-3">
                      <Globe size={24} className="text-blue-500" />
                      Recommended Resources
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {[
                        { name: 'NGX Official Site', url: 'https://ngxgroup.com', desc: 'Official market data, news, and listed company reports.' },
                        { name: 'Nairametrics', url: 'https://nairametrics.com', desc: 'Leading financial news and analysis for the Nigerian market.' },
                        { name: 'Proshare Nigeria', url: 'https://proshare.co', desc: 'Deep-dive research and professional market intelligence.' },
                        { name: 'Investopedia', url: 'https://investopedia.com', desc: 'Global standard for financial education and terminology.' },
                        { name: 'SEC Nigeria', url: 'https://sec.gov.ng', desc: 'Regulatory body for the Nigerian capital market.' },
                        { name: 'TradingView', url: 'https://tradingview.com', desc: 'Best-in-class charting tools for technical analysis.' }
                      ].map((res) => (
                        <a 
                          key={res.name}
                          href={res.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-6 bg-foreground/5 rounded-2xl hover:bg-foreground/10 transition-all border border-border hover:border-blue-500/30 group"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-bold group-hover:text-blue-500 transition-colors">{res.name}</h4>
                            <ArrowUpRight size={16} className="text-gray-500 group-hover:text-blue-500 transition-all" />
                          </div>
                          <p className="text-xs text-gray-500 leading-relaxed">{res.desc}</p>
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'profile' && (
              <ProfileView 
                user={{ name: 'Sasdraze', email: 'Sasdraze@gmail.com', plan: 'Premium Plan' }} 
                watchlistCount={watchlist.length}
                notificationsEnabled={notificationsEnabled}
                setNotificationsEnabled={setNotificationsEnabled}
                movementThreshold={movementThreshold}
                setMovementThreshold={setMovementThreshold}
              />
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
