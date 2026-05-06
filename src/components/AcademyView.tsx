import React from 'react';
import { 
  BookOpen, 
  BarChart3, 
  Zap, 
  TrendingUp, 
  Shield, 
  PieChart, 
  ArrowUpRight, 
  ChevronRight, 
  Globe 
} from 'lucide-react';
import { motion } from 'motion/react';

export const AcademyView = ({ onOpenLesson }: { onOpenLesson: (lesson: any) => void }) => {
  const courses = [
    { 
      title: 'NGX Basics: Getting Started', 
      desc: 'The foundation of your investment journey in Nigeria.', 
      icon: <BookOpen size={24} />, 
      level: 'Beginner', 
      time: '7 min read', 
      content: "To start investing on the NGX, you need three things: 1. A CSCS account... 2. A stockbroker... 3. Capital.",
      fullContent: `
### How to Get Started with NGX Investment

Investing in the Nigerian Stock Exchange (NGX) is one of the most effective ways to build long-term wealth in Nigeria.

#### Step 1: Understand the Requirements
1. **CSCS Account:** Digital vault for shares.
2. **Stockbroker:** Intermediaries for trading.
3. **Bank Account & BVN.**

#### Step 2: Choose Your Platform
Modern apps like Bamboo, Chaka, or Trove allow trading NGX stocks alongside US stocks.

#### Step 3: Start Small
Minimum units is usually 100. Start with "Blue Chip" companies like GTCO, Zenith, or Dangote Cement.
      `
    },
    { 
      title: 'Fundamental Analysis: The NGX Way', 
      desc: 'How to pick winning companies by looking at their numbers.', 
      icon: <BarChart3 size={24} />, 
      level: 'Intermediate', 
      time: '10 min read', 
      content: "Focus on Dividend Yield, P/E Ratio, and Earnings Growth.",
      fullContent: `
### Fundamental Analysis in the Nigerian Market

1. **Dividend Yield:** Aim for 8-15%.
2. **P/E Ratio:** Often lower than US markets (look for under 10x).
3. **Earnings Per Share (EPS) Growth.**
      `
    },
    { 
      title: 'Dividend Aristocrats of Nigeria', 
      desc: 'Building a passive income stream with the most reliable payers.', 
      icon: <Zap size={24} />, 
      level: 'Beginner', 
      time: '8 min read', 
      content: "Reliable payers include Zenith, GTCO, Dangote Cement, and MTN Nigeria.",
      fullContent: `
### Building Wealth with Nigerian Dividend Aristocrats

Dividends are a primary driver of stock market returns in Nigeria.

- **Zenith Bank & GTCO:** Decades of consistent payouts.
- **MTN Nigeria:** High margins and payouts.
- **Nesting Nigeria:** Stability and regular income.
      `
    },
    { 
      title: 'Technical Analysis & Market Timing', 
      desc: 'Using charts to identify entry and exit points.', 
      icon: <TrendingUp size={24} />, 
      level: 'Advanced', 
      time: '12 min read', 
      content: "Watch MAs, Support/Resistance, and Volume.",
      fullContent: `
### Technical Analysis for the NGX

1. **Moving Averages (50-Day, 200-Day).**
2. **Support and Resistance.**
3. **Volume:** Critical for identifying institutional buying.
      `
    },
    { 
      title: 'Inflation & Currency Hedging', 
      desc: 'Protecting your wealth against Naira devaluation.', 
      icon: <Shield size={24} />, 
      level: 'Intermediate', 
      time: '10 min read', 
      content: "Focus on companies with Dollar-linked earnings.",
      fullContent: `
### Hedging Against Inflation

- **Asset-Rich Companies:** Dangote Cement, BUA Foods.
- **Dollar Revernues:** Seplat Energy.
- **Pricing Power:** Nestle, Unilever.
      `
    },
    { 
      title: 'Portfolio Diversification', 
      desc: 'Spreading risk across sectors and asset classes.', 
      icon: <PieChart size={24} />, 
      level: 'Beginner', 
      time: '6 min read', 
      content: "Don't put all your eggs in one basket.",
      fullContent: `
### Diversification: The Only Free Lunch

Spread investments across Banking, Industrial, Consumer, and Telecoms. Use the 5-10-20 rule.
      `
    }
  ];

  return (
    <div className="space-y-8 lg:space-y-12 pb-20">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0">
        <div>
          <h2 className="text-2xl md:text-4xl font-bold mb-2">Investor Academy</h2>
          <p className="text-gray-500 text-sm md:text-lg">Master the art of investing in the Nigerian stock market (NGX).</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {courses.map((course, i) => (
          <div 
            key={i} 
            onClick={() => onOpenLesson(course)}
            className="bg-card border border-border p-8 rounded-3xl transition-all group flex flex-col h-full relative hover:border-blue-500/30 cursor-pointer"
          >
            <div className="flex justify-between items-start mb-6">
              <div className="w-12 h-12 bg-foreground/5 rounded-2xl flex items-center justify-center text-gray-500 group-hover:text-blue-500 transition-colors">
                {course.icon}
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className="px-3 py-1 bg-blue-500/10 text-blue-500 text-[10px] font-bold rounded-full border border-blue-500/20">
                  {course.level}
                </span>
                <span className="text-[10px] text-gray-500">{course.time}</span>
              </div>
            </div>
            <h3 className="text-2xl font-bold mb-3 group-hover:text-blue-500 transition-colors">{course.title}</h3>
            <p className="text-gray-500 leading-relaxed mb-6 flex-1">{course.desc}</p>
            
            <button className="flex items-center justify-center w-full py-4 text-xs font-bold rounded-2xl transition-all gap-2 bg-foreground/5 text-blue-500 hover:bg-blue-500 hover:text-white group-hover:bg-blue-500 group-hover:text-white">
              READ FULL ARTICLE <ChevronRight size={14} />
            </button>
          </div>
        ))}
      </div>

      <div className="bg-card border border-border p-10 rounded-[2.5rem] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent pointer-events-none" />
        <div className="relative z-10">
          <h2 className="text-2xl font-bold mb-8 flex items-center gap-3">
            <Globe size={24} className="text-blue-500" />
            Recommended Resources
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { name: 'NGX Official Site', url: 'https://ngxgroup.com', desc: 'Official market data, news, and listed company reports.' },
              { name: 'Nairametrics', url: 'https://nairametrics.com', desc: 'Leading financial news and analysis for the Nigerian market.' },
              { name: 'Proshare Nigeria', url: 'https://proshare.co', desc: 'Deep-dive research and professional market intelligence.' },
              { name: 'Investopedia', url: 'https://investopedia.com', desc: 'Global standard for financial education and terminology.' },
              { name: 'SEC Nigeria', url: 'https://sec.gov.ng', desc: 'Regulatory body for the Nigerian capital market.' },
              { name: 'TradingView', url: 'https://tradingview.com', desc: 'Best-in-class charting tools for technical analysis.' }
            ].map((res) => (
              <a 
                key={res.name}
                href={res.url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-6 bg-foreground/5 rounded-2xl hover:bg-foreground/10 transition-all border border-border hover:border-blue-500/30 group"
              >
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-bold group-hover:text-blue-500 transition-colors">{res.name}</h4>
                  <ArrowUpRight size={16} className="text-gray-500 group-hover:text-blue-500 transition-all" />
                </div>
                <p className="text-xs text-gray-500 leading-relaxed">{res.desc}</p>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
