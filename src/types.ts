export interface StockData {
  symbol: string;
  name: string;
  price: string;
  change: string;
  changePercent: string;
  sector: string;
  marketCap: string;
  peRatio: string;
  dividendYield: string;
  high52: string;
  low52: string;
  description: string;
  aiSummary: string;
  investmentScore: number;
  rating: string;
  scoreReasoning: string[];
  metrics: {
    label: string;
    value: string;
    score: number;
    explanation: string;
    trend: 'up' | 'down' | 'neutral';
  }[];
  chartData: { date: string; price: number }[];
  historicalData?: {
    [key: string]: { date: string; price: number }[];
  };
  splits?: {
    date: string;
    ratio: string;
    type: 'split' | 'reverse';
    description: string;
  }[];
  lastUpdated?: string;
  source?: string;
  tags?: string[];
  news?: {
    headline: string;
    source: string;
    date: string;
    url: string;
  }[];
}

export interface PriceAlert {
  id: string;
  symbol: string;
  targetPrice: number;
  type: 'above' | 'below';
  active: boolean;
  createdAt: string;
}

export interface SearchResult {
  type: 'analysis' | 'comparison' | 'discovery' | 'error';
  data?: StockData | StockData[];
  message?: string;
}

export interface MarketTrends {
  gainers: { name: string; symbol: string; price: string; change: string }[];
  losers: { name: string; symbol: string; price: string; change: string }[];
  lastUpdated?: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  isPremium: boolean;
  searchCount: number;
  trendsClickCount: number;
}
