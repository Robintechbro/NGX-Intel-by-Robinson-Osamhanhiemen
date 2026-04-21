import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { TrendingUp, TrendingDown, Zap } from 'lucide-react';
import { cn } from '../lib/utils';
import { getMarketTrends } from '../services/geminiService';
import { MarketTrends } from '../types';

export const MarketTicker = () => {
  const [trends, setTrends] = useState<MarketTrends | null>(null);

  useEffect(() => {
    const fetchTrends = async () => {
      const data = await getMarketTrends();
      setTrends(data);
    };
    fetchTrends();
    const interval = setInterval(fetchTrends, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const tickerItems = useMemo(() => {
    if (!trends) return [];
    return [...trends.gainers, ...trends.losers].sort(() => Math.random() - 0.5);
  }, [trends]);

  if (tickerItems.length === 0) return null;

  return (
    <div className="bg-background border-b border-border h-10 flex items-center overflow-hidden relative group">
      <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />
      
      <div className="flex items-center gap-4 px-4 bg-foreground/5 h-full border-r border-border relative z-20">
        <Zap size={14} className="text-yellow-500 animate-pulse" />
        <span className="text-[10px] font-black uppercase tracking-widest whitespace-nowrap">Market Pulse</span>
      </div>

      <div className="flex-1 overflow-hidden relative h-full">
        <motion.div 
          animate={{ x: [0, -1000] }}
          transition={{ 
            duration: 30, 
            repeat: Infinity, 
            ease: "linear" 
          }}
          className="flex items-center gap-12 whitespace-nowrap h-full pl-8"
        >
          {[...tickerItems, ...tickerItems, ...tickerItems].map((item, i) => (
            <div key={i} className="flex items-center gap-3 group/item cursor-default">
              <span className="text-[10px] font-black text-gray-400 group-hover/item:text-foreground transition-colors">{item.symbol}</span>
              <span className="text-xs font-bold">{item.price}</span>
              <span className={cn(
                "text-[10px] font-black flex items-center gap-0.5",
                item.change.startsWith('+') ? "text-green-500" : "text-red-500"
              )}>
                {item.change.startsWith('+') ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                {item.change}
              </span>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
};
