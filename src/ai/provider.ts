import { AIResponse, AIError } from '../shared/types.js';

export interface AIProvider {
  generate(prompt: string, systemPrompt: string): Promise<AIResponse>;
  testConnection(): Promise<{ success: boolean; message: string }>;
}
