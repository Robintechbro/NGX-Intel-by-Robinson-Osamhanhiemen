import React, { useState, useEffect } from 'react';
import { 
  Trophy, 
  Target, 
  TrendingUp, 
  Zap, 
  ArrowUpRight, 
  ArrowDownRight, 
  ShieldCheck, 
  Loader2,
  Calendar,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { InvestorProfile, StockData } from '../types';
import { getTopGradedStocks } from '../services/geminiService';

interface GradedStock extends StockData {
  grade: string;
  strengthScore: number;
  outlook: string;
}

export const StockGradingView = ({ profile, onSelect }: { profile?: InvestorProfile, onSelect: (symbol: string) => void }) => {
  const [timeframe, setTimeframe] = useState<'month' | 'quarter'>('month');
  const [stocks, setStocks] = useState<GradedStock[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await getTopGradedStocks(timeframe, profile);
      setStocks(data.stocks as GradedStock[]);
    } catch (error) {
      console.error("Error fetching graded stocks", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [timeframe, profile]);

  const getRankColor = (grade: string) => {
    if (grade.startsWith('A')) return 'text-green-500 border-green-500/20 bg-green-500/10';
    if (grade.startsWith('B')) return 'text-blue-500 border-blue-500/20 bg-blue-500/10';
    return 'text-gray-500 border-gray-500/20 bg-gray-500/10';
  };

  return (
    <div className="max-w-7xl mx-auto space-y-12 pb-24">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 px-4">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-500/10 text-green-500 rounded-full border border-green-500/20">
            <Trophy size={14} />
            <span className="text-[10px] font-black uppercase tracking-widest">Strength Ranking</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-black tracking-tighter">Elite Alpha Selection</h2>
          <p className="text-gray-500 max-w-xl">
            We've analyzed the top 50 NGX companies of the last {timeframe} and graded them based on fundamental resilient and technical momentum.
          </p>
        </div>

        <div className="flex bg-foreground/5 p-1 rounded-2xl border border-border w-fit">
          {(['month', 'quarter'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTimeframe(t)}
              className={cn(
                "px-6 py-2 rounded-xl text-xs font-black transition-all capitalize whitespace-nowrap",
                timeframe === t 
                  ? "bg-card text-foreground shadow-lg border border-border" 
                  : "text-gray-500 hover:text-foreground"
              )}
            >
              Past {t}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-40 gap-4">
          <Loader2 size={48} className="text-green-500 animate-spin opacity-20" />
          <p className="text-gray-500 font-bold tracking-widest uppercase text-xs">Analyzing Strength Dynamics...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 px-4">
          {/* Top 3 Strongest (Elite Tier) */}
          <div className="lg:col-span-12 grid grid-cols-1 md:grid-cols-3 gap-6">
            {stocks.slice(0, 3).map((stock, i) => (
              <motion.div
                key={stock.symbol}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
                className="bg-card border border-border p-8 rounded-[3rem] relative overflow-hidden group hover:border-green-500/40 transition-all shadow-xl hover:shadow-green-500/10"
              >
                <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                  <ShieldCheck size={180} className="text-green-500" />
                </div>
                
                <div className="relative z-10 space-y-6">
                  <div className="flex justify-between items-start">
                    <div className="w-16 h-16 bg-foreground/5 rounded-[1.5rem] flex items-center justify-center font-black text-xl border border-border group-hover:bg-green-500/10 group-hover:text-green-500 transition-colors">
                      {stock.symbol}
                    </div>
                    <div className={cn(
                      "w-12 h-12 rounded-full border flex items-center justify-center font-black text-lg",
                      getRankColor(stock.grade)
                    )}>
                      {stock.grade}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-2xl font-black tracking-tight mb-1">{stock.name}</h3>
                    <div className="flex flex-wrap items-center gap-2">
                       <span className="text-xl font-black">{stock.price}</span>
                       <span className={cn(
                         "text-xs font-bold flex items-center px-1.5 py-0.5 rounded-full bg-foreground/5",
                         stock.change.startsWith('+') ? "text-green-500" : "text-red-500"
                       )}>
                         {stock.change.startsWith('+') ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                         {stock.change}
                       </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div className="bg-foreground/5 p-3 rounded-2xl border border-border/50">
                      <span className="text-[8px] font-black uppercase tracking-widest text-gray-500 block mb-1">Sector</span>
                      <span className="text-[10px] font-black truncate block">{stock.sector}</span>
                    </div>
                    <div className="bg-foreground/5 p-3 rounded-2xl border border-border/50">
                      <span className="text-[8px] font-black uppercase tracking-widest text-gray-500 block mb-1">Market Cap</span>
                      <span className="text-[10px] font-black truncate block">{stock.marketCap}</span>
                    </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t border-border">
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Technical Strength</span>
                        <span className="text-xs font-black text-green-500">{stock.strengthScore}%</span>
                      </div>
                      <div className="h-1.5 bg-foreground/5 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${stock.strengthScore}%` }}
                          className="h-full bg-green-500"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <span className="text-[8px] font-black uppercase tracking-[0.2em] text-gray-400">Technical Reasoning</span>
                      <p className="text-xs text-gray-500 leading-relaxed italic line-clamp-3">
                        "{stock.outlook}"
                      </p>
                    </div>

                    <button 
                      onClick={() => onSelect(stock.symbol)}
                      className="w-full py-4 bg-foreground text-background font-black text-xs uppercase tracking-widest rounded-2xl hover:opacity-90 transition-all flex items-center justify-center gap-2"
                    >
                      Full Analysis <Zap size={14} className="fill-current" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Next 7 (Runner Ups) */}
          <div className="lg:col-span-12 space-y-4">
             <div className="flex items-center gap-2 px-2 mb-6">
                <Target size={20} className="text-blue-500" />
                <h3 className="text-xl font-bold">Watchlist Runner-Ups</h3>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {stocks.slice(3, 10).map((stock, i) => (
                  <motion.div
                    key={stock.symbol}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 + 0.3 }}
                    onClick={() => onSelect(stock.symbol)}
                    className="bg-card border border-border p-6 rounded-3xl hover:border-blue-500/30 transition-all group flex items-center justify-between cursor-pointer"
                  >
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                       <div className="w-12 h-12 bg-foreground/5 rounded-2xl flex items-center justify-center font-bold text-sm shrink-0 border border-border">
                          {stock.symbol}
                       </div>
                       <div className="min-w-0 flex-1">
                          <h4 className="font-bold text-md group-hover:text-blue-500 transition-colors truncate">{stock.name}</h4>
                          <div className="flex items-center gap-2 py-0.5">
                            <span className="text-[8px] text-gray-500 font-black uppercase tracking-widest px-1.5 py-0.5 bg-foreground/5 rounded border border-border/30">{stock.sector}</span>
                            <span className="text-[8px] text-gray-500 font-bold uppercase tracking-widest">{stock.marketCap}</span>
                          </div>
                       </div>
                    </div>

                    <div className="hidden lg:block flex-1 px-4">
                       <p className="text-[10px] text-gray-400 italic line-clamp-1 border-l border-border pl-4">
                         {stock.outlook}
                       </p>
                    </div>

                    <div className="flex items-center gap-6 shrink-0">
                       <div className="text-right hidden sm:block">
                          <div className="text-sm font-black">{stock.price}</div>
                          <div className="text-[10px] font-bold text-green-500">{stock.changePercent}</div>
                       </div>
                       <div className={cn(
                          "w-10 h-10 rounded-xl border flex items-center justify-center font-black text-sm",
                          getRankColor(stock.grade)
                       )}>
                          {stock.grade}
                       </div>
                    </div>
                  </motion.div>
                ))}
             </div>
          </div>

          {/* AI Strategy Insights Card */}
          <div className="lg:col-span-12">
            <div className="bg-gradient-to-br from-indigo-600 to-blue-700 p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden">
               <div className="absolute top-0 right-0 p-12 opacity-10">
                  <Sparkles size={240} />
               </div>
               
               <div className="relative z-10 max-w-4xl space-y-6">
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 rounded-full border border-white/20">
                     <Zap size={14} className="fill-white" />
                     <span className="text-[10px] font-black uppercase tracking-widest">AI Strategic Overlay</span>
                  </div>
                  <h3 className="text-3xl md:text-4xl font-black tracking-tight">Market Momentum Perspective</h3>
                  <p className="text-white/80 text-lg leading-relaxed">
                    Based on your **{profile?.style?.replace('_', ' ') || 'Moderate'}** profile, the AI identifies 
                    **{stocks[0]?.name}** as your strongest high-conviction play. While the top 10 are all outperforming the ASI (All-Share Index), 
                    the Elite Tier (A Grades) show the highest decoupling from overall market volatility.
                  </p>
                  
                  <div className="flex flex-wrap gap-4 pt-4">
                     <div className="bg-white/10 border border-white/20 px-6 py-4 rounded-2xl flex flex-col items-center min-w-[140px]">
                        <span className="text-[10px] font-black opacity-60 uppercase mb-2">Buy Conviction</span>
                        <span className="text-2xl font-black">HIGH</span>
                     </div>
                     <div className="bg-white/10 border border-white/20 px-6 py-4 rounded-2xl flex flex-col items-center min-w-[140px]">
                        <span className="text-[10px] font-black opacity-60 uppercase mb-2">Alpha Potential</span>
                        <span className="text-2xl font-black">18.4%</span>
                     </div>
                     <div className="bg-white/10 border border-white/20 px-6 py-4 rounded-2xl flex flex-col items-center min-w-[140px]">
                        <span className="text-[10px] font-black opacity-60 uppercase mb-2">Sector Focus</span>
                        <span className="text-2xl font-black">Industrial</span>
                     </div>
                  </div>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
