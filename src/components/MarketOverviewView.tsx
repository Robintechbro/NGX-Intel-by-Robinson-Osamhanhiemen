import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Loader2,
  ArrowRight
} from 'lucide-react';
import { motion } from 'motion/react';
import { cn, parsePercent } from '../lib/utils';
import { MarketOverview } from '../types';
import { getMarketOverview } from '../services/geminiService';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Cell 
} from 'recharts';
import { MiniSparkline } from './Charts';

export const MarketOverviewView = ({ onSectorClick, onStockClick }: { onSectorClick: (sector: string) => void, onStockClick: (symbol: string) => void }) => {
  const [overview, setOverview] = useState<MarketOverview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOverview = async () => {
      setLoading(true);
      const data = await getMarketOverview();
      setOverview(data);
      setLoading(false);
    };
    fetchOverview();
    const interval = setInterval(fetchOverview, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-4">
        <Loader2 size={48} className="text-green-500 animate-spin" />
        <p className="text-gray-500 font-medium text-lg">Assembling the Big Dashboard...</p>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-7xl mx-auto space-y-12"
    >
      {/* Market Header */}
      <div className="bg-card border border-border p-10 rounded-[3rem] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/5 blur-[100px] -mr-32 -mt-32" />
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-end gap-8">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-4">
              <Activity size={20} className="text-green-500" />
              <span className="text-xs font-bold text-gray-500 uppercase tracking-[0.3em]">NGX All-Share Index (ASI)</span>
            </div>
            <h2 className="text-5xl md:text-7xl font-bold tracking-tighter mb-4">{overview?.overallIndex}</h2>
            <div className="flex items-center gap-4">
              <div className={cn(
                "flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-bold",
                overview?.indexChange.startsWith('+') ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
              )}>
                {overview?.indexChange.startsWith('+') ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                {overview?.indexChange} ({overview?.indexChangePercent})
              </div>
              <span className="text-xs text-gray-500 font-medium">Last Updated: {overview?.lastUpdated}</span>
            </div>
          </div>

          {/* Market Breadth */}
          <div className="w-full md:w-auto flex flex-col gap-4">
            <div className="bg-foreground/5 rounded-2xl border border-border p-6 min-w-[280px]">
              <div className="flex justify-between items-center mb-4">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Market Breadth</span>
                <div className="flex gap-2">
                  <span className="text-[10px] font-bold text-green-500">Advancing</span>
                  <span className="text-[10px] font-bold text-red-500">Declining</span>
                </div>
              </div>
              <div className="flex h-3 w-full rounded-full overflow-hidden mb-3">
                {(() => {
                  const up = overview?.sectors.filter(s => s.trend === 'up').length || 0;
                  const down = overview?.sectors.filter(s => s.trend === 'down').length || 0;
                  const neutral = overview?.sectors.filter(s => s.trend === 'neutral').length || 0;
                  const total = up + down + neutral || 1;
                  return (
                    <>
                      <motion.div initial={{ width: 0 }} animate={{ width: `${(up/total)*100}%` }} className="bg-green-500 h-full" />
                      <motion.div initial={{ width: 0 }} animate={{ width: `${(neutral/total)*100}%` }} className="bg-gray-400 h-full" />
                      <motion.div initial={{ width: 0 }} animate={{ width: `${(down/total)*100}%` }} className="bg-red-500 h-full" />
                    </>
                  );
                })()}
              </div>
              <div className="flex justify-between text-[10px] font-bold uppercase tracking-tighter">
                <span className="text-green-500">{overview?.sectors.filter(s => s.trend === 'up').length} Up</span>
                <span className="text-gray-400">{overview?.sectors.filter(s => s.trend === 'neutral').length} Flat</span>
                <span className="text-red-500">{overview?.sectors.filter(s => s.trend === 'down').length} Down</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sector Performance Visualization */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-card border border-border p-8 rounded-[2.5rem] space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold">Sector Performance</h3>
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Daily % Change</span>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={overview?.sectors.map(s => ({
                  name: s.name,
                  value: parsePercent(s.changePercent)
                })).sort((a, b) => b.value - a.value)}
                margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 600, fill: '#6b7280' }}
                  width={100}
                />
                <Tooltip 
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const val = payload[0].value as number;
                      return (
                        <div className="bg-background border border-border p-3 rounded-xl shadow-xl">
                          <p className="text-xs font-bold mb-1">{payload[0].payload.name}</p>
                          <p className={cn("text-xs font-bold", val >= 0 ? "text-green-500" : "text-red-500")}>
                            {val >= 0 ? '+' : ''}{val}%
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20}>
                  {overview?.sectors.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={parsePercent(entry.changePercent) >= 0 ? '#22C55E' : '#EF4444'} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-card border border-border p-8 rounded-[2.5rem] flex flex-col justify-between">
          <div>
            <h3 className="text-xl font-bold mb-4">Market Sentiment</h3>
            <p className="text-gray-500 text-sm mb-8 leading-relaxed">
              The market is currently showing {overview?.sectors.filter(s => s.trend === 'up').length || 0 > (overview?.sectors.length || 0) / 2 ? 'bullish' : 'mixed'} momentum across key sectors.
            </p>
          </div>
          <div className="space-y-4">
            {overview?.sectors.slice(0, 4).map((sector) => (
              <div key={sector.name} className="flex items-center justify-between p-4 bg-foreground/5 rounded-2xl border border-transparent hover:border-border transition-all">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-2 h-2 rounded-full",
                    sector.trend === 'up' ? "bg-green-500" : sector.trend === 'down' ? "bg-red-500" : "bg-gray-400"
                  )} />
                  <span className="text-sm font-bold">{sector.name}</span>
                </div>
                <div className={cn(
                  "text-xs font-bold",
                  sector.changePercent.startsWith('+') ? "text-green-500" : "text-red-500"
                )}>
                  {sector.changePercent}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sector Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {overview?.sectors.map((sector) => (
          <motion.div 
            key={sector.name}
            whileHover={{ y: -5 }}
            className="bg-card border border-border rounded-[2.5rem] overflow-hidden group hover:border-green-500/30 transition-all"
          >
            <div className="p-8 space-y-6">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <h3 className="text-2xl font-bold group-hover:text-green-500 transition-colors">{sector.name}</h3>
                  <p className="text-xs text-gray-500 font-medium">{sector.description}</p>
                </div>
                <div className={cn(
                  "px-3 py-1 rounded-full text-xs font-bold",
                  sector.trend === 'up' ? "bg-green-500/10 text-green-500" : sector.trend === 'down' ? "bg-red-500/10 text-red-500" : "bg-gray-500/10 text-gray-500"
                )}>
                  {sector.changePercent}
                </div>
              </div>

              <div className="h-20 w-full">
                <MiniSparkline data={sector.trendData} color={sector.trend === 'up' ? "#22C55E" : sector.trend === 'down' ? "#EF4444" : "#94A3B8"} />
              </div>

              <div className="space-y-3">
                <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Top Movers</div>
                <div className="grid grid-cols-2 gap-2">
                  {sector.topStocks.map((stock) => (
                    <button 
                      key={stock.symbol}
                      onClick={() => onStockClick(stock.symbol)}
                      className="flex items-center justify-between p-3 bg-foreground/5 rounded-xl hover:bg-foreground/10 transition-all group/btn"
                    >
                      <span className="text-xs font-bold">{stock.symbol}</span>
                      <span className={cn(
                        "text-[10px] font-bold",
                        stock.change.startsWith('+') ? "text-green-500" : "text-red-500"
                      )}>{stock.change}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <button 
              onClick={() => onSectorClick(sector.name)}
              className="w-full py-4 bg-foreground/5 text-xs font-bold uppercase tracking-widest hover:bg-foreground/10 transition-all flex items-center justify-center gap-2"
            >
              Explore {sector.name} <ArrowRight size={14} />
            </button>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};
