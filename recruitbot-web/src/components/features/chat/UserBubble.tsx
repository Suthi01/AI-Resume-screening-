import { motion } from 'framer-motion';

interface UserBubbleProps {
  text: string;
  timestamp?: Date;
}

export function UserBubble({ text, timestamp }: UserBubbleProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 18 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
      className="flex flex-col items-end gap-1 max-w-[80%] self-end"
    >
      <div
        className="px-4 py-3 rounded-2xl rounded-tr-sm text-white text-sm leading-relaxed shadow-md"
        style={{
          background: 'linear-gradient(135deg, #6366f1 0%, #ec4899 100%)',
        }}
      >
        {text}
      </div>
      {timestamp && (
        <span className="text-[10px] text-text-muted px-1">
          {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      )}
    </motion.div>
  );
}

export default UserBubble;
