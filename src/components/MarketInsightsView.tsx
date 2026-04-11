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
      <div className="space-y-6 pt-12 border-t border-border">
        <div className="flex items-center justify-between px-2">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Calendar size={24} className="text-blue-500" />
            Weekly Spotlight
          </h2>
          <span className="text-xs font-bold text-gray-500 uppercase tracking-widest bg-foreground/5 px-3 py-1 rounded-full border border-border">
            Top 5 Weekly Picks
          </span>
        </div>

        {loadingWeekly && weeklyPicks.length === 0 ? (
          <div className="flex items-center justify-center py-12 bg-foreground/5 rounded-3xl border border-dashed border-border">
            <Loader2 size={24} className="animate-spin text-blue-500 opacity-20" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {weeklyPicks.map((pick, i) => (
              <motion.div
                key={pick.symbol}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-card border border-border p-5 rounded-2xl hover:border-blue-500/30 transition-all group relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                  <TrendingUp size={40} className="text-blue-500" />
                </div>
                
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 bg-blue-500/10 text-blue-500 rounded-lg flex items-center justify-center font-bold text-xs">
                      {pick.symbol}
                    </div>
                    <div className={cn(
                      "px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-widest",
                      riskColors[pick.riskLevel]
                    )}>
                      {pick.riskLevel}
                    </div>
                  </div>
                  
                  <h3 className="font-bold text-sm mb-1 truncate">{pick.name}</h3>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold">{pick.price}</span>
                    <span className={cn(
                      "text-[10px] font-bold",
                      pick.change.startsWith('+') ? "text-green-500" : "text-red-500"
                    )}>
                      {pick.change}
                    </span>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex flex-col">
                      <span className="text-[8px] font-bold text-gray-500 uppercase tracking-widest">Potential</span>
                      <span className="text-xs font-bold text-green-500">{pick.gainPotential}</span>
                    </div>
                    <p className="text-[10px] text-gray-500 line-clamp-2 italic">
                      {pick.reason}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
