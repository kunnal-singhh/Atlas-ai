import { toolRegistry } from './toolRegistry.js';
import logger from '../../utils/logger.js';

/**
 * ToolExecutor — Executes one or more tools and returns normalized output.
 * 
 * Responsibilities:
 * - Execute primary + secondary tools in parallel
 * - Normalize all tool outputs into a standard shape
 * - Catch per-tool errors without crashing the pipeline
 * - Log tool selection, execution time, and failures
 */
export class ToolExecutor {
  /**
   * Executes the selected tools (primary + secondary) and returns normalized results.
   * 
   * @param {string|null} primaryToolName 
   * @param {string[]} secondaryToolNames 
   * @param {string} telegramId 
   * @param {string} userMessage 
   * @param {Object} context - Extra context (user, profile, etc.)
   * @returns {Promise<{ results: Object[], executionTimeMs: number }>}
   */
  static async execute(primaryToolName, secondaryToolNames, telegramId, userMessage, context = {}) {
    const startTime = Date.now();
    const results = [];

    if (!primaryToolName) {
      return { results: [], executionTimeMs: 0 };
    }

    // Collect all tool names to execute
    const allToolNames = [primaryToolName, ...secondaryToolNames];

    // Execute all tools in parallel
    const execPromises = allToolNames.map((toolName) =>
      ToolExecutor._executeSingle(toolName, telegramId, userMessage, context)
    );

    const settled = await Promise.allSettled(execPromises);

    for (let i = 0; i < settled.length; i++) {
      const { status, value, reason } = settled[i];
      const toolName = allToolNames[i];

      if (status === 'fulfilled' && value) {
        results.push(ToolExecutor._normalize(toolName, value));
      } else {
        logger.error(`[ToolExecutor] Tool "${toolName}" failed:`, {
          error: reason?.message || 'Unknown error',
        });
        results.push({
          type: toolName,
          success: false,
          data: null,
          summary: `Tool "${toolName}" encountered an error and returned no data.`,
          error: reason?.message || 'Execution failed',
        });
      }
    }

    const executionTimeMs = Date.now() - startTime;
    logger.info(`[ToolExecutor] Completed ${results.length} tool(s) in ${executionTimeMs}ms`);

    return { results, executionTimeMs };
  }

  /**
   * Executes a single tool by name.
   * @private
   */
  static async _executeSingle(toolName, telegramId, userMessage, context) {
    const tool = toolRegistry.getTool(toolName);
    if (!tool) {
      throw new Error(`Tool "${toolName}" not found in registry`);
    }

    const start = Date.now();
    const result = await tool.execute(telegramId, userMessage, context);
    const elapsed = Date.now() - start;

    logger.info(`[ToolExecutor] "${toolName}" executed in ${elapsed}ms`, {
      type: result?.type,
      hasData: !!result?.result,
    });

    return result;
  }

  /**
   * Normalizes tool output into a consistent shape for ContextBuilder consumption.
   * 
   * Standard normalized shape:
   * {
   *   type: string,          // tool name
   *   success: boolean,      // did it return useful data?
   *   data: any,             // raw structured data
   *   summary: string,       // plain-text summary for AI prompt injection
   *   error: string|null     // error message if failed
   * }
   * 
   * @param {string} toolName 
   * @param {Object} rawOutput - { type, result } from the tool
   * @returns {Object} Normalized output
   */
  static _normalize(toolName, rawOutput) {
    const { type, result } = rawOutput || {};

    switch (type) {
      case 'memory': {
        const memories = result?.memories || [];
        const categories = result?.categories || {};
        
        const categoryEmojis = {
          PROFILE: '👨 Profile',
          WORK: '💼 Work',
          FINANCE: '📈 Finance',
          INTEREST: '🌟 Interests',
          PREFERENCE: '⚙️ Preferences',
          LOCATION: '📍 Location',
          GOAL: '🎯 Goals',
          SKILL: '🛠 Skills'
        };

        const summaryParts = [];
        if (memories.length > 0) {
          summaryParts.push('🧠 What I Remember About You:');
          
          for (const [cat, facts] of Object.entries(categories)) {
            const label = categoryEmojis[cat] || `📝 ${cat}`;
            summaryParts.push(`\n${label}`);
            
            // Reconstruct a cleaner bullet point from structuredData if possible, otherwise use the fact
            const matchingMemories = memories.filter(m => m.category === cat);
            matchingMemories.forEach(m => {
              if (m.structuredData && m.structuredData.entity) {
                let bullet = m.structuredData.entity;
                if (m.structuredData.ticker) bullet += ` (${m.structuredData.ticker})`;
                summaryParts.push(`• ${bullet}`);
              } else {
                // If it's a raw sentence, just strip the "User is" prefix for cleaner UI
                let cleanFact = m.fact.replace(/^User (is|has|prefers|likes|follows) /i, '');
                cleanFact = cleanFact.charAt(0).toUpperCase() + cleanFact.slice(1);
                summaryParts.push(`• ${cleanFact}`);
              }
            });
          }
        }

        return {
          type: 'memory',
          success: memories.length > 0,
          data: result,
          summary: memories.length > 0
            ? summaryParts.join('\n')
            : 'No memories found for this user.',
          error: null,
        };
      }

      case 'finance': {
        const raw = result?.raw;
        const hasData = raw && (raw.summaryText || raw.stories?.length > 0 || raw.marketOverview);
        return {
          type: 'finance',
          success: !!hasData,
          data: result,
          summary: hasData
            ? `Financial Intelligence:\n${raw.summaryText || raw.marketOverview || JSON.stringify(raw.stories?.slice(0, 2))}`
            : 'No financial data available at this time.',
          error: null,
        };
      }

      case 'liveSearch': {
        const searchResults = result?.results || [];
        const synthesized = result?.synthesized || '';
        const summaryLines = searchResults.slice(0, 5).map(
          (r) => `- ${r.title}: ${r.snippet} (${r.source})`
        );
        return {
          type: 'liveSearch',
          success: searchResults.length > 0 || synthesized.length > 0,
          data: result,
          summary: synthesized
            ? `Live Search Results:\n${synthesized}\n\nSources:\n${summaryLines.join('\n')}`
            : 'Live search returned no results.',
          error: null,
        };
      }

      case 'profile': {
        const user = result?.user;
        const profile = result?.profile;
        const sections = [];
        if (user) {
          sections.push(`Name: ${user.firstName || ''} ${user.lastName || ''}`.trim());
          sections.push(`Profession: ${user.preferences?.profession || 'Not set'}`);
          sections.push(`Industries: ${user.preferences?.industries?.join(', ') || 'None'}`);
          sections.push(`Companies: ${user.preferences?.companies?.join(', ') || 'None'}`);
        }
        if (profile) {
          sections.push(`Timezone: ${profile.timezone || 'UTC'}`);
          sections.push(`AI Tone: ${profile.aiPreferences?.tone || 'concise'}`);
        }
        return {
          type: 'profile',
          success: !!user,
          data: result,
          summary: sections.length > 0
            ? `User Profile:\n${sections.map((s) => `- ${s}`).join('\n')}`
            : 'No profile data found.',
          error: null,
        };
      }

      default:
        return {
          type: toolName,
          success: !!result,
          data: result,
          summary: result ? JSON.stringify(result).substring(0, 500) : 'No data returned.',
          error: null,
        };
    }
  }
}
