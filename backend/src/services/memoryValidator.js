export class MemoryValidator {
  /**
   * Rigidly validates extracted memory facts before storage.
   * Ensures generic chat, questions, and invalid categories are rejected.
   *
   * @param {Object} memoryFact - The parsed memory item from MemoryExtractor
   * @returns {boolean} - true if valid, false if rejected
   */
  static isValid(memoryFact) {
    if (!memoryFact || !memoryFact.fact) {
      return false;
    }

    const category = memoryFact.category || 'GENERAL';
    const factText = memoryFact.fact.trim();
    const factLower = factText.toLowerCase();

    // Reject short or empty facts
    if (factText.length < 10) {
      return false;
    }

    // Reject GENERAL category entirely as requested in spec
    if (category === 'GENERAL') {
      return false;
    }

    // Reject 'User mentioned' placeholder garbage
    if (factLower.startsWith('user mentioned')) {
      return false;
    }

    // Reject questions
    if (factLower.endsWith('?')) {
      return false;
    }

    // Reject common query/command/chat prefixes
    const rejectedPrefixes = [
      'what', 'who', 'why', 'how', 'explain', 'tell me',
      'can you', 'do you', 'is it', 'should i',
      'hi', 'hello', 'thanks', 'okay', 'good morning', 'good evening'
    ];

    for (const prefix of rejectedPrefixes) {
      if (factLower.startsWith(prefix + ' ') || factLower === prefix) {
        return false;
      }
    }

    return true;
  }
}
