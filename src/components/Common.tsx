import React, { useState, useEffect } from 'react';
import { 
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Volume2,
  VolumeX,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { textToSpeech } from '../services/geminiService';
import { toast } from 'sonner';

export const SidebarItem = ({ icon: Icon, label, active, onClick }: { icon: any, label: string, active?: boolean, onClick?: () => void }) => (
  <button 
    onClick={onClick}
    className={cn(
      "flex items-center gap-3 px-4 py-3 w-full text-left transition-all duration-200 rounded-lg group",
      active 
        ? "bg-foreground/10 text-foreground" 
        : "text-gray-500 hover:bg-foreground/5 hover:text-foreground"
    )}
  >
    <Icon size={20} className={cn("transition-transform group-hover:scale-110", active ? "text-green-500" : "text-gray-400")} />
    <span className="font-medium text-sm">{label}</span>
    {active && <motion.div layoutId="active-pill" className="ml-auto w-1 h-4 bg-green-500 rounded-full" />}
  </button>
);

export const MetricCard = ({ label, value, score, explanation, trend }: any) => (
  <div className="bg-card border border-border p-5 rounded-2xl hover:border-foreground/10 transition-all group">
    <div className="flex justify-between items-start mb-4">
      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</span>
      {trend === 'up' ? (
        <ArrowUpRight size={16} className="text-green-500" />
      ) : trend === 'down' ? (
        <ArrowDownRight size={16} className="text-red-500" />
      ) : (
        <Activity size={16} className="text-blue-500" />
      )}
    </div>
    <div className="text-2xl font-bold text-foreground mb-2">{value}</div>
    <div className="w-full bg-foreground/5 h-1.5 rounded-full overflow-hidden mb-3">
      <motion.div 
        initial={{ width: 0 }}
        animate={{ width: `${score}%` }}
        className={cn(
          "h-full rounded-full",
          score > 70 ? "bg-green-500" : score > 40 ? "bg-yellow-500" : "bg-red-500"
        )}
      />
    </div>
    <p className="text-xs text-gray-500 leading-relaxed group-hover:text-gray-400 transition-colors">
      {explanation}
    </p>
  </div>
);

export const CompactMetric = ({ label, value, score }: { label: string, value: string, score: number }) => (
  <div className="flex flex-col gap-1">
    <div className="flex justify-between items-center">
      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{label}</span>
      <span className="text-[10px] font-bold text-foreground">{value}</span>
    </div>
    <div className="w-full bg-foreground/5 h-1 rounded-full overflow-hidden">
      <motion.div 
        initial={{ width: 0 }}
        animate={{ width: `${score}%` }}
        className={cn(
          "h-full rounded-full",
          score > 70 ? "bg-green-500" : score > 40 ? "bg-yellow-500" : "bg-red-500"
        )}
      />
    </div>
  </div>
);

export const LivePrice = ({ value, change, changePercent, size = "large" }: { value: string, change: string, changePercent: string, size?: "small" | "large" }) => {
  const [prevValue, setPrevValue] = useState(value);
  const [flash, setFlash] = useState<"up" | "down" | null>(null);

  useEffect(() => {
    if (value !== prevValue) {
      const oldNum = parseFloat(prevValue.replace(/[^\d.]/g, ''));
      const newNum = parseFloat(value.replace(/[^\d.]/g, ''));
      
      if (!isNaN(oldNum) && !isNaN(newNum)) {
        setFlash(newNum > oldNum ? "up" : "down");
        const timer = setTimeout(() => setFlash(null), 2000);
        setPrevValue(value);
        return () => clearTimeout(timer);
      }
      setPrevValue(value);
    }
  }, [value, prevValue]);

  const isPositive = change?.startsWith('+');

  return (
    <div className="relative">
      <AnimatePresence mode="wait">
        <motion.div
          key={value}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -5 }}
          className={cn(
            "font-bold transition-colors duration-500",
            size === "large" ? "text-2xl" : "text-lg",
            flash === "up" ? "text-green-500" : flash === "down" ? "text-red-500" : "text-foreground"
          )}
        >
          {value}
          {flash && (
            <motion.span
              initial={{ opacity: 1, scale: 1 }}
              animate={{ opacity: 0, scale: 1.5 }}
              className={cn(
                "absolute -right-4 top-0",
                flash === "up" ? "text-green-500" : "text-red-500"
              )}
            >
              {flash === "up" ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
            </motion.span>
          )}
        </motion.div>
      </AnimatePresence>
      <div className={cn("text-[10px] font-medium flex items-center gap-1", isPositive ? "text-green-500" : "text-red-500")}>
        {change} ({changePercent})
      </div>
    </div>
  );
};

const playAudio = (base64: string) => {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  const blob = new Blob([bytes], { type: 'audio/mp3' });
  const url = URL.createObjectURL(blob);
  const audio = new Audio(url);
  audio.play();
  return audio;
};

export const SpeakButton = ({ text }: { text: string }) => {
  const [loading, setLoading] = useState(false);
  const [playing, setPlaying] = useState(false);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  const handleSpeak = async () => {
    if (playing) {
      audioRef.current?.pause();
      setPlaying(false);
      return;
    }

    setLoading(true);
    try {
      const base64 = await textToSpeech(text);
      if (base64) {
        audioRef.current = playAudio(base64);
        setPlaying(true);
        audioRef.current.onended = () => setPlaying(false);
      } else {
        toast.error("Speech generation failed");
      }
    } catch (error) {
      console.error("TTS Error", error);
      toast.error("Failed to generate speech");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button 
      onClick={handleSpeak}
      disabled={loading}
      className={cn(
        "p-2 rounded-xl transition-all border border-border flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest",
        playing ? "bg-green-500 text-white border-green-500" : "bg-foreground/5 text-gray-500 hover:text-foreground hover:bg-foreground/10"
      )}
    >
      {loading ? (
        <Loader2 className="animate-spin" size={14} />
      ) : playing ? (
        <Volume2 size={14} />
      ) : (
        <VolumeX size={14} />
      )}
      {playing ? "Playing" : "Listen"}
    </button>
  );
};
