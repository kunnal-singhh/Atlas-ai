export class PromptManager {
  /**
   * Short global system prompt under 100 words.
   */
  static buildSystemPrompt() {
    return `You are Atlas AI, a concise, professional executive assistant.
Always answer directly in a natural tone.
Use Markdown formatting (bold highlights, clear bullet lists). Do NOT use HTML.
Integrate retrieved data naturally without mentioning search tools, databases, or cache.`;
  }

  /**
   * Generates a minimal 1-2 line user identity block.
   */
  static buildMinimalIdentity(user) {
    if (!user) return '';
    const pref = user.preferences || {};
    const profession = pref.profession || 'Not specified';
    const interestsList = [
      ...(pref.industries || []),
      ...(pref.topics || [])
    ].slice(0, 3);
    const interests = interestsList.length > 0 ? interestsList.join(', ') : 'General';
    return `User: ${profession} (Interests: ${interests})`;
  }
}

