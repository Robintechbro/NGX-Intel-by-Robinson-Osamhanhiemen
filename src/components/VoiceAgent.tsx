import React from 'react';
import { 
  Bot, 
  Mic
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

export const VoiceAgent = ({ onCommand, isListening, startListening }: { onCommand: (cmd: string) => void, isListening: boolean, startListening: () => void }) => {
  return (
    <div className="fixed bottom-4 right-4 md:bottom-8 md:right-8 z-50 flex flex-col items-end gap-4">
      <AnimatePresence>
        {isListening && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className="bg-card border border-border p-3 md:p-4 rounded-2xl shadow-2xl flex items-center gap-3 md:gap-4 mb-2 max-w-[280px] md:max-w-none"
          >
            <div className="w-8 h-8 md:w-10 md:h-10 bg-green-500 rounded-full flex items-center justify-center animate-pulse shrink-0">
              <Mic size={18} className="text-white" />
            </div>
            <div>
              <p className="text-xs font-bold text-foreground">Listening...</p>
              <p className="text-[10px] text-gray-500">Ask me to analyze or compare stocks</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <motion.button 
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={startListening}
        className={cn(
          "w-14 h-14 md:w-16 md:h-16 rounded-full shadow-2xl flex items-center justify-center transition-all duration-500 border-4 border-background",
          isListening ? "bg-green-500 text-white scale-110" : "bg-foreground text-background hover:bg-green-500 hover:text-white"
        )}
      >
        {isListening ? (
          <div className="flex gap-1">
            <motion.div animate={{ height: [8, 16, 8] }} transition={{ repeat: Infinity, duration: 0.5 }} className="w-1 bg-white rounded-full" />
            <motion.div animate={{ height: [16, 8, 16] }} transition={{ repeat: Infinity, duration: 0.5 }} className="w-1 bg-white rounded-full" />
            <motion.div animate={{ height: [8, 16, 8] }} transition={{ repeat: Infinity, duration: 0.5 }} className="w-1 bg-white rounded-full" />
          </div>
        ) : (
          <Bot size={28} className="md:size-32" />
        )}
      </motion.button>
    </div>
  );
};
