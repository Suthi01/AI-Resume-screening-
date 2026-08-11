import React from 'react';
import { motion } from 'framer-motion';

interface BotBubbleProps {
  children: React.ReactNode;
  timestamp?: Date;
}

export function BotBubble({ children, timestamp }: BotBubbleProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -18 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
      className="flex items-end gap-2.5 max-w-[85%] self-start"
    >
      {/* Mini bot avatar */}
      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary to-accent flex-shrink-0 flex items-center justify-center text-[10px] font-bold text-white mb-0.5 shadow-md">
        RB
      </div>

      <div className="flex flex-col gap-1">
        <div className="bg-bg-card border border-white/[0.06] rounded-2xl rounded-tl-sm px-4 py-3 text-text-primary text-sm leading-relaxed shadow-sm">
          {children}
        </div>
        {timestamp && (
          <span className="text-[10px] text-text-muted px-1">
            {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        )}
      </div>
    </motion.div>
  );
}

export default BotBubble;
