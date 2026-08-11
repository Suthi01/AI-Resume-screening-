import type { ReactNode } from 'react';

export type MessageType = 'user' | 'bot';

export interface Message {
  id: string;
  type: MessageType;
  /** Text content for user messages */
  text?: string;
  /** Rich content (ReactNode) for bot messages */
  content?: ReactNode;
  timestamp: Date;
}
