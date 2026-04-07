import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown,
  Activity,
  Loader2,
  Clock,
  Shield,
  Zap
} from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import { MarketTrends } from '../types';
import { getMarketTrends } from '../services/geminiService';

export const MarketStatusView = () => {
  const [trends, setTrends] = useState<MarketTrends | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrends = async () => {
      setLoading(true);
      const data = await getMarketTrends();
      setTrends(data);
      setLoading(false);
    };
    fetchTrends();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-4">
        <Loader2 size={48} className="text-green-500 animate-spin" />
        <p className="text-gray-500 font-medium text-lg">Scanning the Market Floor...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-2">
          <h2 className="text-4xl font-bold tracking-tight">Market Pulse</h2>
          <p className="text-gray-500 text-lg">Real-time snapshots of the Nigerian Stock Exchange floor.</p>
        </div>
        <div className="flex items-center gap-3 px-5 py-3 bg-foreground/5 rounded-2xl border border-border">
          <Clock size={18} className="text-green-500" />
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest leading-none mb-1">Last Updated</span>
            <span className="text-sm font-bold">{trends?.lastUpdated}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Top Gainers */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-card border border-border rounded-[2.5rem] overflow-hidden"
        >
          <div className="p-8 border-b border-border bg-green-500/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500 rounded-xl">
                <TrendingUp size={20} className="text-white" />
              </div>
              <h3 className="text-xl font-bold">Top Gainers</h3>
            </div>
            <span className="text-xs font-bold text-green-500 uppercase tracking-widest">Bullish Momentum</span>
          </div>
          <div className="divide-y divide-border">
            {trends?.gainers.map((stock, i) => (
              <div key={i} className="p-6 flex items-center justify-between hover:bg-foreground/5 transition-colors group">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-green-500/10 rounded-full flex items-center justify-center text-green-500 font-bold text-xs">
                    {i + 1}
                  </div>
                  <div>
                    <p className="font-bold text-foreground group-hover:text-green-500 transition-colors">{stock.name}</p>
                    <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">{stock.symbol}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-foreground">{stock.price}</p>
                  <p className="text-xs font-bold text-green-500">{stock.change}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Top Losers */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-card border border-border rounded-[2.5rem] overflow-hidden"
        >
          <div className="p-8 border-b border-border bg-red-500/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-500 rounded-xl">
                <TrendingDown size={20} className="text-white" />
              </div>
              <h3 className="text-xl font-bold">Top Losers</h3>
            </div>
            <span className="text-xs font-bold text-red-500 uppercase tracking-widest">Bearish Pressure</span>
          </div>
          <div className="divide-y divide-border">
            {trends?.losers.map((stock, i) => (
              <div key={i} className="p-6 flex items-center justify-between hover:bg-foreground/5 transition-colors group">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-red-500/10 rounded-full flex items-center justify-center text-red-500 font-bold text-xs">
                    {i + 1}
                  </div>
                  <div>
                    <p className="font-bold text-foreground group-hover:text-red-500 transition-colors">{stock.name}</p>
                    <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">{stock.symbol}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-foreground">{stock.price}</p>
                  <p className="text-xs font-bold text-red-500">{stock.change}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Market Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          { icon: Activity, label: "Market Volatility", value: "Moderate", color: "text-blue-500", bg: "bg-blue-500/10" },
          { icon: Shield, label: "Market Stability", value: "High", color: "text-green-500", bg: "bg-green-500/10" },
          { icon: Zap, label: "Trading Volume", value: "₦4.2B", color: "text-yellow-500", bg: "bg-yellow-500/10" }
        ].map((stat, i) => (
          <div key={i} className="bg-card border border-border p-8 rounded-[2rem] flex items-center gap-6">
            <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center", stat.bg)}>
              <stat.icon className={stat.color} size={28} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] mb-1">{stat.label}</p>
              <p className="text-2xl font-bold">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
