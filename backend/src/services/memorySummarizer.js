import { aiService } from './aiService.js';
import logger from '../utils/logger.js';

export class MemorySummarizer {
  constructor() {
    this.aiService = aiService;
  }

  /**
   * Generates concise bullet-point summary of long conversation history strings
   */
  async summarizeConversation(messages) {
    if (!messages || messages.length === 0) return '';

    try {
      const textToSummarize = messages.map((m) => `${m.role}: ${m.content}`).join('\n');
      const prompt = `Summarize the key points of this conversation concisely in 3-4 bullet points for background context:`;

      const summary = await this.aiService.generateResponse({
        systemInstruction: prompt,
        contents: [{ role: 'user', parts: [{ text: textToSummarize }] }],
      });

      return summary.trim();
    } catch (error) {
      logger.error('Failed to generate conversation summary:', { error: error.message });
      return '';
    }
  }
}