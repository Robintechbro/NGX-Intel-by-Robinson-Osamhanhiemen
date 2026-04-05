import React, { useState, useEffect } from 'react';
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
  ArrowRight
} from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import { 
  AreaChart,
  Area,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer
} from 'recharts';
import ReactMarkdown from 'react-markdown';
import { StockData, MarketTrends, MarketOverview } from '../types';
import { getMarketTrends, getMarketOverview } from '../services/geminiService';
import { MetricCard, CompactMetric, LivePrice, SpeakButton } from './Common';

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
          <div>
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
          <div className="hidden lg:block w-64 h-24 bg-foreground/5 rounded-2xl border border-border p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Market Sentiment</span>
              <span className="text-[10px] font-bold text-green-500 uppercase tracking-widest">Bullish</span>
            </div>
            <div className="w-full h-2 bg-foreground/10 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: '75%' }}
                className="h-full bg-green-500"
              />
            </div>
            <p className="text-[10px] text-gray-500 mt-2">75% of sectors are showing positive momentum today.</p>
          </div>
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
              <div className={cn(
                "px-3 py-1 rounded-full text-xs font-bold",
                sector.trend === 'up' ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
              )}>
                {sector.changePercent}
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

export const ProfileView = ({ 
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
