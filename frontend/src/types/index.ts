export interface Citation {
  source: string;
  page?: string | number;
  snippet?: string;
}

export interface TokenMetrics {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  tokens_saved: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  citations?: Citation[];
  responseTimeSec?: number;
  cached?: boolean;
  fastRoute?: string | null;
  tokens?: TokenMetrics;
}

export interface ChatSession {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: ChatMessage[];
}

export interface BackendStatus {
  online: boolean;
  service?: string;
  message?: string;
  description?: string;
  knowledge_base?: string;
  llm_model?: string;
  embedding_model?: string;
  vector_database?: string;
  features?: Record<string, string>;
  endpoint?: string;
  status?: string;
}

export interface UploadResponse {
  status: string;
  filename: string;
  chunks_added: number;
  message: string;
}
