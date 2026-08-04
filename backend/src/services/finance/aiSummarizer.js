import { aiService } from '../aiService.js';
import logger from '../../utils/logger.js';

export class AISummarizer {
  constructor() {
    this.aiService = aiService;
  }

  /**
   * Generates a concise financial update including "Why It Matters" and "Key Takeaway".
   * 
   * @param {Array<Object>} topArticles Top-ranked articles to synthesize
   * @param {string} [focusTopic] Optional specific user focus (e.g. "NVDA")
   * @returns {Promise<{ summaryText: string, structuredUpdates: Array<Object> }>}
   */
  async summarizeMarketNews(topArticles, focusTopic = null) {
    if (!topArticles || topArticles.length === 0) {
      return {
        summaryText: 'No recent significant market news found for the requested topic.',
        structuredUpdates: [],
      };
    }

    const articlesPayload = topArticles.map((a, idx) => ({
      index: idx + 1,
      title: a.title,
      source: a.source,
      summary: a.summary,
      symbols: a.symbols,
      company: a.company,
      publishedAt: a.publishedAt,
    }));

    const prompt = `
You are Atlas AI's Financial Intelligence Engine.
Analyze the following top financial news articles and synthesize a high-value market update.

${focusTopic ? `User Focus Topic: ${focusTopic}` : ''}

Articles to Analyze:
${JSON.stringify(articlesPayload, null, 2)}

Provide your analysis strictly in JSON format matching this schema:
{
  "marketOverview": "A concise 2-sentence summary of the overall market mood/trend based on these articles.",
  "stories": [
    {
      "headline": "Clean, punchy headline",
      "symbols": ["SYMBOL"],
      "summary": "4 to 6 concise sentences explaining what happened clearly.",
      "whyItMatters": "Clear explanation of how this affects investors, business, or markets.",
      "keyTakeaway": "One short actionable takeaway."
    }
  ]
}

Rules:
- Synthesize, do NOT copy verbatim.
- Total sentences per story summary must be strictly 4 to 6 sentences.
- Focus heavily on business impact, revenue, or market reaction.
- Return ONLY valid JSON.
`;

    try {
      const responseText = await this.aiService.generateResponse({
        systemInstruction: prompt,
        contents: [{ role: 'user', parts: [{ text: 'Generate the financial intelligence report.' }] }],
        config: {
          responseMimeType: 'application/json',
          temperature: 0.2,
        },
      });

      const cleanedJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanedJson);

      return {
        summaryText: parsed.marketOverview || 'Market Intelligence Update',
        structuredUpdates: parsed.stories || [],
      };
    } catch (err) {
      logger.error('Failed to generate AI financial summary:', { error: err.message });
      
      // Fallback response if AI generation fails
      return {
        summaryText: 'Market update compiled from recent news feeds.',
        structuredUpdates: topArticles.slice(0, 3).map((a) => ({
          headline: a.title,
          symbols: a.symbols,
          summary: a.summary || a.title,
          whyItMatters: 'Significant market movement or company update recorded.',
          keyTakeaway: 'Monitor related stocks for further price action.',
        })),
      };
    }
  }
}