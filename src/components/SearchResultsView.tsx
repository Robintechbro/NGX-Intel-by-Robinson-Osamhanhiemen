import React from 'react';
import { 
  TrendingUp, 
  TrendingDown,
  Globe,
  Zap,
  ArrowRight,
  Loader2,
  PieChart,
  ArrowUpRight,
  Activity
} from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import { StockData, SearchResult } from '../types';
import ReactMarkdown from 'react-markdown';
import { StockAnalysisView } from './StockAnalysisView';
import { SpeakButton } from './Common';

export const SearchResultsView = ({ 
  result, 
  onWatch, 
  isWatched, 
  onStockClick 
}: { 
  result: SearchResult, 
  onWatch: (s: StockData) => void, 
  isWatched: (symbol: string) => boolean,
  onStockClick: (symbol: string) => void
}) => {
  if (!result) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-12"
    >
      {result.type === 'analysis' && result.data && !Array.isArray(result.data) && (
        <StockAnalysisView 
          stock={result.data as StockData} 
          onWatch={onWatch}
          isWatched={isWatched((result.data as StockData).symbol)}
        />
      )}

      {result.type === 'comparison' && Array.isArray(result.data) && (
        <div className="space-y-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {(result.data as StockData[]).map((stock, i) => (
              <div key={i} className="space-y-4">
                <div className="flex items-center justify-between px-4">
                  <h3 className="text-lg font-bold text-gray-500 uppercase tracking-widest">Competitor {i + 1}</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-green-500">{stock.symbol}</span>
                  </div>
                </div>
                <StockAnalysisView 
                  stock={stock} 
                  compact={true}
                  onWatch={onWatch}
                  isWatched={isWatched(stock.symbol)}
                  onViewDetails={(s) => onStockClick(s.symbol)}
                />
              </div>
            ))}
          </div>
          <div className="bg-card border border-border p-8 rounded-3xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Zap size={20} className="text-yellow-500" />
                AI Comparison Verdict
              </h3>
              <SpeakButton text={result.message || ""} />
            </div>
            <div className="prose prose-invert max-w-none text-gray-500 leading-relaxed">
              <ReactMarkdown>{result.message || ""}</ReactMarkdown>
            </div>
          </div>
        </div>
      )}

      {result.type === 'discovery' && Array.isArray(result.data) && (
        <div className="space-y-8">
          <div className="flex flex-col gap-2">
            <h2 className="text-3xl font-bold">Discovery Results</h2>
            <div className="prose prose-invert max-w-none text-gray-500 leading-relaxed">
              <ReactMarkdown>{result.message || ""}</ReactMarkdown>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(result.data as StockData[]).map((stock, i) => (
              <div key={i} className="bg-card border border-border p-6 rounded-2xl hover:border-green-500/30 transition-all group flex flex-col h-full">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold text-lg group-hover:text-green-500 transition-colors">{stock.name}</h3>
                    <p className="text-xs text-gray-500">{stock.symbol} • {stock.sector}</p>
                  </div>
                  <div className={cn(
                    "px-2 py-1 rounded-lg text-[10px] font-bold",
                    stock.change.startsWith('+') ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
                  )}>
                    {stock.changePercent}
                  </div>
                </div>
                <p className="text-xs text-gray-500 line-clamp-3 mb-6 flex-1">{stock.description}</p>
                <div className="flex items-center justify-between pt-4 border-t border-border">
                  <div className="text-sm font-bold">{stock.price}</div>
                  <button 
                    onClick={() => onStockClick(stock.symbol)}
                    className="p-2 bg-foreground/5 rounded-xl hover:bg-foreground/10 transition-all"
                  >
                    <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {result.type === 'error' && (
        <div className="max-w-2xl mx-auto p-12 bg-red-500/5 border border-red-500/20 rounded-[2.5rem] text-center space-y-6">
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto">
            <Activity size={32} className="text-red-500" />
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-bold">Analysis Error</h3>
            <p className="text-gray-500">{result.message || "We encountered an issue while analyzing the market data. Please try again."}</p>
          </div>
          <button 
            onClick={() => window.location.reload()}
            className="px-8 py-3 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 transition-all"
          >
            Retry Analysis
          </button>
        </div>
      )}
    </motion.div>
  );
};
