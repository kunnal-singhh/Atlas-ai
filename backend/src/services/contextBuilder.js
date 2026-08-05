import { PromptManager } from './promptManager.js';
import { Conversation } from '../models/Conversation.js';

export class ContextBuilder {
  /**
   * Assembles context payload dynamically based on selected tools and history limits.
   */
  static async buildContext({ user, telegramId, currentMessageText, rawHistory, toolOutputs = [] }) {
    // 1. Get Base Global Prompt (under 100 words)
    const baseSystemPrompt = PromptManager.buildSystemPrompt();

    // 2. Get Minimal User Identity (max 2 lines)
    const minimalIdentity = PromptManager.buildMinimalIdentity(user);

    // 3. Inject tool output context conditionally (only when corresponding tool ran)
    let toolContextString = '';
    const activeTools = toolOutputs.filter(t => t.success && t.summary);
    if (activeTools.length > 0) {
      const toolBlocks = activeTools
        .map((t) => `[RETRIEVED DATA: ${t.type.toUpperCase()}]\n${t.summary}`)
        .join('\n\n');
      if (toolBlocks) {
        toolContextString = `\n\nREAL-TIME GROUNDING:\n${toolBlocks}`;
      }
    }

    // 4. Retrieve existing conversation summary if available
    let existingSummary = '';
    try {
      const conversation = await Conversation.findOne({ telegramId, isActive: true }).lean();
      if (conversation && conversation.summary) {
        existingSummary = conversation.summary;
      }
    } catch (err) {
      // Ignore DB errors gracefully
    }

    let summaryString = '';
    if (existingSummary) {
      summaryString = `\n\nCONVERSATION SUMMARY:\n${existingSummary}`;
    }

    // Combine system prompt elements
    const fullSystemInstruction = [
      baseSystemPrompt,
      minimalIdentity,
      toolContextString,
      summaryString
    ].filter(Boolean).join('\n\n');

    // 5. Limit recent history to the last 6 messages (3 exchanges)
    const recentHistory = rawHistory.slice(0, 6);

    // Chronological order for recent messages
    const chronologicalHistory = [...recentHistory].reverse().map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));

    const contents = chronologicalHistory.map((msg) => ({
      role: msg.role,
      parts: [{ text: msg.content }],
    }));

    // 6. Append Current User Message
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