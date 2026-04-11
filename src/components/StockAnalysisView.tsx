import React, { useState, useMemo, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown,
  Activity,
  Zap,
  Globe,
  PieChart,
  Settings,
  ArrowRight,
  Loader2,
  Pencil,
  Type,
  Eraser,
  MousePointer2,
  Trash2,
  Calendar
} from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import { StockData } from '../types';
import { toast } from 'sonner';
import { summarizeNewsArticle } from '../services/geminiService';
import { 
  auth, 
  db, 
  onAuthStateChanged 
} from '../firebase';
import { 
  doc, 
  getDoc, 
  setDoc, 
  onSnapshot 
} from 'firebase/firestore';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Brush,
  LineChart,
  Line,
  ReferenceLine,
  Bar,
  ReferenceDot,
  ComposedChart,
  Cell
} from 'recharts';
import ReactMarkdown from 'react-markdown';
import { MetricCard, CompactMetric, LivePrice, SpeakButton } from './Common';

export const StockChart = ({ symbol, data = [], timeframe, setTimeframe, historicalData }: { symbol: string, data: any[], timeframe: string, setTimeframe: (tf: string) => void, historicalData?: { [key: string]: any[] } }) => {
  const [chartData, setChartData] = useState(data);
  const [showMACD, setShowMACD] = useState(false);
  const [showRSI, setShowRSI] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const [macdConfig, setMacdConfig] = useState(() => {
    const saved = localStorage.getItem('macd_config');
    return saved ? JSON.parse(saved) : { fast: 12, slow: 26, signal: 9 };
  });
  const [rsiConfig, setRsiConfig] = useState(() => {
    const saved = localStorage.getItem('rsi_config');
    return saved ? JSON.parse(saved) : { period: 14 };
  });

  // Persist indicator settings
  useEffect(() => {
    localStorage.setItem('macd_config', JSON.stringify(macdConfig));
  }, [macdConfig]);

  useEffect(() => {
    localStorage.setItem('rsi_config', JSON.stringify(rsiConfig));
  }, [rsiConfig]);

  const resetIndicators = () => {
    setMacdConfig({ fast: 12, slow: 26, signal: 9 });
    setRsiConfig({ period: 14 });
    toast.info("Indicator parameters reset to defaults");
  };

  // Drawing state
  const [drawingMode, setDrawingMode] = useState<'none' | 'trendline' | 'annotation'>('none');
  const [trendlines, setTrendlines] = useState<{id: string, start: {x: string, y: number}, end: {x: string, y: number}}[]>([]);
  const [annotations, setAnnotations] = useState<{id: string, x: string, y: number, text: string}[]>([]);
  const [tempPoint, setTempPoint] = useState<{x: string, y: number} | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [brushIndex, setBrushIndex] = useState<{start?: number, end?: number}>({});

  const handleJumpToDate = (selectedDate: string) => {
    if (!indicatorsData || indicatorsData.length === 0) return;
    
    // Find index of the date or the closest date after it
    const index = indicatorsData.findIndex(d => d.date >= selectedDate);
    
    if (index !== -1) {
      // Show a window of data around the selected date
      const windowSize = Math.min(30, indicatorsData.length);
      const start = Math.max(0, index - Math.floor(windowSize / 2));
      const end = Math.min(indicatorsData.length - 1, start + windowSize);
      
      setBrushIndex({ start, end });
      toast.success(`Jumped to ${indicatorsData[index].date.split(' ')[0]}`);
    } else {
      toast.error(`No data found for or after ${selectedDate}`);
    }
  };

  // Load drawings from localStorage and Firebase
  useEffect(() => {
    // 1. Initial load from localStorage
    const storageKey = `drawings_${symbol}_${timeframe}`;
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const { trendlines: savedLines, annotations: savedNotes } = JSON.parse(saved);
        setTrendlines(savedLines || []);
        setAnnotations(savedNotes || []);
      } catch (e) {
        console.error("Failed to load drawings from localStorage", e);
      }
    }

    // 2. Sync from Firebase
    let unsubscribe: (() => void) | undefined;
    const guestId = localStorage.getItem('ngx-intel-guest-id') || 'guest_default';
    
    const setupFirebaseSync = async () => {
      const drawingId = `${guestId}_${symbol}_${timeframe}`;
      const docRef = doc(db, 'drawings', drawingId);
      
      unsubscribe = onSnapshot(docRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          const newTrendlines = data.trendlines || [];
          const newAnnotations = data.annotations || [];
          
          setTrendlines(prev => {
            if (JSON.stringify(prev) === JSON.stringify(newTrendlines)) return prev;
            return newTrendlines;
          });
          
          setAnnotations(prev => {
            if (JSON.stringify(prev) === JSON.stringify(newAnnotations)) return prev;
            return newAnnotations;
          });
          
          localStorage.setItem(storageKey, JSON.stringify({ 
            trendlines: newTrendlines, 
            annotations: newAnnotations 
          }));
        }
      });
    };

    setupFirebaseSync();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [symbol, timeframe]);

  // Save drawings to localStorage and Firebase (debounced)
  useEffect(() => {
    const storageKey = `drawings_${symbol}_${timeframe}`;
    localStorage.setItem(storageKey, JSON.stringify({ trendlines, annotations }));

    const syncToFirebase = async () => {
      const guestId = localStorage.getItem('ngx-intel-guest-id') || 'guest_default';
      setIsSyncing(true);
      try {
        const drawingId = `${guestId}_${symbol}_${timeframe}`;
        const docRef = doc(db, 'drawings', drawingId);
        await setDoc(docRef, {
          uid: guestId,
          symbol,
          timeframe,
          trendlines,
          annotations,
          updatedAt: new Date().toISOString()
        }, { merge: true });
      } catch (e) {
        console.error("Failed to sync drawings to Firebase", e);
      } finally {
        setIsSyncing(false);
      }
    };

    const timeoutId = setTimeout(syncToFirebase, 2000); // 2s debounce
    return () => clearTimeout(timeoutId);
  }, [trendlines, annotations, symbol, timeframe]);

  useEffect(() => {
    if (timeframe === '1M') setChartData(data);
    else if (historicalData && historicalData[timeframe]) setChartData(historicalData[timeframe]);
    
    setTempPoint(null);
    setBrushIndex({});
  }, [timeframe, data, historicalData]);

  const handleChartClick = (nextState: any) => {
    if (!nextState || drawingMode === 'none') return;
    
    const { activeLabel, activePayload } = nextState;
    if (!activeLabel || !activePayload || activePayload.length === 0) return;

    const x = activeLabel;
    const y = activePayload[0].value;

    if (drawingMode === 'trendline') {
      if (!tempPoint) {
        setTempPoint({ x, y });
        toast.info("Click again to set the end point of the trendline");
      } else {
        setTrendlines([...trendlines, { 
          id: Math.random().toString(36).substr(2, 9), 
          start: tempPoint, 
          end: { x, y } 
        }]);
        setTempPoint(null);
        toast.success("Trendline added");
      }
    } else if (drawingMode === 'annotation') {
      const text = prompt("Enter annotation text:");
      if (text) {
        setAnnotations([...annotations, { 
          id: Math.random().toString(36).substr(2, 9), 
          x, 
          y, 
          text 
        }]);
        toast.success("Annotation added");
      }
    }
  };

  const removeTrendline = (id: string) => {
    setTrendlines(trendlines.filter(t => t.id !== id));
  };

  const removeAnnotation = (id: string) => {
    setAnnotations(annotations.filter(a => a.id !== id));
  };

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
      histogramColor: histogram[i] >= 0 ? '#22C55E' : '#EF4444',
      rsi: rsiValues[i]
    }));
  }, [chartData, macdConfig, rsiConfig]);

  return (
    <div className="space-y-6 mt-8 pt-8 border-t border-border">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Performance Chart</h3>
          
          {/* Drawing Toolbar */}
          <div className="flex items-center gap-1 p-1 bg-foreground/5 rounded-xl border border-border">
            <button 
              onClick={() => { setDrawingMode('none'); setTempPoint(null); }}
              className={cn(
                "p-1.5 rounded-lg transition-all", 
                drawingMode === 'none' ? "bg-background shadow-sm text-green-500" : "text-gray-500 hover:text-foreground"
              )}
              title="Select Mode"
            >
              <MousePointer2 size={14} />
            </button>
            <button 
              onClick={() => setDrawingMode('trendline')}
              className={cn(
                "p-1.5 rounded-lg transition-all", 
                drawingMode === 'trendline' ? "bg-background shadow-sm text-green-500" : "text-gray-500 hover:text-foreground"
              )}
              title="Draw Trendline"
            >
              <Pencil size={14} />
            </button>
            <button 
              onClick={() => setDrawingMode('annotation')}
              className={cn(
                "p-1.5 rounded-lg transition-all", 
                drawingMode === 'annotation' ? "bg-background shadow-sm text-green-500" : "text-gray-500 hover:text-foreground"
              )}
              title="Add Annotation"
            >
              <Type size={14} />
            </button>
            <div className="w-px h-3 bg-border mx-0.5" />
            <button 
              onClick={() => { setTrendlines([]); setAnnotations([]); setTempPoint(null); toast.info("Chart cleared"); }}
              className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg transition-all"
              title="Clear All Drawings"
            >
              <Eraser size={14} />
            </button>
            {isSyncing && (
              <div className="px-2 flex items-center gap-1">
                <Loader2 size={10} className="animate-spin text-blue-500" />
                <span className="text-[8px] font-bold text-blue-500 uppercase">Syncing</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 px-2 py-1 bg-foreground/5 rounded-xl border border-border group hover:border-blue-500/30 transition-all">
            <Calendar size={14} className="text-gray-500 group-hover:text-blue-500 transition-colors" />
            <input 
              type="date" 
              onChange={(e) => handleJumpToDate(e.target.value)}
              className="bg-transparent border-none p-0 text-[10px] font-bold text-gray-500 uppercase focus:ring-0 cursor-pointer w-24"
              title="Jump to specific date"
            />
          </div>

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
            <div className="flex items-center justify-between">
              <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">RSI Parameters</h4>
              <button 
                onClick={resetIndicators}
                className="text-[8px] font-bold text-blue-500 uppercase hover:underline"
              >
                Reset All
              </button>
            </div>
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
        <div className="h-[300px] w-full cursor-crosshair">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart 
              data={indicatorsData}
              onClick={handleChartClick}
            >
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

              {/* Trendlines */}
              {trendlines.map(line => (
                <ReferenceLine 
                  key={line.id}
                  segment={[
                    { x: line.start.x, y: line.start.y },
                    { x: line.end.x, y: line.end.y }
                  ]}
                  stroke="#F59E0B"
                  strokeWidth={2}
                  strokeDasharray="3 3"
                  label={{ 
                    position: 'top', 
                    value: 'Trend', 
                    fill: '#F59E0B', 
                    fontSize: 8, 
                    fontWeight: 'bold' 
                  }}
                />
              ))}

              {/* Annotations */}
              {annotations.map(note => (
                <ReferenceDot 
                  key={note.id}
                  x={note.x}
                  y={note.y}
                  r={4}
                  fill="#3B82F6"
                  stroke="#fff"
                  strokeWidth={2}
                  label={{ 
                    position: 'top', 
                    value: note.text, 
                    fill: '#3B82F6', 
                    fontSize: 10, 
                    fontWeight: 'bold',
                    className: "bg-card px-1 rounded"
                  }}
                />
              ))}

              {/* Temp point for trendline */}
              {tempPoint && (
                <ReferenceDot 
                  x={tempPoint.x}
                  y={tempPoint.y}
                  r={4}
                  fill="#F59E0B"
                  stroke="#fff"
                  strokeWidth={2}
                />
              )}

              <Brush 
                dataKey="date" 
                height={30} 
                stroke="#22C55E" 
                fill="rgba(34, 197, 94, 0.05)"
                className="text-[10px] font-bold"
                startIndex={brushIndex.start}
                endIndex={brushIndex.end}
                onChange={(indices: any) => setBrushIndex(indices)}
                tickFormatter={(val) => {
                  const s = String(val);
                  if (timeframe === '1D') return s.split(' ')[1] || s;
                  return s.split('-')[2] || s;
                }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {showMACD && (
          <div className="h-[180px] w-full bg-foreground/5 rounded-2xl border border-border p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">MACD ({macdConfig.fast}, {macdConfig.slow}, {macdConfig.signal})</h4>
              <div className="flex gap-4">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                  <span className="text-[8px] font-bold text-gray-500 uppercase">MACD</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-yellow-500" />
                  <span className="text-[8px] font-bold text-gray-500 uppercase">Signal</span>
                </div>
              </div>
            </div>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={indicatorsData}>
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-border" vertical={false} />
                <XAxis dataKey="date" hide />
                <YAxis fontSize={8} axisLine={false} tickLine={false} />
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-card border border-border p-2 rounded-lg shadow-xl backdrop-blur-md">
                          {payload.map((p, i) => (
                            <div key={i} className="flex justify-between gap-4">
                              <span className="text-[8px] font-bold uppercase" style={{ color: p.color || p.payload?.histogramColor }}>{p.name}</span>
                              <span className="text-[10px] font-bold">{(p.value as number).toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <ReferenceLine y={0} stroke="currentColor" className="text-border" />
                <Bar dataKey="histogram" name="Histogram">
                  {indicatorsData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.histogramColor} fillOpacity={0.4} />
                  ))}
                </Bar>
                <Line type="monotone" dataKey="macd" name="MACD" stroke="#3B82F6" dot={false} strokeWidth={2} animationDuration={1000} />
                <Line type="monotone" dataKey="signal" name="Signal" stroke="#F59E0B" dot={false} strokeWidth={2} animationDuration={1000} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}

        {showRSI && (
          <div className="h-[150px] w-full bg-foreground/5 rounded-2xl border border-border p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">RSI ({rsiConfig.period})</h4>
              <div className="flex gap-4">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-purple-500" />
                  <span className="text-[8px] font-bold text-gray-500 uppercase">RSI</span>
                </div>
              </div>
            </div>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={indicatorsData}>
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-border" vertical={false} />
                <XAxis dataKey="date" hide />
                <YAxis domain={[0, 100]} fontSize={8} axisLine={false} tickLine={false} ticks={[0, 30, 70, 100]} />
                <ReferenceLine y={70} stroke="#EF4444" strokeDasharray="3 3" label={{ value: 'Overbought', position: 'insideRight', fontSize: 8, fill: '#EF4444', fontWeight: 'bold' }} />
                <ReferenceLine y={30} stroke="#22C55E" strokeDasharray="3 3" label={{ value: 'Oversold', position: 'insideRight', fontSize: 8, fill: '#22C55E', fontWeight: 'bold' }} />
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-card border border-border p-2 rounded-lg shadow-xl backdrop-blur-md">
                          <span className="text-[8px] font-bold uppercase text-purple-500">RSI</span>
                          <span className="text-[10px] font-bold ml-2">{(payload[0].value as number).toFixed(2)}</span>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Line type="monotone" dataKey="rsi" name="RSI" stroke="#A855F7" dot={false} strokeWidth={2} animationDuration={1000} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
};

export const StockAnalysisView = ({ stock, compact = false, onWatch, isWatched, onViewDetails, onCompare }: { stock: StockData, compact?: boolean, onWatch: (s: StockData) => void, isWatched: boolean, onViewDetails?: (s: StockData) => void, onCompare?: (s: StockData) => void }) => {
  const [timeframe, setTimeframe] = useState('1M');
  const [activeTab, setActiveTab] = useState('overview');
  const [summaries, setSummaries] = useState<Record<number, string>>({});
  const [loadingSummaries, setLoadingSummaries] = useState<Record<number, boolean>>({});

  useEffect(() => {
    setSummaries({});
    setLoadingSummaries({});
  }, [stock.symbol]);

  const handleSummarize = async (index: number, headline: string) => {
    if (summaries[index]) return;
    
    setLoadingSummaries(prev => ({ ...prev, [index]: true }));
    try {
      const summary = await summarizeNewsArticle(headline, stock.symbol);
      setSummaries(prev => ({ ...prev, [index]: summary }));
    } catch (error) {
      toast.error("Failed to summarize article");
    } finally {
      setLoadingSummaries(prev => ({ ...prev, [index]: false }));
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: <Activity size={16} /> },
    { id: 'analysis', label: 'AI Analysis', icon: <Zap size={16} /> },
    { id: 'news', label: 'News Feed', icon: <Globe size={16} />, count: stock.news?.length },
    { id: 'corporate', label: 'Corporate Actions', icon: <PieChart size={16} />, count: stock.splits?.length },
  ];

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

          {!compact && <StockChart symbol={stock.symbol} data={stock.chartData} timeframe={timeframe} setTimeframe={setTimeframe} historicalData={stock.historicalData} />}

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
        <div className="flex items-center gap-1 p-1 bg-foreground/5 rounded-2xl w-fit">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "px-6 py-3 rounded-xl text-sm font-bold transition-all flex items-center gap-2",
                activeTab === tab.id 
                  ? "bg-card text-foreground shadow-sm" 
                  : "text-gray-500 hover:text-foreground hover:bg-foreground/5"
              )}
            >
              {tab.icon}
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span className={cn(
                  "px-1.5 py-0.5 rounded-md text-[10px] font-bold",
                  activeTab === tab.id ? "bg-green-500/10 text-green-500" : "bg-foreground/10 text-gray-500"
                )}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {activeTab === 'overview' && (
        <div className="space-y-8">
          <StockChart 
            symbol={stock.symbol}
            data={stock.chartData} 
            timeframe={timeframe} 
            setTimeframe={setTimeframe} 
            historicalData={stock.historicalData}
          />
          
          {!compact && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {(stock.metrics || []).map((metric, i) => (
                <MetricCard key={i} {...metric} />
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'analysis' && (
        <div className="bg-card border border-border p-8 rounded-3xl">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <Zap size={20} className="text-yellow-500" />
              AI Intelligence Report
            </h3>
            <SpeakButton text={stock.aiSummary} />
          </div>
          <div className="prose prose-invert max-w-none text-gray-500 leading-relaxed">
            <ReactMarkdown>{stock.aiSummary}</ReactMarkdown>
          </div>
        </div>
      )}

      {activeTab === 'news' && (
        <div className="bg-card border border-border p-8 rounded-3xl">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <Globe size={20} className="text-blue-500" />
              Latest News Feed
            </h3>
            <div className="px-3 py-1 bg-blue-500/10 text-blue-500 text-[10px] font-bold rounded-full border border-blue-500/20">
              Live Updates
            </div>
          </div>
          
          {stock.news && stock.news.length > 0 ? (
            <div className="space-y-4">
              {stock.news.map((item, i) => (
                <motion.a 
                  key={i} 
                  href={item.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="block p-6 bg-foreground/5 rounded-2xl border border-border hover:border-blue-500/30 transition-all group"
                >
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-0.5 bg-blue-500/10 text-blue-500 text-[10px] font-bold rounded uppercase tracking-widest">
                          {item.source}
                        </span>
                        <span className="text-[10px] text-gray-500 font-medium">{item.date}</span>
                      </div>
                      <h4 className="font-bold text-base mb-3 group-hover:text-blue-500 transition-colors leading-snug">
                        {item.headline}
                      </h4>
                      
                      {summaries[i] ? (
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="mb-4 p-3 bg-blue-500/5 border-l-2 border-blue-500 rounded-r-lg text-xs text-gray-400 italic leading-relaxed"
                        >
                          <span className="font-bold text-blue-500 not-italic mr-1">AI Summary:</span>
                          {summaries[i]}
                        </motion.div>
                      ) : (
                        <button 
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleSummarize(i, item.headline);
                          }}
                          disabled={loadingSummaries[i]}
                          className="mb-4 flex items-center gap-2 text-[10px] font-bold text-blue-500 uppercase tracking-widest bg-blue-500/5 hover:bg-blue-500/10 border border-blue-500/20 px-3 py-1.5 rounded-lg transition-all disabled:opacity-50 group/sum"
                        >
                          {loadingSummaries[i] ? (
                            <>
                              <Loader2 size={12} className="animate-spin" />
                              Generating Summary...
                            </>
                          ) : (
                            <>
                              <Zap size={12} className="group-hover/sum:fill-blue-500 transition-all" />
                              Summarize with AI
                            </>
                          )}
                        </button>
                      )}

                      <div className="flex items-center gap-2 text-xs text-blue-500 font-bold opacity-0 group-hover:opacity-100 transition-all">
                        Read Full Article <ArrowRight size={14} />
                      </div>
                    </div>
                    <div className="w-12 h-12 bg-foreground/5 rounded-xl flex items-center justify-center text-gray-500 group-hover:text-blue-500 transition-colors shrink-0">
                      <Globe size={20} />
                    </div>
                  </div>
                </motion.a>
              ))}
            </div>
          ) : (
            <div className="p-20 text-center bg-foreground/5 rounded-2xl border border-dashed border-border">
              <Globe size={40} className="text-gray-500 mx-auto mb-4 opacity-20" />
              <p className="text-gray-500 font-medium">No recent news found for {stock.symbol}</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'corporate' && (
        <div className="bg-card border border-border p-8 rounded-3xl">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
            <PieChart size={20} className="text-blue-500" />
            Corporate Actions: Stock Splits
          </h3>
          
          {stock.splits && stock.splits.length > 0 ? (
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
          ) : (
            <div className="p-20 text-center bg-foreground/5 rounded-2xl border border-dashed border-border">
              <PieChart size={40} className="text-gray-500 mx-auto mb-4 opacity-20" />
              <p className="text-gray-500 font-medium">No recent corporate actions found for {stock.symbol}</p>
            </div>
          )}
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
