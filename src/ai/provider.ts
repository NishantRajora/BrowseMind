import { AIRequest, AIResponse } from '../shared/types';

export interface AIProvider {
  name: string;
  generateResponse(request: AIRequest): Promise<AIResponse>;
}
