import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Calendar, 
  Clock, 
  ChevronRight, 
  Zap, 
  Shield, 
  AlertTriangle,
  Loader2,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { MarketInsights, TopPick } from '../types';
import { getMarketInsights } from '../services/geminiService';
import ReactMarkdown from 'react-markdown';
import { toast } from 'sonner';

export const MarketInsightsView = () => {
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [insights, setInsights] = useState<MarketInsights | null>(null);
  const [weeklyPicks, setWeeklyPicks] = useState<TopPick[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingWeekly, setLoadingWeekly] = useState(false);

  const fetchInsights = async (p: 'daily' | 'weekly' | 'monthly') => {
    setLoading(true);
    try {
      const data = await getMarketInsights(p);
      setInsights(data);
      
      // If we're not on weekly, fetch weekly picks for the spotlight
      if (p !== 'weekly' && weeklyPicks.length === 0) {
        fetchWeeklySpotlight();
      } else if (p === 'weekly') {
        setWeeklyPicks(data.topPicks);
      }
    } catch (error) {
      toast.error("Failed to fetch market insights");
    } finally {
      setLoading(false);
    }
  };

  const fetchWeeklySpotlight = async () => {
    setLoadingWeekly(true);
    try {
      const data = await getMarketInsights('weekly');
      setWeeklyPicks(data.topPicks);
    } catch (error) {
      console.error("Failed to fetch weekly spotlight", error);
    } finally {
      setLoadingWeekly(false);
    }
  };

  useEffect(() => {
    fetchInsights(period);
  }, [period]);

  const riskColors = {
    Low: 'text-green-500 bg-green-500/10 border-green-500/20',
    Medium: 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20',
    High: 'text-red-500 bg-red-500/10 border-red-500/20'
  };

  const riskIcons = {
    Low: <Shield size={12} />,
    Medium: <AlertTriangle size={12} />,
    High: <Zap size={12} />
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-bold mb-2">Market Insights</h1>
          <p className="text-gray-500">AI-powered analysis of the best investment opportunities on the NGX.</p>
        </div>
        
        <div className="flex bg-foreground/5 p-1 rounded-2xl border border-border w-fit">
          {(['daily', 'weekly', 'monthly'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={cn(
                "px-6 py-2 rounded-xl text-sm font-bold transition-all capitalize",
                period === p 
                  ? "bg-card text-foreground shadow-sm" 
                  : "text-gray-500 hover:text-foreground"
              )}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 space-y-4">
          <Loader2 size={48} className="animate-spin text-green-500 opacity-20" />
          <div className="text-center">
            <h3 className="text-xl font-bold mb-1">Analyzing Market Data...</h3>
            <p className="text-gray-500">Our AI is scanning the NGX for the best {period} opportunities.</p>
          </div>
        </div>
      ) : insights && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card border border-border p-8 rounded-3xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <Zap size={24} className="text-yellow-500" />
                  Market Summary
                </h2>
                <div className="flex items-center gap-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                  <Clock size={12} />
                  Last Updated: {insights.lastUpdated}
                </div>
              </div>
              <div className="prose prose-invert max-w-none text-gray-400 leading-relaxed">
                <ReactMarkdown>{insights.marketSummary}</ReactMarkdown>
              </div>
            </motion.div>

            <div className="space-y-4">
              <h2 className="text-2xl font-bold flex items-center gap-2 px-2">
                <TrendingUp size={24} className="text-green-500" />
                Top 5 {period === 'daily' ? 'Daily' : period === 'weekly' ? 'Weekly' : 'Monthly'} Picks
              </h2>
              
              <div className="grid grid-cols-1 gap-4">
                {insights.topPicks.map((pick, i) => (
                  <motion.div
                    key={pick.symbol}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="bg-card border border-border p-6 rounded-3xl hover:border-green-500/30 transition-all group"
                  >
                    <div className="flex flex-col md:flex-row gap-6">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-foreground/5 rounded-2xl flex items-center justify-center font-bold text-lg group-hover:bg-green-500/10 group-hover:text-green-500 transition-colors">
                              {pick.symbol}
                            </div>
                            <div>
                              <h3 className="font-bold text-lg">{pick.name}</h3>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-bold">{pick.price}</span>
                                <span className={cn(
                                  "text-xs font-bold flex items-center gap-0.5",
                                  pick.change.startsWith('+') ? "text-green-500" : "text-red-500"
                                )}>
                                  {pick.change.startsWith('+') ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                                  {pick.change}
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          <div className={cn(
                            "px-3 py-1 rounded-full border text-[10px] font-bold flex items-center gap-1.5 uppercase tracking-widest",
                            riskColors[pick.riskLevel]
                          )}>
                            {riskIcons[pick.riskLevel]}
                            {pick.riskLevel} Risk
                          </div>
                        </div>
                        
                        <p className="text-sm text-gray-400 leading-relaxed mb-4">
                          {pick.reason}
                        </p>
                        
                        <div className="flex items-center gap-6">
                          <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Est. Gain Potential</span>
                            <span className="text-lg font-bold text-green-500">{pick.gainPotential}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-8">
            <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-8 rounded-3xl text-white shadow-xl shadow-green-500/20">
              <h3 className="text-xl font-bold mb-4">Why Invest Now?</h3>
              <p className="text-white/80 text-sm leading-relaxed mb-6">
                The Nigerian market is currently showing unique opportunities in the {period} timeframe. Our AI analysis suggests these sectors are poised for growth.
              </p>
              <ul className="space-y-3">
                {[
                  "Market liquidity is improving",
                  "Sector-specific policy tailwinds",
                  "Strong dividend yield potential",
                  "Undervalued blue-chip opportunities"
                ].map((text, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm font-medium">
                    <div className="w-1.5 h-1.5 rounded-full bg-white" />
                    {text}
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-card border border-border p-8 rounded-3xl">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Shield size={20} className="text-blue-500" />
                Risk Assessment
              </h3>
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-bold">Market Volatility</span>
                    <span className="text-sm font-bold text-yellow-500">Moderate</span>
                  </div>
                  <div className="h-2 bg-foreground/5 rounded-full overflow-hidden">
                    <div className="h-full bg-yellow-500 w-[60%]" />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-bold">Liquidity Risk</span>
                    <span className="text-sm font-bold text-green-500">Low</span>
                  </div>
                  <div className="h-2 bg-foreground/5 rounded-full overflow-hidden">
                    <div className="h-full bg-green-500 w-[30%]" />
                  </div>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Always diversify your portfolio. These insights are AI-generated and should be used as a starting point for your own research.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Weekly Spotlight Section */}
      <div className="space-y-8 pt-12 border-t border-border">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-2">
          <div>
            <h2 className="text-3xl font-bold flex items-center gap-3">
              <Calendar size={32} className="text-blue-500" />
              Top 5 Weekly Stock Picks
            </h2>
            <p className="text-gray-500 mt-1">Expert AI assessment of the best opportunities for the coming week.</p>
          </div>
          <div className="flex items-center gap-2 text-xs font-bold text-blue-500 bg-blue-500/10 px-4 py-2 rounded-xl border border-blue-500/20 uppercase tracking-widest">
            <Zap size={14} />
            Updated Weekly
          </div>
        </div>

        {loadingWeekly && weeklyPicks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-foreground/5 rounded-[2.5rem] border border-dashed border-border">
            <Loader2 size={32} className="animate-spin text-blue-500 mb-4" />
            <p className="text-gray-500 font-medium">Generating weekly spotlight...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            {weeklyPicks.map((pick, i) => (
              <motion.div
                key={pick.symbol}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
                className="bg-card border border-border p-6 rounded-[2rem] hover:border-blue-500/40 hover:shadow-2xl hover:shadow-blue-500/10 transition-all group relative flex flex-col h-full"
              >
                <div className="absolute -top-12 -right-12 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                  <TrendingUp size={120} className="text-blue-500" />
                </div>
                
                <div className="relative z-10 flex flex-col h-full">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-blue-500/10 text-blue-500 rounded-2xl flex items-center justify-center font-black text-lg shadow-inner">
                      {pick.symbol}
                    </div>
                    <div className={cn(
                      "px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-tighter flex items-center gap-1",
                      riskColors[pick.riskLevel]
                    )}>
                      {riskIcons[pick.riskLevel]}
                      {pick.riskLevel}
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <h3 className="font-bold text-base leading-tight group-hover:text-blue-500 transition-colors line-clamp-1">{pick.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm font-black text-foreground">{pick.price}</span>
                      <span className={cn(
                        "text-xs font-bold flex items-center",
                        pick.change.startsWith('+') ? "text-green-500" : "text-red-500"
                      )}>
                        {pick.change.startsWith('+') ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                        {pick.change}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex-1 space-y-4">
                    <div className="p-3 bg-foreground/5 rounded-2xl border border-border/50">
                      <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-1">Est. Gain Potential</span>
                      <span className="text-xl font-black text-green-500">{pick.gainPotential}</span>
                    </div>
                    
                    <div>
                      <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-2">Reason for Selection</span>
                      <p className="text-xs text-gray-400 leading-relaxed line-clamp-4 italic">
                        "{pick.reason}"
                      </p>
                    </div>
                  </div>

                  <button className="mt-6 w-full py-3 bg-foreground/5 hover:bg-blue-500 hover:text-white rounded-xl text-xs font-bold transition-all border border-border group-hover:border-blue-500/50">
                    View Analysis
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {period === 'monthly' && insights && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-indigo-600 to-violet-700 p-10 rounded-[3rem] text-white shadow-2xl shadow-indigo-500/20 overflow-hidden relative"
        >
          <div className="absolute top-0 right-0 p-12 opacity-10">
            <Shield size={200} />
          </div>
          
          <div className="relative z-10 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full border border-white/20 text-xs font-bold uppercase tracking-widest mb-6">
              <Zap size={14} />
              Monthly Assessment
            </div>
            <h2 className="text-4xl font-black mb-6">Strategic Monthly Outlook</h2>
            <div className="prose prose-invert max-w-none text-white/80 leading-relaxed text-lg">
              <ReactMarkdown>{insights.marketSummary}</ReactMarkdown>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10">
              {[
                { label: "Market Sentiment", value: "Bullish", color: "bg-green-400" },
                { label: "Top Sector", value: "Banking", color: "bg-blue-400" },
                { label: "Risk Level", value: "Moderate", color: "bg-yellow-400" }
              ].map((item, i) => (
                <div key={i} className="bg-white/5 border border-white/10 p-4 rounded-2xl">
                  <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest block mb-1">{item.label}</span>
                  <div className="flex items-center gap-2">
                    <div className={cn("w-2 h-2 rounded-full", item.color)} />
                    <span className="font-bold">{item.value}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};
