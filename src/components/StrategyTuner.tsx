import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Zap, Shield, Target, TrendingUp, Check, X, Info } from 'lucide-react';
import { cn } from '../lib/utils';
import { InvestorProfile, InvestorStyle, RiskAppetite } from '../types';

interface StrategyTunerProps {
  profile: InvestorProfile;
  onChange: (profile: InvestorProfile) => void;
  onClose: () => void;
}

const styles: { id: InvestorStyle; label: string; desc: string; icon: any; color: string }[] = [
  { id: 'dividend_hunter', label: 'Dividend Hunter', desc: 'Focus on regular payouts & income stability.', icon: Shield, color: 'text-blue-500' },
  { id: 'growth_seeker', label: 'Growth Seeker', desc: 'Prioritize long-term capital appreciation.', icon: TrendingUp, color: 'text-green-500' },
  { id: 'capital_preserver', label: 'Capital Preserver', desc: 'Safety first. Minimal risk to principal.', icon: Target, color: 'text-indigo-500' },
  { id: 'value_investor', label: 'Value Investor', desc: 'Hunt for undervalued gems on the NGX.', icon: Zap, color: 'text-yellow-500' }
];

const risks: { id: RiskAppetite; label: string; color: string }[] = [
  { id: 'conservative', label: 'Conservative', color: 'bg-green-500' },
  { id: 'moderate', label: 'Moderate', color: 'bg-yellow-500' },
  { id: 'aggressive', label: 'Aggressive', color: 'bg-red-500' }
];

const sectors = ['Banking', 'Consumer Goods', 'Industrial Goods', 'Oil & Gas', 'Agriculture', 'Telecom', 'Real Estate'];

export const StrategyTuner = ({ profile, onChange, onClose }: StrategyTunerProps) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-md"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="bg-card border border-border w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden relative"
        onClick={e => e.stopPropagation()}
      >
        <div className="absolute top-0 right-0 p-8 space-y-2">
          <button onClick={onClose} className="p-3 bg-foreground/5 hover:bg-foreground/10 rounded-2xl transition-all">
            <X size={20} />
          </button>
        </div>

        <div className="p-10">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 bg-green-500 rounded-2xl shadow-lg shadow-green-500/20">
              <Target size={24} className="text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-bold tracking-tight">Strategy Tuner</h2>
              <p className="text-gray-500">Fine-tune your AI analyst to match your Investor DNA.</p>
            </div>
          </div>

          <div className="space-y-10">
            {/* Investment Style */}
            <section>
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-6 px-1">Primary Objective</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {styles.map(style => (
                  <button
                    key={style.id}
                    onClick={() => onChange({ ...profile, style: style.id })}
                    className={cn(
                      "flex items-start gap-4 p-5 rounded-[2rem] border transition-all text-left group",
                      profile.style === style.id 
                        ? "bg-foreground/5 border-foreground shadow-sm" 
                        : "bg-transparent border-border hover:border-foreground/20"
                    )}
                  >
                    <div className={cn("p-2 rounded-xl bg-foreground/5 group-hover:scale-110 transition-transform", style.color)}>
                      <style.icon size={20} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold">{style.label}</span>
                        {profile.style === style.id && (
                          <motion.div layoutId="style-check">
                            <Check size={16} className="text-green-500" />
                          </motion.div>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 leading-relaxed">{style.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </section>

            {/* Risk Appetite */}
            <section>
              <div className="flex items-center justify-between mb-6 px-1">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Tolerance Level</h3>
                <span className={cn(
                  "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-white shadow-lg",
                  risks.find(r => r.id === profile.riskAppetite)?.color
                )}>
                  {profile.riskAppetite}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-4">
                {risks.map(risk => (
                  <button
                    key={risk.id}
                    onClick={() => onChange({ ...profile, riskAppetite: risk.id })}
                    className={cn(
                      "p-4 rounded-2xl border transition-all font-bold text-sm",
                      profile.riskAppetite === risk.id 
                        ? "bg-foreground text-background border-foreground" 
                        : "bg-foreground/5 text-gray-500 border-border hover:border-foreground/20"
                    )}
                  >
                    {risk.label}
                  </button>
                ))}
              </div>
            </section>

            {/* Sector Focus */}
            <section>
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-6 px-1">High-Priority Sectors</h3>
              <div className="flex flex-wrap gap-2">
                {sectors.map(sector => {
                  const isSelected = profile.sectors.includes(sector);
                  return (
                    <button
                      key={sector}
                      onClick={() => {
                        const newSectors = isSelected 
                          ? profile.sectors.filter(s => s !== sector)
                          : [...profile.sectors, sector];
                        onChange({ ...profile, sectors: newSectors });
                      }}
                      className={cn(
                        "px-4 py-2 rounded-full text-xs font-bold border transition-all",
                        isSelected 
                          ? "bg-green-500/10 text-green-500 border-green-500/30" 
                          : "bg-foreground/5 text-gray-500 border-border hover:border-foreground/10"
                      )}
                    >
                      {sector}
                    </button>
                  );
                })}
              </div>
            </section>
          </div>

          <div className="mt-12 flex items-center gap-4 p-6 bg-blue-500/5 rounded-[2rem] border border-blue-500/20">
            <Info size={20} className="text-blue-500 shrink-0" />
            <p className="text-xs text-gray-500 leading-relaxed italic">
              Updating your strategy will instantly re-calibrate all AI analysis throughout the platform to prioritize your goals.
            </p>
          </div>

          <button 
            onClick={onClose}
            className="w-full mt-8 py-5 bg-foreground text-background font-black uppercase tracking-widest rounded-3xl hover:bg-gray-800 transition-all shadow-xl shadow-foreground/10"
          >
            Activate Persona
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};
