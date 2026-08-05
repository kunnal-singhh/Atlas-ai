import logger from '../../utils/logger.js';

/**
 * ToolRegistry — Central registry for all Atlas AI tools.
 * 
 * Each registered tool must provide:
 * - name: string (unique identifier)
 * - description: string (what the tool does)
 * - category: string (e.g., 'data_retrieval', 'knowledge', 'user_data')
 * - priority: number (higher = checked first by selector)
 * - keywords: string[] (trigger words for confidence scoring)
 * - patterns: RegExp[] (high-confidence regex patterns)
 * - execute: async (telegramId, userMessage, context) => { type, result }
 * 
 * Adding a new tool = one register() call. Zero changes to existing tools.
 */
class ToolRegistry {
  constructor() {
    /** @type {Map<string, Object>} */
    this.tools = new Map();
  }

  /**
   * Registers a tool with rich metadata.
   * @param {Object} toolDefinition 
   * @param {string} toolDefinition.name - Unique tool identifier
   * @param {string} toolDefinition.description - Human-readable description
   * @param {string} toolDefinition.category - Tool category
   * @param {number} toolDefinition.priority - Selection priority (higher = preferred)
   * @param {string[]} toolDefinition.keywords - Trigger keywords for scoring
   * @param {RegExp[]} toolDefinition.patterns - High-confidence regex patterns
   * @param {Function} toolDefinition.execute - Async execution function
   */
  register(toolDefinition) {
    const { name, description, category, priority, keywords, patterns, execute } = toolDefinition;

    if (!name || !execute) {
      throw new Error(`ToolRegistry: 'name' and 'execute' are required. Got name="${name}"`);
    }

    if (this.tools.has(name)) {
      logger.warn(`ToolRegistry: Overwriting existing tool "${name}"`);
    }

    this.tools.set(name, {
      name,
      description: description || '',
      category: category || 'general',
      priority: priority || 0,
      keywords: keywords || [],
      patterns: patterns || [],
      execute,
      registeredAt: new Date(),
    });

    logger.info(`ToolRegistry: Registered tool "${name}" [${category}] priority=${priority}`);
  }

  /**
   * Retrieves a tool by name.
   * @param {string} name 
   * @returns {Object|null}
   */
  getTool(name) {
    return this.tools.get(name) || null;
  }

  /**
   * Returns all registered tools sorted by priority (descending).
   * @returns {Object[]}
   */
  getAllTools() {
    return [...this.tools.values()].sort((a, b) => b.priority - a.priority);
  }

  /**
   * Returns tool metadata (without execute function) for inspection.
   * @returns {Object[]}
   */
  getToolManifest() {
    return this.getAllTools().map(({ name, description, category, priority, keywords }) => ({
      name,
      description,
      category,
      priority,
      keywordCount: keywords.length,
    }));
  }

  /**
   * Checks if a tool exists.
   * @param {string} name 
   * @returns {boolean}
   */
  has(name) {
    return this.tools.has(name);
  }
}

export const toolRegistry = new ToolRegistry();
