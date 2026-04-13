import React, { useState, useEffect, useMemo } from 'react';
import { 
  TrendingUp, 
  TrendingDown,
  Loader2,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn, parsePercent } from '../lib/utils';
import { StockData } from '../types';
import { getLiveMarketBoard } from '../services/geminiService';
import { MiniSparkline } from './Charts';

export const LiveMarketBoardView = ({ onSelectStock }: { onSelectStock: (stock: StockData) => void }) => {
  const [stocks, setStocks] = useState<StockData[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  const fetchBoard = async () => {
    const data = await getLiveMarketBoard();
    if (data.length > 0) {
      setStocks(data);
      setLastUpdated(new Date().toLocaleTimeString());
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchBoard();
    const interval = setInterval(fetchBoard, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  const sortedStocks = useMemo(() => {
    return [...stocks].sort((a, b) => {
      const aChange = parsePercent(a.changePercent);
      const bChange = parsePercent(b.changePercent);
      return bChange - aChange;
    });
  }, [stocks]);

  if (loading && stocks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <Loader2 className="animate-spin text-green-500" size={48} />
        <p className="text-gray-500 font-medium animate-pulse">Loading Live Market Board...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Live Market Board</h2>
          <p className="text-gray-500 text-sm">Real-time performance of all major NGX listed companies. Stocks are automatically ranked by daily performance.</p>
        </div>
        <div className="flex items-center gap-3 px-4 py-2 bg-foreground/5 rounded-2xl border border-border">
          <div className="flex items-center gap-2 mr-2 pr-2 border-r border-border">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest text-green-500">Live Pulse</span>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Updates every 60s • {lastUpdated}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <AnimatePresence mode="popLayout">
          {sortedStocks.map((stock, index) => (
            <motion.div
              key={stock.symbol}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ 
                type: "spring", 
                stiffness: 300, 
                damping: 30,
                opacity: { duration: 0.2 }
              }}
              onClick={() => onSelectStock(stock)}
              className="bg-card border border-border p-5 rounded-3xl hover:border-green-500/30 transition-all cursor-pointer group relative overflow-hidden flex flex-col justify-between h-[200px]"
            >
              <div className="absolute top-0 right-0 p-3">
                <div className="text-[10px] font-bold text-gray-400 bg-foreground/5 px-2 py-1 rounded-lg">
                  #{index + 1}
                </div>
              </div>

              <div className="space-y-1">
                <h3 className="font-bold text-lg truncate pr-8 group-hover:text-green-500 transition-colors">{stock.name}</h3>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{stock.symbol} • {stock.sector}</p>
              </div>

              <div className="flex items-end justify-between gap-4 mt-4">
                <div className="space-y-1">
                  <div className="text-xl font-bold">{stock.price}</div>
                  <div className={cn(
                    "text-xs font-bold flex items-center gap-1",
                    stock.change.includes('+') ? "text-green-500" : "text-red-500"
                  )}>
                    {stock.change.includes('+') ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                    {stock.change} ({stock.changePercent})
                  </div>
                </div>
                
                <div className="w-24 h-12">
                  <MiniSparkline 
                    data={stock.chartData?.map(d => ({ value: d.price })) || []} 
                    color={stock.change.includes('+') ? "#22C55E" : "#EF4444"} 
                  />
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
                <div className="text-[8px] text-gray-500 font-bold uppercase tracking-[0.1em]">Market Cap</div>
                <div className="text-[10px] font-bold">{stock.marketCap}</div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};
