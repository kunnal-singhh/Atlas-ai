import logger from '../../utils/logger.js';

/**
 * MockAIProvider — Context-aware development AI that inspects the actual
 * systemInstruction and user message to produce realistic, deterministic
 * responses identical in shape to what Gemini would return.
 *
 * It does NOT call any external API. It reads the same context that the
 * real pipeline already assembles (memories, articles, user profile).
 *
 * Switch: AI_PROVIDER=mock  (dev) | AI_PROVIDER=gemini (production)
 */
export class MockAIProvider {
  /**
   * Same public interface as GeminiService.generateResponse()
   */
  async generateResponse({ systemInstruction, contents, config }) {
    // Simulate realistic network latency (80-200ms)
    await new Promise((r) => setTimeout(r, 80 + Math.random() * 120));

    const userMessage = this._lastUserText(contents);
    const sysLower = (systemInstruction || '').toLowerCase();
    const isJsonMode = config?.responseMimeType === 'application/json';

    logger.debug('[MockAI] Processing', { len: userMessage.length, json: isJsonMode });

    // ── Route 1: Memory Extraction ──
    if (sysLower.includes('extract') && (sysLower.includes('fact') || sysLower.includes('memory'))) {
      return this._extractFacts(userMessage);
    }

    // ── Route 2: Conversation Summarization ──
    if (sysLower.includes('summarize') && sysLower.includes('key points')) {
      return this._summarizeConversation(userMessage);
    }

    // ── Route 3: Finance Intelligence (JSON) ──
    if (isJsonMode || (sysLower.includes('financial intelligence') && sysLower.includes('articles to analyze'))) {
      return this._financeIntelligence(systemInstruction);
    }

    // ── Route 4: Standard Conversation ──
    return this._conversation(userMessage, systemInstruction);
  }

  // ───────────────────────────────────────────────────────────
  // Route 1 — Memory Extraction
  // Parses the actual user message and returns structured facts
  // ───────────────────────────────────────────────────────────
  _extractFacts(raw) {
    // The memoryExtractor wraps it as: User message: "actual text"
    const innerMatch = raw.match(/User message:\s*"(.+)"/is);
    const text = innerMatch ? innerMatch[1] : raw;
    const lower = text.toLowerCase();

    const facts = [];

    // ── Company / ticker mentions ──
    const companyMap = {
      nvidia: { ticker: 'NVDA', cat: 'FINANCE' },
      tesla: { ticker: 'TSLA', cat: 'FINANCE' },
      apple: { ticker: 'AAPL', cat: 'FINANCE' },
      microsoft: { ticker: 'MSFT', cat: 'FINANCE' },
      google: { ticker: 'GOOGL', cat: 'FINANCE' },
      amazon: { ticker: 'AMZN', cat: 'FINANCE' },
      meta: { ticker: 'META', cat: 'FINANCE' },
      netflix: { ticker: 'NFLX', cat: 'FINANCE' },
    };
    for (const [name, info] of Object.entries(companyMap)) {
      if (lower.includes(name)) {
        facts.push({
          fact: `User is interested in ${name.charAt(0).toUpperCase() + name.slice(1)} (${info.ticker})`,
          category: info.cat,
          importanceScore: 7,
          keywords: [name, info.ticker.toLowerCase(), 'stock', 'company'],
        });
      }
    }

    // ── Explicit ticker $SYMBOL ──
    const tickerMatches = text.match(/\$([A-Za-z]{1,5})/g);
    if (tickerMatches) {
      for (const t of tickerMatches) {
        const sym = t.replace('$', '').toUpperCase();
        if (!facts.some((f) => f.keywords.includes(sym.toLowerCase()))) {
          facts.push({
            fact: `User follows ticker ${sym}`,
            category: 'FINANCE',
            importanceScore: 7,
            keywords: [sym.toLowerCase(), 'ticker', 'stock'],
          });
        }
      }
    }

    // ── Profession / work ──
    const workPatterns = [
      { re: /i (?:work|am working) (?:at|for|in) (.+?)(?:\.|,|$)/i, cat: 'WORK' },
      { re: /i(?:'m| am) an? (.+?)(?:\.|,|$)/i, cat: 'WORK' },
      { re: /my job is (.+?)(?:\.|,|$)/i, cat: 'WORK' },
    ];
    for (const { re, cat } of workPatterns) {
      const m = text.match(re);
      if (m) {
        facts.push({
          fact: m[0].trim(),
          category: cat,
          importanceScore: 8,
          keywords: m[1].toLowerCase().split(/\s+/).filter((w) => w.length > 2),
        });
      }
    }

    // ── Explicit preferences ("I like / I love / I prefer / I enjoy") ──
    const prefPatterns = [
      /i (?:like|love|prefer|enjoy|follow|use|am interested in|am into) (.+?)(?:\.|,|!|$)/gi,
    ];
    for (const re of prefPatterns) {
      let m;
      while ((m = re.exec(text)) !== null) {
        const subject = m[1].trim();
        if (subject.length > 2 && subject.length < 80) {
          // Avoid duplicating company facts already captured
          const already = facts.some((f) => f.fact.toLowerCase().includes(subject.toLowerCase()));
          if (!already) {
            facts.push({
              fact: `User likes ${subject}`,
              category: 'INTEREST',
              importanceScore: 6,
              keywords: subject.toLowerCase().split(/\s+/).filter((w) => w.length > 2),
            });
          }
        }
      }
    }

    // ── Location ──
    const locMatch = text.match(/i(?:'m| am) (?:from|based in|living in|located in) (.+?)(?:\.|,|$)/i);
    if (locMatch) {
      facts.push({
        fact: `User is based in ${locMatch[1].trim()}`,
        category: 'GENERAL',
        importanceScore: 6,
        keywords: [locMatch[1].trim().toLowerCase(), 'location'],
      });
    }

    // If nothing meaningful was extracted, return empty
    if (facts.length === 0) {
      return JSON.stringify({ facts: [] });
    }

    return JSON.stringify({ facts });
  }

  // ───────────────────────────────────────────────────────────
  // Route 2 — Conversation Summarization
  // Reads the actual conversation turns passed in `contents`
  // ───────────────────────────────────────────────────────────
  _summarizeConversation(conversationText) {
    const lines = conversationText.split('\n').filter((l) => l.trim());
    const topics = new Set();

    for (const line of lines) {
      const lower = line.toLowerCase();
      if (lower.includes('market') || lower.includes('stock') || lower.includes('finance')) topics.add('financial markets');
      if (lower.includes('nvidia') || lower.includes('nvda')) topics.add('NVIDIA');
      if (lower.includes('tesla') || lower.includes('tsla')) topics.add('Tesla');
      if (lower.includes('apple') || lower.includes('aapl')) topics.add('Apple');
      if (lower.includes('work') || lower.includes('job') || lower.includes('career')) topics.add('career and work');
      if (lower.includes('ai') || lower.includes('artificial intelligence') || lower.includes('machine learning')) topics.add('artificial intelligence');
      if (lower.includes('help') || lower.includes('how')) topics.add('seeking assistance');
    }

    if (topics.size === 0) topics.add('general conversation');

    const topicList = [...topics];
    const bullets = [
      `• The conversation covered: ${topicList.join(', ')}.`,
      `• ${lines.length} messages were exchanged between user and assistant.`,
      `• The user showed interest in ${topicList[0]}.`,
      `• Tone remained conversational and informative throughout.`,
    ];

    return bullets.join('\n');
  }

  // ───────────────────────────────────────────────────────────
  // Route 3 — Finance Intelligence
  // Reads the actual articles from the systemInstruction and
  // synthesizes a realistic JSON summary from them
  // ───────────────────────────────────────────────────────────
  _financeIntelligence(systemInstruction) {
    // Extract focus topic if provided
    const topicMatch = systemInstruction.match(/User Focus Topic:\s*(\S+)/i);
    const focusTopic = topicMatch ? topicMatch[1] : null;

    // Try to parse the articles payload embedded in the system instruction
    let articles = [];
    try {
      const jsonBlockMatch = systemInstruction.match(/Articles to Analyze:\s*(\[[\s\S]*?\])\s*Provide/);
      if (jsonBlockMatch) {
        articles = JSON.parse(jsonBlockMatch[1]);
      }
    } catch {
      // Fallback — no parseable articles
    }

    // Build stories from actual article data
    const stories = [];
    for (const article of articles.slice(0, 3)) {
      const symbols = article.symbols || (focusTopic ? [focusTopic] : ['SPY']);
      const symbolsArr = Array.isArray(symbols) ? symbols : [symbols];

      stories.push({
        headline: article.title || 'Market Development Reported',
        symbols: symbolsArr,
        summary: this._buildArticleSummary(article),
        whyItMatters: `This development could impact ${symbolsArr.join(', ')} valuations and related sector performance. Investors should monitor follow-up reports and earnings guidance for confirmation of the trend.`,
        keyTakeaway: `Watch ${symbolsArr.join('/')} for price action following this development.`,
      });
    }

    // If no articles were parsed, generate a sensible general summary
    if (stories.length === 0) {
      const sym = focusTopic || 'SPY';
      stories.push({
        headline: focusTopic ? `${focusTopic} Market Update` : 'Broad Market Overview',
        symbols: [sym],
        summary: `Markets are trading within recent ranges as investors digest macro data and corporate earnings. ${focusTopic ? `${focusTopic} continues to attract attention from institutional and retail participants alike.` : 'The S&P 500 is holding near key technical levels.'} Volume is moderate with no significant catalysts in the immediate session. Sector rotation favors technology and healthcare names.`,
        whyItMatters: `Current price action suggests a consolidation phase that often precedes a directional move. Positioning and hedging decisions should account for upcoming data releases.`,
        keyTakeaway: `Maintain exposure but set defined risk levels around ${sym}.`,
      });
    }

    const overview = focusTopic
      ? `${focusTopic} is in focus today amid sector-wide developments. Market participants are weighing near-term catalysts against broader macro conditions.`
      : 'Markets are navigating a mixed environment with technology leading gains while defensive sectors show modest rotation. Earnings season progress and macro data continue to drive sentiment.';

    return JSON.stringify({ marketOverview: overview, stories });
  }

  _buildArticleSummary(article) {
    const title = article.title || 'A significant market event';
    const source = article.source || 'financial media';
    const company = article.company || '';
    const summary = article.summary || '';

    if (summary && summary.length > 20) {
      // Rephrase the existing summary into a 4-6 sentence block
      return `${summary} This was first reported by ${source}. ${company ? `${company} is at the center of this development.` : 'Multiple market participants are affected.'} Analysts are closely monitoring the situation for further updates. The news has generated notable interest among institutional investors.`;
    }

    return `${title}, according to ${source}. ${company ? `${company} shares reacted to the news during the session.` : 'The broader market showed a measured response.'} Analysts expect further clarity as additional data becomes available. Trading volume around the event was within normal ranges. Market participants will watch for follow-through in the coming sessions.`;
  }

  // ───────────────────────────────────────────────────────────
  // Route 4 — Standard Conversation
  // Inspects user message + memories from systemInstruction
  // ───────────────────────────────────────────────────────────
  _conversation(userMessage, systemInstruction) {
    const lower = userMessage.toLowerCase().trim();
    const memories = this._parseMemories(systemInstruction);

    // ── Identity ──
    if (lower.includes('who are you') || lower.includes('what are you') || lower === 'introduce yourself') {
      return `I'm **Atlas AI** — your personal intelligence companion on Telegram.\n\nI'm designed to help you with:\n• 📊 **Financial Intelligence** — Real-time market analysis and company-specific briefings\n• 🧠 **Persistent Memory** — I remember your interests, preferences, and professional context across conversations\n• 💬 **Thoughtful Conversation** — From technical deep-dives to strategic brainstorming\n\nThink of me as an always-available executive assistant that gets sharper the more we interact. What can I help you with?`;
    }

    // ── Greeting ──
    if (/^(hey|hi|hello|good morning|good evening|yo|sup)\b/i.test(lower)) {
      const nameMatch = systemInstruction?.match(/User Profession:\s*(.+)/);
      const profession = nameMatch && !nameMatch[1].includes('Not specified') ? nameMatch[1].trim() : null;
      const greeting = profession
        ? `Hey! 👋 Good to see you. How's the ${profession.toLowerCase()} world treating you today?`
        : `Hey there! 👋 Great to hear from you. What's on your mind today?`;

      if (memories.length > 0) {
        return `${greeting}\n\nBy the way, I remember you're interested in ${memories.slice(0, 2).map((m) => m.fact).join(' and ')}. Want me to pull up anything related?`;
      }
      return greeting;
    }

    // ── Memory recall: "what do you remember / know about me" ──
    if (lower.includes('remember') && (lower.includes('about me') || lower.includes('know about me') || lower.includes('do you remember'))) {
      return this._memoryRecallResponse(memories);
    }

    if (lower.includes('what companies') || lower.includes('what stocks') || lower.includes('do i follow')) {
      return this._companiesRecallResponse(memories);
    }

    // ── Explicit "remember this" ──
    if (/remember that/i.test(lower) || /keep in mind/i.test(lower) || /note that/i.test(lower)) {
      const subject = lower.replace(/^.*(remember that|keep in mind that|note that)\s*/i, '').replace(/[.!]+$/, '').trim();
      return `Understood. ✅\nI'll remember that ${subject}.\n\nThis is now stored in my long-term memory and I'll use it to personalize future responses for you.`;
    }

    // ── Thank you ──
    if (/\b(thanks|thank you|thx|ty)\b/i.test(lower)) {
      return `You're welcome! 🙌 Happy to help. Let me know anytime you need something — I'm always here.`;
    }

    // ── How are you ──
    if (lower.includes('how are you') || lower === "what's up" || lower === 'wassup') {
      return `Running smoothly and ready to assist! 😊 What can I dive into for you?`;
    }

    // ── Explanation / Knowledge queries ──
    if (/^(explain|what is|what are|how does|how do|tell me about|describe|define)\b/i.test(lower)) {
      return this._explanationResponse(userMessage);
    }

    // ── Market / stock queries routed through conversation (non-finance-intent) ──
    if (lower.includes('market') || lower.includes('stock') || lower.includes('invest')) {
      const relevantMemories = memories.filter((m) => ['FINANCE', 'INTEREST'].includes(m.category));
      let extra = '';
      if (relevantMemories.length > 0) {
        extra = `\n\nBased on your interests (${relevantMemories.map((m) => m.fact).join('; ')}), I'd suggest keeping an eye on those names for catalysts.`;
      }
      return `Great question! Here's my take:\n\n📈 **Market Snapshot**: Major indices are trading mixed today. Technology continues to lead with strong momentum, while energy and utilities show rotation. Earnings season is driving stock-specific moves.\n\n**Key Themes**:\n• AI and cloud infrastructure spending remain robust\n• Interest rate expectations are stabilizing\n• Consumer discretionary showing resilience${extra}\n\nWant me to pull up a detailed briefing on a specific company or sector?`;
    }

    // ── Help ──
    if (lower.includes('help') || lower.includes('what can you do')) {
      return `Here's what I can do for you:\n\n📊 **Market Intelligence** — Ask about any company, ticker, or market trend\n🧠 **Memory** — I remember your preferences and personalize every response\n💬 **Conversation** — Technical questions, brainstorming, explanations\n📋 **Daily Briefing** — Summarized financial news tailored to your interests\n\nJust type naturally — I'll figure out the best way to help. Try something like:\n• *"Tesla updates"*\n• *"Explain blockchain"*\n• *"What do you remember about me?"*`;
    }

    // ── Default: Thoughtful contextual response ──
    return this._defaultResponse(userMessage, memories);
  }

  // ─── Helpers ─────────────────────────────────────────────

  _lastUserText(contents) {
    if (!contents || contents.length === 0) return '';
    const last = contents[contents.length - 1];
    return last?.parts?.[0]?.text || '';
  }

  /**
   * Parses memories injected into systemInstruction by ContextBuilder.
   * Format: - [CATEGORY] fact text
   */
  _parseMemories(systemInstruction) {
    if (!systemInstruction) return [];
    const memoryBlock = systemInstruction.match(/RELEVANT LONG-TERM MEMORIES ABOUT USER:\n([\s\S]*?)\n\(Use these/);
    if (!memoryBlock) return [];

    return memoryBlock[1]
      .split('\n')
      .map((line) => {
        const m = line.match(/^-\s*\[(\w+)\]\s*(.+)/);
        if (m) return { category: m[1], fact: m[2].trim() };
        return null;
      })
      .filter(Boolean);
  }

  _memoryRecallResponse(memories) {
    if (memories.length === 0) {
      return `I don't have any stored memories about you yet. As we chat, I'll naturally pick up on your preferences, interests, and professional context.\n\nTry telling me something like:\n• *"I work at Google"*\n• *"I'm interested in NVIDIA"*\n• *"Remember that I prefer concise answers"*`;
    }

    const grouped = {};
    for (const m of memories) {
      if (!grouped[m.category]) grouped[m.category] = [];
      grouped[m.category].push(m.fact);
    }

    const categoryEmojis = { FINANCE: '📊', INTEREST: '🎯', WORK: '💼', PREFERENCE: '⚙️', GENERAL: '📝' };
    let response = `Here's what I remember about you:\n`;

    for (const [cat, items] of Object.entries(grouped)) {
      const emoji = categoryEmojis[cat] || '📌';
      response += `\n${emoji} **${cat}**\n`;
      for (const item of items) {
        response += `• ${item}\n`;
      }
    }

    response += `\nI use these to personalize every response. You can tell me new things anytime!`;
    return response;
  }

  _companiesRecallResponse(memories) {
    const financeMemories = memories.filter((m) => m.category === 'FINANCE' || m.category === 'INTEREST');
    if (financeMemories.length === 0) {
      return `I don't have any companies or stocks saved for you yet.\n\nYou can tell me things like:\n• *"I like NVIDIA"*\n• *"I follow Tesla and Apple"*\n• *"Remember that I'm interested in $AMZN"*\n\nAnd I'll remember them for future briefings!`;
    }

    let response = `Based on what I remember, you currently follow:\n`;
    for (const m of financeMemories) {
      response += `\n• ${m.fact}`;
    }
    response += `\n\nWant me to pull up the latest news on any of these?`;
    return response;
  }

  _explanationResponse(userMessage) {
    // Extract the topic after the trigger word
    const topicMatch = userMessage.match(/^(?:explain|what (?:is|are)|how (?:does|do)|tell me about|describe|define)\s+(.+?)(?:\?|!|\.)?$/i);
    const topic = topicMatch ? topicMatch[1].trim() : 'this topic';
    const topicTitle = topic.charAt(0).toUpperCase() + topic.slice(1);

    // Build a structured explanation
    return `## ${topicTitle}\n\n${topicTitle} refers to a broad and evolving domain. Here's a structured overview:\n\n**Definition**: ${topicTitle} encompasses the principles, systems, and methodologies related to its core function. It has seen significant growth and transformation in recent years.\n\n**Key Aspects**:\n• **Foundation** — Built on established theoretical and practical frameworks\n• **Applications** — Used across industries including technology, finance, healthcare, and education\n• **Current Trends** — Rapid advancement driven by research, investment, and real-world adoption\n\n**Why It Matters**: Understanding ${topic} is increasingly valuable as it shapes decision-making, productivity, and innovation across sectors.\n\nWant me to go deeper into any specific aspect of ${topic}? 📚`;
  }

  _defaultResponse(userMessage, memories) {
    let contextNote = '';
    if (memories.length > 0) {
      const relevantFacts = memories.slice(0, 2).map((m) => m.fact).join(' and ');
      contextNote = `\n\nBy the way, given your interest in ${relevantFacts}, I can tailor my response if you'd like a more specific angle on this.`;
    }

    return `That's a great point. Let me share my thoughts:\n\nBased on what you've mentioned, there are several dimensions worth considering here. The key is to weigh both the immediate implications and the longer-term trajectory.\n\n**My Take**:\n• Consider the broader context and how it connects to your goals\n• Look for patterns and signals rather than reacting to individual data points\n• A structured approach will yield better outcomes than ad-hoc decisions${contextNote}\n\nWould you like to explore any of these angles further? I'm happy to dig deeper. 🎯`;
  }
}
