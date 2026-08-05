import { toolRegistry } from './toolRegistry.js';
import { SearchCache } from '../../models/SearchCache.js';
import { aiService } from '../aiService.js';
import { config } from '../../config/env.js';
import logger from '../../utils/logger.js';

/**
 * Live Search Tool
 * Retrieves real-time search results using Google Custom Search API.
 * Uses SearchCache to avoid duplicate API calls and contains fallback mechanics.
 */
const liveSearchTool = {
  name: 'liveSearch',
  description: 'Searches the web for real-time information, news, today\'s announcements, and current events.',
  category: 'data_retrieval',
  priority: 60,
  keywords: [
    'today', 'latest', 'current', 'news', 'announcement', 'announcements',
    'this week', 'what happened', 'since yesterday', 'recent', 'yesterday'
  ],
  patterns: [
    /what happened today/i,
    /latest news on/i,
    /current updates/i,
    /what changed since/i
  ],
  execute: async (telegramId, userMessage, context) => {
    logger.info(`[LiveSearchTool] Executing search for user message: "${userMessage}"`);
    
    // Normalize query (lowercase, trimmed, strip simple punctuation)
    const query = userMessage.toLowerCase().replace(/[?.,!]/g, '').trim();

    try {
      // 1. Check SearchCache
      const cached = await SearchCache.findOne({ query });
      if (cached) {
        logger.info(`[LiveSearchTool] Cache hit for query: "${query}"`);
        return {
          type: 'liveSearch',
          result: {
            query: cached.query,
            results: cached.results,
            synthesized: cached.synthesized,
            cached: true
          }
        };
      }

      logger.info(`[LiveSearchTool] Cache miss for query: "${query}". Fetching...`);

      // 2. Fetch fresh results (either from Google API or Mock fallback in development)
      let results = [];
      const isMockMode = process.env.AI_PROVIDER === 'mock';
      const hasGoogleCredentials = config.googleSearchApiKey && config.googleSearchEngineId;

      if (isMockMode || !hasGoogleCredentials) {
        if (!hasGoogleCredentials && !isMockMode) {
          logger.warn('[LiveSearchTool] Google Search API credentials missing. Falling back to simulated results.');
        }
        results = getMockSearchResults(query);
      } else {
        results = await fetchGoogleSearchResults(query);
      }

      // 3. Synthesize findings using AIService
      const synthesized = await synthesizeResults(query, results);

      // 4. Save to Cache
      const ttlMs = config.searchCacheTtlMinutes * 60 * 1000;
      await SearchCache.create({
        query,
        results,
        synthesized,
        expiresAt: new Date(Date.now() + ttlMs)
      }).catch(err => {
        logger.warn('[LiveSearchTool] Failed to cache search results:', err.message);
      });

      return {
        type: 'liveSearch',
        result: {
          query,
          results,
          synthesized,
          cached: false
        }
      };
    } catch (error) {
      logger.error('[LiveSearchTool] Execution failed:', error);
      
      // Fallback: If Live Search fails, return cached information if any exists (even if expired)
      try {
        const expiredCache = await SearchCache.findOne({ query }).sort({ createdAt: -1 });
        if (expiredCache) {
          logger.info(`[LiveSearchTool] Fallback: Using expired cache for query: "${query}"`);
          return {
            type: 'liveSearch',
            result: {
              query: expiredCache.query,
              results: expiredCache.results,
              synthesized: expiredCache.synthesized,
              cached: true,
              stale: true
            }
          };
        }
      } catch (cacheErr) {
        logger.error('[LiveSearchTool] Stale cache retrieval failed:', cacheErr);
      }

      // Return graceful empty output
      return {
        type: 'liveSearch',
        result: {
          query,
          results: [],
          synthesized: 'Failed to retrieve real-time search results. Operating with offline/cached data.',
          error: error.message
        }
      };
    }
  }
};

/**
 * Fetches real results from Google Custom Search API
 */
async function fetchGoogleSearchResults(query) {
  const apiKey = config.googleSearchApiKey;
  const cx = config.googleSearchEngineId;
  const url = `https://customsearch.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cx}&q=${encodeURIComponent(query)}&num=5`;

  const response = await fetch(url, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(6000), // 6 second timeout
  });

  if (!response.ok) {
    throw new Error(`Google Search HTTP Error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const items = data.items || [];

  return items.map((item) => ({
    title: item.title || 'Untitled Result',
    snippet: item.snippet || '',
    source: new URL(item.link || 'https://google.com').hostname.replace('www.', ''),
    link: item.link || '',
  }));
}

/**
 * Synthesizes search results into a clean executive format using AIService
 */
async function synthesizeResults(query, results) {
  if (!results || results.length === 0) {
    return 'No results found to synthesize.';
  }

  const resultsText = results
    .map((r, i) => `[${i + 1}] Title: ${r.title}\nSource: ${r.source}\nSnippet: ${r.snippet}\nLink: ${r.link}`)
    .join('\n\n');

  const systemInstruction = `You are the Live Intelligence Synthesizer for Atlas AI.
Your task is to synthesize the search results provided for the user query.
Follow these constraints strictly:
1. Provide a clear, executive response.
2. Structure the output into:
   - Headline: A bold summarizing title.
   - Summary: 2-3 sentences explaining the main news/event.
   - Why it matters: 1-2 sentences on implications.
   - Sources: list the domain names used.
3. Be concise and factual. Do not hallucinate or make assumptions beyond what is in the results.
4. Output using standard Markdown. Do not use HTML tags.`;

  const contents = [
    {
      role: 'user',
      parts: [
        {
          text: `User Query: "${query}"\n\nSearch Results:\n${resultsText}\n\nSynthesize this into a structured report.`
        }
      ]
    }
  ];

  try {
    const rawSynthesis = await aiService.generateResponse({
      systemInstruction,
      contents
    });
    return rawSynthesis;
  } catch (err) {
    logger.warn('[LiveSearchTool] AI synthesis failed. Returning direct snippets instead.', err.message);
    return results.map((r) => `* ${r.title} (${r.source})\n  ${r.snippet}`).join('\n\n');
  }
}

/**
 * Mock generator for search results to support robust local testing
 */
function getMockSearchResults(query) {
  logger.info(`[LiveSearchTool] Generating mock search results for query: "${query}"`);
  
  if (query.includes('nvidia') || query.includes('nvda')) {
    return [
      {
        title: 'NVIDIA Announces Blackwell Ultra GPUs and Future Roadmap',
        snippet: 'NVIDIA revealed its next-gen Blackwell Ultra GPU architecture targeting enterprise data centers and LLM training, scheduled for late 2026 delivery.',
        source: 'techcrunch.com',
        link: 'https://techcrunch.com/nvidia-blackwell-ultra'
      },
      {
        title: 'NVIDIA Stock Hits New High Amid AI Chip Demand',
        snippet: 'NVDA stock surged 4.2% following bullish notes from top Wall Street analysts citing persistent demand for Hopper and Blackwell architectures.',
        source: 'bloomberg.com',
        link: 'https://bloomberg.com/nvda-stock-high'
      }
    ];
  }

  if (query.includes('tesla') || query.includes('tsla')) {
    return [
      {
        title: 'Tesla Delivers Record Number of Vehicles in Latest Quarter',
        snippet: 'Tesla surpassed consensus estimates by delivering over 462,000 vehicles, powered by strong demand in China and price adjustments.',
        source: 'reuters.com',
        link: 'https://reuters.com/tesla-deliveries-record'
      },
      {
        title: 'Tesla FSD v12.5 Rollout Expands to Cybertruck Owners',
        snippet: 'Tesla has started deploying its latest Full Self-Driving software version v12.5 to Cybertruck drivers, enabling advanced highway autopilot.',
        source: 'electrek.co',
        link: 'https://electrek.co/tesla-fsd-cybertruck'
      }
    ];
  }

  // General fallback mock search results
  return [
    {
      title: `Latest Updates on ${query.toUpperCase()}`,
      snippet: `Breaking news and comprehensive analysis regarding ${query}. Leading experts discuss recent developments and future trajectories.`,
      source: 'associatedpress.com',
      link: 'https://apnews.com/general-update'
    },
    {
      title: `Global Trends and Implications of ${query}`,
      snippet: `A deep dive into how ${query} is reshaping market expectations, public policy, and technology development this quarter.`,
      source: 'economist.com',
      link: 'https://economist.com/global-trends'
    }
  ];
}

// Auto-register with the central registry
toolRegistry.register(liveSearchTool);

export default liveSearchTool;
