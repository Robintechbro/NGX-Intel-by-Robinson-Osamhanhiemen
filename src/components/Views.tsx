import React, { useState, useEffect, useMemo } from 'react';
import { 
  TrendingUp, 
  TrendingDown,
  PieChart, 
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Zap,
  Globe,
  Loader2,
  Bell,
  Shield,
  ArrowRight,
  Settings,
  ChevronDown,
  ChevronUp,
  User as UserIcon,
  CreditCard
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { toast } from 'sonner';
import { UserProfile, MarketTrends, MarketOverview, StockData } from '../types';
import { 
  AreaChart,
  Area,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  Brush,
  LineChart,
  Line,
  ReferenceLine
} from 'recharts';
import ReactMarkdown from 'react-markdown';
import { getMarketTrends, getMarketOverview, getLiveMarketBoard } from '../services/geminiService';
import { MetricCard, CompactMetric, LivePrice, SpeakButton } from './Common';

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
      const aChange = parseFloat(a.changePercent.replace(/[^\d.-]/g, '')) || 0;
      const bChange = parseFloat(b.changePercent.replace(/[^\d.-]/g, '')) || 0;
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
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Live Updates • {lastUpdated}</span>
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

const MiniSparkline = ({ data, color }: { data: { value: number }[], color: string }) => (
  <div className="h-12 w-24">
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data}>
        <defs>
          <linearGradient id={`color-${color}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.3}/>
            <stop offset="95%" stopColor={color} stopOpacity={0}/>
          </linearGradient>
        </defs>
        <Area 
          type="monotone" 
          dataKey="value" 
          stroke={color} 
          fillOpacity={1} 
          fill={`url(#color-${color})`} 
          strokeWidth={2}
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  </div>
);

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
                  value: parseFloat(s.changePercent.replace('%', '').replace('+', ''))
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
                          <p className={cn("text-sm font-bold", val >= 0 ? "text-green-500" : "text-red-500")}>
                            {val >= 0 ? '+' : ''}{val}%
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20}>
                  {overview?.sectors.map((entry, index) => {
                    const val = parseFloat(entry.changePercent.replace('%', '').replace('+', ''));
                    return <Cell key={`cell-${index}`} fill={val >= 0 ? '#22c55e' : '#ef4444'} fillOpacity={0.8} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-card border border-border p-8 rounded-[2.5rem] space-y-6">
          <h3 className="text-xl font-bold">Market Heatmap</h3>
          <div className="grid grid-cols-2 gap-3">
            {overview?.sectors.map((sector, i) => {
              const val = parseFloat(sector.changePercent.replace('%', '').replace('+', ''));
              return (
                <motion.div
                  key={i}
                  whileHover={{ scale: 1.02 }}
                  onClick={() => onSectorClick(sector.name)}
                  className={cn(
                    "p-4 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between h-24",
                    val > 1 ? "bg-green-500/20 border-green-500/30" :
                    val > 0 ? "bg-green-500/10 border-green-500/20" :
                    val < -1 ? "bg-red-500/20 border-red-500/30" :
                    "bg-red-500/10 border-red-500/20"
                  )}
                >
                  <span className="text-[10px] font-bold uppercase tracking-tight line-clamp-1">{sector.name}</span>
                  <span className={cn(
                    "text-lg font-bold",
                    val >= 0 ? "text-green-500" : "text-red-500"
                  )}>
                    {sector.changePercent}
                  </span>
                </motion.div>
              );
            })}
          </div>
          <p className="text-[10px] text-gray-500 text-center italic">Click a sector to explore top stocks</p>
        </div>
      </div>

      {/* Sector Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {overview?.sectors.map((sector, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
            className="bg-card border border-border p-8 rounded-[2.5rem] hover:border-green-500/30 transition-all group"
          >
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-2xl font-bold mb-1 group-hover:text-green-500 transition-colors">{sector.name}</h3>
                <p className="text-xs text-gray-500 line-clamp-1">{sector.description}</p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <div className={cn(
                  "px-3 py-1 rounded-full text-xs font-bold",
                  sector.trend === 'up' ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
                )}>
                  {sector.changePercent}
                </div>
                {sector.trendData && (
                  <MiniSparkline 
                    data={sector.trendData} 
                    color={sector.trend === 'up' ? '#22c55e' : '#ef4444'} 
                  />
                )}
              </div>
            </div>

            <div className="space-y-4">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-2">Top Performers</span>
              {sector.topStocks.map((stock, j) => (
                <div 
                  key={j} 
                  onClick={() => onStockClick(stock.symbol)}
                  className="flex items-center justify-between p-4 bg-foreground/5 rounded-2xl border border-border/50 group-hover:bg-foreground/[0.08] transition-all cursor-pointer hover:border-green-500/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-foreground/10 rounded-lg flex items-center justify-center text-[10px] font-bold">
                      {stock.symbol.charAt(0)}
                    </div>
                    <span className="font-bold text-sm">{stock.symbol}</span>
                  </div>
                  <span className={cn(
                    "text-xs font-bold",
                    stock.change.startsWith('+') ? "text-green-500" : "text-red-500"
                  )}>
                    {stock.change}
                  </span>
                </div>
              ))}
            </div>
            
            <button 
              onClick={() => onSectorClick(sector.name)}
              className="w-full mt-6 py-3 bg-foreground/5 rounded-xl text-[10px] font-bold uppercase tracking-widest text-gray-500 group-hover:bg-green-500 group-hover:text-white transition-all"
            >
              View Sector Analysis
            </button>
          </motion.div>
        ))}
      </div>

      {/* Market Insights */}
      <div className="bg-gradient-to-br from-blue-500/5 to-purple-500/5 border border-border p-10 rounded-[3rem]">
        <div className="flex items-center gap-3 mb-8">
          <Zap size={24} className="text-yellow-500" />
          <h3 className="text-2xl font-bold">Institutional Insights</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div className="space-y-4">
            <h4 className="text-sm font-bold uppercase tracking-widest text-gray-500">Wealth Manager's Perspective</h4>
            <p className="text-gray-400 leading-relaxed">
              "The current market rotation into the Banking sector is driven by anticipated dividend yields and strong Q4 earnings reports. High-net-worth individuals are increasing their exposure to Tier-1 banks while hedging with defensive stocks in the Consumer Goods sector."
            </p>
          </div>
          <div className="space-y-4">
            <h4 className="text-sm font-bold uppercase tracking-widest text-gray-500">Telecom Outlook</h4>
            <p className="text-gray-400 leading-relaxed">
              "Telecommunications remain a core growth pillar. With increasing data penetration and mobile money expansion, stocks like MTNN and AIRTELAFRI are being viewed as long-term infrastructure plays rather than simple utility stocks."
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export const StockChart = ({ data = [], timeframe, setTimeframe, historicalData }: { data: any[], timeframe: string, setTimeframe: (tf: string) => void, historicalData?: { [key: string]: any[] } }) => {
  const [chartData, setChartData] = useState(data);
  const [showMACD, setShowMACD] = useState(false);
  const [showRSI, setShowRSI] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const [macdConfig, setMacdConfig] = useState({ fast: 12, slow: 26, signal: 9 });
  const [rsiConfig, setRsiConfig] = useState({ period: 14 });

  useEffect(() => {
    if (timeframe === '1M') setChartData(data);
    else if (historicalData && historicalData[timeframe]) setChartData(historicalData[timeframe]);
  }, [timeframe, data, historicalData]);

  const indicatorsData = useMemo(() => {
    if (!chartData || chartData.length === 0) return [];

    const prices = chartData.map(d => d.price);
    
    const calculateEMA = (values: number[], period: number) => {
      const k = 2 / (period + 1);
      let ema = [values[0]];
      for (let i = 1; i < values.length; i++) {
        ema.push(values[i] * k + ema[i - 1] * (1 - k));
      }
      return ema;
    };

    const fastEMA = calculateEMA(prices, macdConfig.fast);
    const slowEMA = calculateEMA(prices, macdConfig.slow);
    const macdLine = fastEMA.map((f, i) => f - slowEMA[i]);
    const signalLine = calculateEMA(macdLine, macdConfig.signal);
    const histogram = macdLine.map((m, i) => m - signalLine[i]);

    const calculateRSI = (values: number[], period: number) => {
      let rsi = new Array(values.length).fill(null);
      if (values.length <= period) return rsi;

      let gains = 0;
      let losses = 0;

      for (let i = 1; i <= period; i++) {
        const diff = values[i] - values[i - 1];
        if (diff >= 0) gains += diff;
        else losses -= diff;
      }

      let avgGain = gains / period;
      let avgLoss = losses / period;

      for (let i = period; i < values.length; i++) {
        if (i > period) {
          const diff = values[i] - values[i - 1];
          const gain = diff >= 0 ? diff : 0;
          const loss = diff < 0 ? -diff : 0;
          avgGain = (avgGain * (period - 1) + gain) / period;
          avgLoss = (avgLoss * (period - 1) + loss) / period;
        }

        const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
        rsi[i] = 100 - (100 / (1 + rs));
      }
      return rsi;
    };

    const rsiValues = calculateRSI(prices, rsiConfig.period);

    return chartData.map((d, i) => ({
      ...d,
      macd: macdLine[i],
      signal: signalLine[i],
      histogram: histogram[i],
      rsi: rsiValues[i]
    }));
  }, [chartData, macdConfig, rsiConfig]);

  return (
    <div className="space-y-6 mt-8 pt-8 border-t border-border">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Performance Chart</h3>
          <div className="flex gap-2">
            <button 
              onClick={() => setShowMACD(!showMACD)}
              className={cn(
                "px-2 py-1 text-[10px] font-bold rounded border transition-all",
                showMACD ? "bg-blue-500/10 text-blue-500 border-blue-500/30" : "text-gray-500 border-border hover:border-gray-400"
              )}
            >
              MACD
            </button>
            <button 
              onClick={() => setShowRSI(!showRSI)}
              className={cn(
                "px-2 py-1 text-[10px] font-bold rounded border transition-all",
                showRSI ? "bg-purple-500/10 text-purple-500 border-purple-500/30" : "text-gray-500 border-border hover:border-gray-400"
              )}
            >
              RSI
            </button>
            <button 
              onClick={() => setShowSettings(!showSettings)}
              className={cn(
                "p-1 text-gray-500 rounded border border-border hover:border-gray-400 transition-all",
                showSettings && "bg-foreground/5"
              )}
            >
              <Settings size={14} />
            </button>
          </div>
        </div>
        <div className="flex bg-foreground/5 p-1 rounded-xl w-fit">
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

      {showSettings && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-foreground/5 rounded-2xl border border-border grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          <div className="space-y-3">
            <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">MACD Parameters</h4>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-[8px] text-gray-500 uppercase block mb-1">Fast</label>
                <input 
                  type="number" 
                  value={macdConfig.fast}
                  onChange={(e) => setMacdConfig({ ...macdConfig, fast: parseInt(e.target.value) || 1 })}
                  className="w-full bg-background border border-border rounded p-1 text-xs"
                />
              </div>
              <div>
                <label className="text-[8px] text-gray-500 uppercase block mb-1">Slow</label>
                <input 
                  type="number" 
                  value={macdConfig.slow}
                  onChange={(e) => setMacdConfig({ ...macdConfig, slow: parseInt(e.target.value) || 1 })}
                  className="w-full bg-background border border-border rounded p-1 text-xs"
                />
              </div>
              <div>
                <label className="text-[8px] text-gray-500 uppercase block mb-1">Signal</label>
                <input 
                  type="number" 
                  value={macdConfig.signal}
                  onChange={(e) => setMacdConfig({ ...macdConfig, signal: parseInt(e.target.value) || 1 })}
                  className="w-full bg-background border border-border rounded p-1 text-xs"
                />
              </div>
            </div>
          </div>
          <div className="space-y-3">
            <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">RSI Parameters</h4>
            <div>
              <label className="text-[8px] text-gray-500 uppercase block mb-1">Period</label>
              <input 
                type="number" 
                value={rsiConfig.period}
                onChange={(e) => setRsiConfig({ ...rsiConfig, period: parseInt(e.target.value) || 1 })}
                className="w-full bg-background border border-border rounded p-1 text-xs max-w-[100px]"
              />
            </div>
          </div>
        </motion.div>
      )}

      <div className="space-y-4">
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={indicatorsData}>
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
                  const s = String(val);
                  if (timeframe === '1D') return s.split(' ')[1] || s;
                  return s.split('-')[2] || s;
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
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const labelStr = String(label);
                    const hasSpace = labelStr.includes(' ');
                    return (
                      <div className="bg-card border border-border p-4 rounded-2xl shadow-2xl backdrop-blur-md">
                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                            {hasSpace ? labelStr.split(' ')[0] : 'Date'}
                          </span>
                          <span className="text-sm font-bold">{hasSpace ? labelStr.split(' ')[1] : labelStr}</span>
                          <div className="h-px bg-border my-1" />
                          {payload.map((p, i) => (
                            <div key={i} className="flex flex-col">
                              <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: p.color }}>{p.name}</span>
                              <span className="text-lg font-bold">
                                {p.name === 'Price' ? `₦${p.value}` : (p.value as number).toFixed(2)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area 
                type="monotone" 
                dataKey="price" 
                name="Price"
                stroke="#22C55E" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorPrice)" 
                animationDuration={1500}
              />
              <Brush 
                dataKey="date" 
                height={30} 
                stroke="#22C55E" 
                fill="rgba(34, 197, 94, 0.05)"
                className="text-[10px] font-bold"
                tickFormatter={(val) => {
                  const s = String(val);
                  if (timeframe === '1D') return s.split(' ')[1] || s;
                  return s.split('-')[2] || s;
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {showMACD && (
          <div className="h-[150px] w-full">
            <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">MACD ({macdConfig.fast}, {macdConfig.slow}, {macdConfig.signal})</h4>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={indicatorsData}>
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-border" vertical={false} />
                <XAxis dataKey="date" hide />
                <YAxis fontSize={8} axisLine={false} tickLine={false} />
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-card border border-border p-2 rounded-lg shadow-xl">
                          {payload.map((p, i) => (
                            <div key={i} className="flex justify-between gap-4">
                              <span className="text-[8px] font-bold uppercase" style={{ color: p.color }}>{p.name}</span>
                              <span className="text-[10px] font-bold">{(p.value as number).toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Line type="monotone" dataKey="macd" name="MACD" stroke="#3B82F6" dot={false} strokeWidth={1.5} />
                <Line type="monotone" dataKey="signal" name="Signal" stroke="#F59E0B" dot={false} strokeWidth={1.5} />
                <Bar dataKey="histogram" name="Histogram" fill="#94A3B8" fillOpacity={0.5} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {showRSI && (
          <div className="h-[150px] w-full">
            <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">RSI ({rsiConfig.period})</h4>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={indicatorsData}>
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-border" vertical={false} />
                <XAxis dataKey="date" hide />
                <YAxis domain={[0, 100]} fontSize={8} axisLine={false} tickLine={false} ticks={[30, 70]} />
                <ReferenceLine y={70} stroke="#EF4444" strokeDasharray="3 3" label={{ value: 'Overbought', position: 'insideRight', fontSize: 8, fill: '#EF4444' }} />
                <ReferenceLine y={30} stroke="#22C55E" strokeDasharray="3 3" label={{ value: 'Oversold', position: 'insideRight', fontSize: 8, fill: '#22C55E' }} />
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-card border border-border p-2 rounded-lg shadow-xl">
                          <span className="text-[8px] font-bold uppercase text-purple-500">RSI</span>
                          <span className="text-[10px] font-bold ml-2">{(payload[0].value as number).toFixed(2)}</span>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Line type="monotone" dataKey="rsi" name="RSI" stroke="#A855F7" dot={false} strokeWidth={1.5} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
};

export const ProfileView = ({ 
  user, 
  watchlistCount, 
  notificationsEnabled, 
  setNotificationsEnabled,
  movementThreshold,
  setMovementThreshold,
  onUpdateProfile
}: { 
  user: UserProfile, 
  watchlistCount: number,
  notificationsEnabled: boolean,
  setNotificationsEnabled: (val: boolean) => void,
  movementThreshold: number,
  setMovementThreshold: (val: number) => void,
  onUpdateProfile: (data: Partial<UserProfile>) => Promise<void>
}) => {
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState(user.displayName);
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveName = async () => {
    if (!newName.trim()) return;
    setIsSaving(true);
    try {
      await onUpdateProfile({ displayName: newName });
      setIsEditingName(false);
      toast.success("Profile updated successfully");
    } catch (error) {
      toast.error("Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto space-y-8 pb-20"
    >
      <div className="flex flex-col md:flex-row items-center gap-8 p-8 bg-card border border-border rounded-[2.5rem] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/5 blur-[100px] -mr-32 -mt-32" />
        
        <div className="relative">
          <div className="w-32 h-32 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center text-5xl font-bold text-black shadow-xl">
            {user.displayName.charAt(0)}
          </div>
          <div className="absolute -bottom-2 -right-2 p-2 bg-background border border-border rounded-full shadow-lg">
            <UserIcon size={16} className="text-gray-500" />
          </div>
        </div>

        <div className="flex-1 text-center md:text-left space-y-4">
          {isEditingName ? (
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <input 
                type="text" 
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="bg-foreground/5 border border-border rounded-xl px-4 py-2 text-2xl font-bold focus:outline-none focus:border-green-500 transition-all w-full max-w-xs"
                autoFocus
              />
              <div className="flex gap-2">
                <button 
                  onClick={handleSaveName}
                  disabled={isSaving}
                  className="px-4 py-2 bg-green-500 text-white rounded-xl font-bold text-sm hover:bg-green-600 transition-all disabled:opacity-50"
                >
                  {isSaving ? <Loader2 size={16} className="animate-spin" /> : "Save"}
                </button>
                <button 
                  onClick={() => { setIsEditingName(false); setNewName(user.displayName); }}
                  className="px-4 py-2 bg-foreground/5 text-gray-500 rounded-xl font-bold text-sm hover:bg-foreground/10 transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <h2 className="text-4xl font-bold tracking-tight">{user.displayName}</h2>
              <button 
                onClick={() => setIsEditingName(true)}
                className="p-2 hover:bg-foreground/5 rounded-lg text-gray-500 transition-colors"
              >
                <Settings size={16} />
              </button>
            </div>
          )}
          
          <div className="flex flex-wrap justify-center md:justify-start items-center gap-4">
            <p className="text-gray-500 font-medium">{user.email}</p>
            <div className="w-1 h-1 rounded-full bg-border hidden sm:block" />
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-500/10 text-green-500 text-xs font-bold rounded-full border border-green-500/20">
              <Zap size={12} className="fill-green-500" />
              {user.isPremium ? "Premium Plan" : "Free Plan"}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card border border-border p-8 rounded-3xl text-center group hover:border-green-500/30 transition-all">
          <div className="text-4xl font-bold mb-2 text-foreground group-hover:text-green-500 transition-colors">{watchlistCount}</div>
          <div className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Watchlist Items</div>
        </div>
        <div className="bg-card border border-border p-8 rounded-3xl text-center group hover:border-blue-500/30 transition-all">
          <div className="text-4xl font-bold mb-2 text-foreground group-hover:text-blue-500 transition-colors">{user.searchCount || 0}</div>
          <div className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Analyses Run</div>
        </div>
        <div className="bg-card border border-border p-8 rounded-3xl text-center group hover:border-purple-500/30 transition-all">
          <div className="text-4xl font-bold mb-2 text-foreground group-hover:text-purple-500 transition-colors">{user.trendsClickCount || 0}</div>
          <div className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Trends Explored</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="p-8 bg-card border border-border rounded-[2.5rem] space-y-8">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-xl">
              <Bell size={24} className="text-blue-500" />
            </div>
            <h3 className="text-xl font-bold">Notifications</h3>
          </div>
          
          <div className="space-y-6">
            <div className="flex items-center justify-between p-5 bg-foreground/5 rounded-2xl border border-border/50">
              <div>
                <div className="text-sm font-bold mb-1">Price Alerts</div>
                <div className="text-[10px] text-gray-500 max-w-[200px]">Get notified when stocks in your watchlist move significantly.</div>
              </div>
              <button 
                onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                className={cn(
                  "w-12 h-6 rounded-full p-1 transition-all relative",
                  notificationsEnabled ? "bg-green-500" : "bg-foreground/10"
                )}
              >
                <motion.div 
                  layout
                  className="w-4 h-4 rounded-full bg-white shadow-sm"
                  animate={{ x: notificationsEnabled ? 24 : 0 }}
                />
              </button>
            </div>

            <div className="p-5 bg-foreground/5 rounded-2xl border border-border/50 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold">Movement Threshold</span>
                <span className="px-2 py-1 bg-green-500/10 text-green-500 text-xs font-bold rounded-lg">{movementThreshold}%</span>
              </div>
              <input 
                type="range" 
                min="0.5" 
                max="10" 
                step="0.5" 
                value={movementThreshold}
                onChange={(e) => setMovementThreshold(parseFloat(e.target.value))}
                className="w-full accent-green-500 h-1.5 bg-foreground/10 rounded-full appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-[8px] font-bold text-gray-500 uppercase tracking-widest">
                <span>Sensitive</span>
                <span>Conservative</span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-8 bg-card border border-border rounded-[2.5rem] space-y-8">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/10 rounded-xl">
              <Shield size={24} className="text-purple-500" />
            </div>
            <h3 className="text-xl font-bold">Subscription</h3>
          </div>

          <div className="p-6 bg-gradient-to-br from-green-500/10 to-blue-500/10 border border-green-500/20 rounded-2xl space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Current Status</span>
              <span className="px-2 py-1 bg-green-500 text-white text-[10px] font-bold rounded-full uppercase">Active</span>
            </div>
            <div>
              <div className="text-2xl font-bold mb-1">{user.isPremium ? "Premium NGX Intel" : "Free Tier"}</div>
              <p className="text-xs text-gray-500">
                {user.isPremium 
                  ? "You have full access to real-time AI analysis, unlimited watchlists, and advanced charting tools."
                  : "Upgrade to Premium for real-time AI analysis and unlimited watchlists."}
              </p>
            </div>
            <div className="pt-4 flex items-center justify-between border-t border-border/50">
              <div className="text-xs font-bold">₦5,000 / month</div>
              <button className="text-[10px] font-bold text-blue-500 uppercase tracking-widest hover:underline">View Billing History</button>
            </div>
          </div>

          <button className="w-full py-4 bg-foreground text-background rounded-2xl font-bold hover:opacity-90 transition-all flex items-center justify-center gap-2">
            <CreditCard size={18} />
            {user.isPremium ? "Manage Subscription" : "Upgrade to Premium"}
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export const MarketStatusView = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [trends, setTrends] = useState<MarketTrends | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchTrends = async () => {
      setLoading(true);
      const data = await getMarketTrends();
      setTrends(data);
      setLoading(false);
    };
    fetchTrends();
  }, []);

  const getWATTime = (date: Date) => {
    const utc = date.getTime() + (date.getTimezoneOffset() * 60000);
    return new Date(utc + (3600000 * 1));
  };

  const watDate = getWATTime(currentTime);
  const day = watDate.getDay();
  const hours = watDate.getHours();
  const minutes = watDate.getMinutes();
  const timeInMinutes = hours * 60 + minutes;

  const isOpenDay = day >= 1 && day <= 5;
  const isOpenTime = timeInMinutes >= (10 * 60) && timeInMinutes < (14 * 60 + 30);
  const isMarketOpen = isOpenDay && isOpenTime;

  const getStatusMessage = () => {
    if (!isOpenDay) return "The market is closed for the weekend. Trading resumes on Monday at 10:00 AM WAT.";
    if (timeInMinutes < (10 * 60)) return "The market is currently closed. Pre-market session starts soon. Trading opens at 10:00 AM WAT.";
    if (isMarketOpen) return "The market is currently OPEN. Trading is active across all sectors.";
    return "The market is closed for the day. Trading ended at 2:30 PM WAT.";
  };

  return (
    <div className="max-w-6xl mx-auto space-y-12">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-foreground/5 border border-border rounded-full">
          <div className={cn("w-2 h-2 rounded-full animate-pulse", isMarketOpen ? "bg-green-500" : "bg-red-500")} />
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500">
            Live Market Status
          </span>
        </div>
        <h2 className="text-4xl md:text-6xl font-bold tracking-tight">
          NGX Market is <br />
          <span className={isMarketOpen ? "text-green-500" : "text-red-500"}>
            {isMarketOpen ? "OPEN" : "CLOSED"}
          </span>
        </h2>
        <p className="text-gray-500 text-lg max-w-xl mx-auto">
          {getStatusMessage()}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-card border border-border p-8 rounded-[2rem] space-y-6 h-fit">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Market Hours (WAT)</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center pb-4 border-b border-border">
              <span className="text-gray-500">Monday - Friday</span>
              <span className="font-bold">10:00 AM - 2:30 PM</span>
            </div>
            <div className="flex justify-between items-center pb-4 border-b border-border">
              <span className="text-gray-500">Saturday - Sunday</span>
              <span className="font-bold text-red-500">Closed</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Current Time (Lagos)</span>
              <span className="font-bold">{watDate.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
            </div>
          </div>
          
          <div className="pt-6 border-t border-border">
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">What's Happening Now?</h4>
            <div className="space-y-4">
              {isMarketOpen ? (
                <div className="flex gap-3">
                  <div className="w-8 h-8 bg-green-500/10 rounded-full flex items-center justify-center shrink-0">
                    <TrendingUp size={14} className="text-green-500" />
                  </div>
                  <p className="text-sm text-gray-500">Active trading session. Real-time price updates are being processed across all sectors.</p>
                </div>
              ) : (
                <div className="flex gap-3">
                  <div className="w-8 h-8 bg-red-500/10 rounded-full flex items-center justify-center shrink-0">
                    <TrendingDown size={14} className="text-red-500" />
                  </div>
                  <p className="text-sm text-gray-500">Market is currently offline. Orders placed now will be queued for the next trading session.</p>
                </div>
              )}
              <div className="flex gap-3">
                <div className="w-8 h-8 bg-blue-500/10 rounded-full flex items-center justify-center shrink-0">
                  <PieChart size={14} className="text-blue-500" />
                </div>
                <p className="text-sm text-gray-500">AI analysis is processing historical data to identify potential opportunities for tomorrow.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card border border-border p-8 rounded-[2rem]">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-xl font-bold">Market Trends</h3>
              {trends?.lastUpdated && (
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                  Last Updated: {trends.lastUpdated}
                </span>
              )}
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 space-y-4">
                <Loader2 size={40} className="text-green-500 animate-spin" />
                <p className="text-gray-500 font-medium">Fetching latest NGX market activity...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-green-500">
                    <TrendingUp size={18} />
                    <h4 className="font-bold">Top Gainers</h4>
                  </div>
                  <div className="space-y-3">
                    {trends?.gainers.map((stock, i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-foreground/5 rounded-xl border border-border/50">
                        <div>
                          <p className="font-bold text-sm">{stock.symbol}</p>
                          <p className="text-[10px] text-gray-500">{stock.name}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-sm">{stock.price}</p>
                          <p className="text-[10px] font-bold text-green-500">{stock.change}</p>
                        </div>
                      </div>
                    ))}
                    {(!trends?.gainers || trends.gainers.length === 0) && (
                      <p className="text-sm text-gray-500 italic">No gainer data available.</p>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-red-500">
                    <TrendingDown size={18} />
                    <h4 className="font-bold">Top Losers</h4>
                  </div>
                  <div className="space-y-3">
                    {trends?.losers.map((stock, i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-foreground/5 rounded-xl border border-border/50">
                        <div>
                          <p className="font-bold text-sm">{stock.symbol}</p>
                          <p className="text-[10px] text-gray-500">{stock.name}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-sm">{stock.price}</p>
                          <p className="text-[10px] font-bold text-red-500">{stock.change}</p>
                        </div>
                      </div>
                    ))}
                    {(!trends?.losers || trends.losers.length === 0) && (
                      <p className="text-sm text-gray-500 italic">No loser data available.</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="bg-green-500/5 border border-green-500/10 p-6 rounded-2xl flex items-center gap-4">
            <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center shrink-0">
              <Zap size={24} className="text-green-500" />
            </div>
            <div>
              <h4 className="font-bold text-green-500">Pro Tip</h4>
              <p className="text-sm text-gray-500">The NGX usually experiences high volatility during the first 30 minutes (10:00 - 10:30 AM) and the last 30 minutes (2:00 - 2:30 PM) of the session.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const StockAnalysisView = ({ stock, compact = false, onWatch, isWatched, onViewDetails, onCompare }: { stock: StockData, compact?: boolean, onWatch: (s: StockData) => void, isWatched: boolean, onViewDetails?: (s: StockData) => void, onCompare?: (s: StockData) => void }) => {
  const [timeframe, setTimeframe] = useState('1M');

  return (
    <div className={cn("space-y-8", compact ? "bg-card border border-border p-6 rounded-3xl" : "")}>
      <div className={cn("flex flex-col gap-8 items-start", compact ? "" : "md:flex-row")}>
        <div className="flex-1 bg-card border border-border p-8 rounded-3xl w-full">
          <div className="flex flex-col sm:flex-row justify-between items-start mb-6 gap-4 sm:gap-0">
            <div>
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <h2 className={cn("font-bold", compact ? "text-xl" : "text-2xl md:text-3xl")}>{stock.name}</h2>
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
                  <TrendingUp size={16} />
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
                <PieChart size={20} className={isWatched ? "fill-green-500 text-green-500" : "text-gray-500"} />
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

          {!compact && <StockChart data={stock.chartData} timeframe={timeframe} setTimeframe={setTimeframe} historicalData={stock.historicalData} />}

          {compact && (
            <div className="grid grid-cols-1 gap-4 mt-6 pt-6 border-t border-white/5">
              {(stock.metrics || []).map((metric, i) => (
                <CompactMetric key={i} label={metric.label} value={metric.value} score={metric.score} />
              ))}
            </div>
          )}
        </div>

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

      {!compact && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {(stock.metrics || []).map((metric, i) => (
            <MetricCard key={i} {...metric} />
          ))}
        </div>
      )}

      {!compact && (
        <div className="p-6 bg-white/5 rounded-2xl border border-white/5 text-center">
          <p className="text-[10px] text-gray-500 uppercase tracking-widest">
            Disclaimer: This analysis is for informational purposes only and does not constitute financial advice. Investing in stocks involves risk.
          </p>
        </div>
      )}
    </div>
  );
};
