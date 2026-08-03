import { PromptManager } from './promptManager.js';
import { MemoryService } from './memoryService.js';
import { TokenManager } from './tokenManager.js';

export class ContextBuilder {
  /**
   * Assembles context payload following strict ordering rules:
   * 1. System Prompt
   * 2. User Profile Context
   * 3. Relevant Long-Term Memories
   * 4. Recent Conversation History
   * 5. Current User Message
   */
  static async buildContext({ user, telegramId, currentMessageText, rawHistory }) {
    // 1 & 2. Generate Base System Prompt with Profile Context
    const baseSystemPrompt = PromptManager.buildSystemPrompt(user);

    // 3. Retrieve Relevant Long-Term Memories
    const memories = await MemoryService.getRelevantMemories(telegramId, currentMessageText);

    let memoryContextString = '';
    if (memories.length > 0) {
      const memoryLines = memories.map((m) => `- [${m.category}] ${m.fact}`).join('\n');
      memoryContextString = `\n\nRELEVANT LONG-TERM MEMORIES ABOUT USER:\n${memoryLines}\n(Use these naturally to tailor responses. Do not reference these memory tags directly.)`;
    }

    const fullSystemInstruction = `${baseSystemPrompt}${memoryContextString}`;

    // 4. Format & Prune Recent Conversation History
    const chronologicalHistory = [...rawHistory].reverse().map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));

    const prunedHistory = TokenManager.pruneHistory(chronologicalHistory, 2500);

    const contents = prunedHistory.map((msg) => ({
      role: msg.role,
      parts: [{ text: msg.content }],
    }));

    // 5. Append Current User Message
    contents.push({
      role: 'user',
      parts: [{ text: currentMessageText }],
    });

    return {
      systemInstruction: fullSystemInstruction,
      contents,
    };
  }
}