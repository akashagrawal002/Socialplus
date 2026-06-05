// ============================================================
// SocialPulse AI — Multi-AI Service
// Supports: Claude (Anthropic) | ChatGPT (OpenAI) | Gemini (Google)
// ============================================================
const Anthropic = require('@anthropic-ai/sdk');
const OpenAI    = require('openai');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { query } = require('../config/database');
const logger    = require('../config/logger');

// ---- Clients ----
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const openai    = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const genai     = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ---- Model IDs ----
const MODELS = {
  claude:  'claude-sonnet-4-20250514',
  chatgpt: 'gpt-4o',
  gemini:  'gemini-1.5-pro',
};

const MAX_TOKENS = 2000;

// ============================================================
// MAIN ROUTER — picks AI based on `provider` param
// ============================================================
async function callAI({ provider = 'claude', systemPrompt, userMessage, userId, action, useWebSearch = false }) {
  let result, tokensUsed;

  switch (provider) {
    case 'chatgpt':
      ({ result, tokensUsed } = await callChatGPT({ systemPrompt, userMessage }));
      break;
    case 'gemini':
      ({ result, tokensUsed } = await callGemini({ systemPrompt, userMessage }));
      break;
    case 'claude':
    default:
      ({ result, tokensUsed } = await callClaude({ systemPrompt, userMessage, useWebSearch }));
  }

  if (userId) await logUsage(userId, action, tokensUsed, provider);
  return { success: true, result, tokensUsed, provider };
}

// ============================================================
// CLAUDE (Anthropic)
// ============================================================
async function callClaude({ systemPrompt, userMessage, useWebSearch = false }) {
  try {
    const cfg = {
      model:      MODELS.claude,
      max_tokens: MAX_TOKENS,
      system:     systemPrompt,
      messages:   [{ role: 'user', content: userMessage }],
    };
    if (useWebSearch) cfg.tools = [{ type: 'web_search_20250305', name: 'web_search' }];

    const response = await anthropic.messages.create(cfg);
    const text = response.content
      .filter(b => b.type === 'text')
      .map(b => b.text)
      .join('\n');
    const tokensUsed = (response.usage?.input_tokens || 0) + (response.usage?.output_tokens || 0);
    return { result: text, tokensUsed };
  } catch (err) {
    logger.error('Claude error:', err.message);
    throw new Error(`Claude failed: ${err.message}`);
  }
}

// ============================================================
// CHATGPT (OpenAI)
// ============================================================
async function callChatGPT({ systemPrompt, userMessage }) {
  try {
    const response = await openai.chat.completions.create({
      model:      MODELS.chatgpt,
      max_tokens: MAX_TOKENS,
      messages: [
        { role: 'system',  content: systemPrompt },
        { role: 'user',    content: userMessage  },
      ],
    });
    const text      = response.choices[0]?.message?.content || '';
    const tokensUsed = (response.usage?.total_tokens || 0);
    return { result: text, tokensUsed };
  } catch (err) {
    logger.error('ChatGPT error:', err.message);
    throw new Error(`ChatGPT failed: ${err.message}`);
  }
}

// ============================================================
// GEMINI (Google)
// ============================================================
async function callGemini({ systemPrompt, userMessage }) {
  try {
    const model = genai.getGenerativeModel({
      model: MODELS.gemini,
      systemInstruction: systemPrompt,
    });
    const chat   = model.startChat({ history: [] });
    const result = await chat.sendMessage(userMessage);
    const text   = result.response.text();
    // Gemini doesn't always return token counts in free tier
    const tokensUsed = result.response?.usageMetadata?.totalTokenCount || 0;
    return { result: text, tokensUsed };
  } catch (err) {
    logger.error('Gemini error:', err.message);
    throw new Error(`Gemini failed: ${err.message}`);
  }
}

// ============================================================
// COMPARE — call all 3 AIs in parallel and return combined
// ============================================================
async function callAllAIs({ systemPrompt, userMessage, userId, action }) {
  const [claude, gpt, gemini] = await Promise.allSettled([
    callClaude({ systemPrompt, userMessage }),
    callChatGPT({ systemPrompt, userMessage }),
    callGemini({ systemPrompt, userMessage }),
  ]);

  const results = {
    claude:  claude.status  === 'fulfilled' ? claude.value.result  : `Claude Error: ${claude.reason?.message}`,
    chatgpt: gpt.status     === 'fulfilled' ? gpt.value.result     : `ChatGPT Error: ${gpt.reason?.message}`,
    gemini:  gemini.status  === 'fulfilled' ? gemini.value.result  : `Gemini Error: ${gemini.reason?.message}`,
  };

  const totalTokens =
    (claude.value?.tokensUsed  || 0) +
    (gpt.value?.tokensUsed     || 0) +
    (gemini.value?.tokensUsed  || 0);

  if (userId) await logUsage(userId, action, totalTokens, 'all');

  return { success: true, results, tokensUsed: totalTokens };
}

// ============================================================
// USAGE LOGGING
// ============================================================
async function logUsage(userId, action, tokensUsed, provider = 'claude') {
  try {
    await query(
      'INSERT INTO ai_usage_log (user_id, action, tokens_used) VALUES ($1, $2, $3)',
      [userId, `${action}_${provider}`, tokensUsed]
    );
    await query(
      `UPDATE users SET ai_credits = GREATEST(ai_credits - 1, 0)
       WHERE id = $1 AND plan = 'free'`,
      [userId]
    );
  } catch (err) {
    logger.warn('Failed to log AI usage:', err.message);
  }
}

async function getUserUsageStats(userId) {
  const result = await query(
    `SELECT
       COUNT(*) as total_generations,
       SUM(tokens_used) as total_tokens,
       COUNT(CASE WHEN created_at > NOW() - INTERVAL '24 hours' THEN 1 END) as today_count,
       COUNT(CASE WHEN created_at > NOW() - INTERVAL '7 days'  THEN 1 END) as week_count
     FROM ai_usage_log WHERE user_id = $1`,
    [userId]
  );
  return result.rows[0];
}

// ============================================================
// PROMPT TEMPLATES (shared across all 3 AIs)
// ============================================================
const PROMPTS = {
  detectCompetitors: ({ bizName, industry, location, size }) =>
    `You are an expert social media competitive intelligence analyst.
Business: "${bizName}" | Industry: "${industry}" | Market: "${location || 'India / Global'}" | Size: "${size || 'Not specified'}"
Identify TOP 10 DIRECT and TOP 5 INDIRECT social media competitors.
Format: 1. DIRECT COMPETITORS (name, platforms, why they compete, follower range, content style)
2. INDIRECT COMPETITORS (same) 3. ASPIRATION BRANDS TO STUDY (3 brands) 4. YOUR WINNING DIFFERENTIATOR (3 angles)
Be specific to ${location || 'Indian'} market. Use real brand names.`,

  analyzeCompetitor: ({ handle, platform, focus }) =>
    `Perform a detailed social media competitor analysis for: "${handle}" on ${platform}. Focus: ${focus}
Provide: 📊 PROFILE OVERVIEW | 🎯 CONTENT STRATEGY | 💪 STRENGTHS | ⚠️ WEAKNESSES & GAPS | 🗓️ POSTING PATTERN | ⚡ TOP 5 ACTIONABLE TAKEAWAYS
Be specific and strategic.`,

  contentGaps: ({ input }) =>
    `Perform a Content Gap Analysis for: "${input}"
Identify: 1. 10 TOPIC GAPS | 2. FORMAT GAPS | 3. AUDIENCE GAPS | 4. PLATFORM GAPS | 5. TOP 5 IMMEDIATE OPPORTUNITIES
Be very specific and actionable.`,

  reelIdeas: ({ niche, goal, tone, count = 10 }) =>
    `Generate ${count} high-performing Instagram Reel ideas for Niche: "${niche}", Goal: "${goal}", Style: "${tone}"
For each: 🎬 Title | 💡 Concept | ⚡ Hook (exact first line) | 📐 Format | ⏱️ Length | 🎵 Audio | 📝 Caption starter | 🏷️ 5 hashtags | 💪 Why it performs
End with: Best posting time.`,

  postIdeas: ({ topic, platform, type, base }) =>
    `Generate 8 unique ${type} post ideas for ${platform}. Topic: "${topic}". Based on: ${base}
For each: Concept | Hook | Outline | CTA | Expected metric | 10 hashtags. Include 70-20-10 mix. End with 3 best posting times.`,

  hooks: ({ topic, style, platform }) =>
    `Generate 5 powerful ${style} hooks for Topic: "${topic}", Platform: ${platform}
For each: Hook line | Why it works | Target audience | Engagement type. Finish with A/B test recommendation.`,

  fullContent: ({ type, topic, audience, context, tone, language }) =>
    `Create a complete "${type}" for:
Topic: "${topic}" | Audience: "${audience || 'general social media audience'}" | Tone: ${tone} | Language: ${language}
Context: "${context || 'None'}"
Deliver FULL ready-to-use content: complete script/caption/calendar, visual directions, hashtags, posting time, performance prediction.
${language === 'Hinglish (Hindi + English)' ? 'Write in natural Hinglish — Hindi for emotion, English for technical terms.' : ''}`,

  trends: ({ niche, platform, trendType }) =>
    `Fetch and analyze LATEST social media trends for ${niche ? `"${niche}" niche` : 'all niches'} on ${platform} (June 2026). Focus: ${trendType}
Provide: 📈 TOP 10 TRENDING | 🔥 HOT RIGHT NOW (5 trends) | 🔮 COMING TRENDS (2-4 weeks) | ⚡ 5 CONTENT IDEAS | 📊 ALGORITHM FAVORITES`,

  news: ({ platform, topic, newsType }) =>
    `Report most important recent social media news for ${platform || 'all platforms'}${topic ? `, focused on "${topic}"` : ''}. Type: ${newsType}
Format as 8 news items. Each: 📌 HEADLINE | 📅 When | 📝 Summary | 💡 Impact for creators | ⚡ Action required. Date: June 2026.`,

  engagement: ({ bizType, goal, engType }) => {
    if (engType === 'customer')
      return `Generate 10 customer engagement strategies for "${bizType}" focused on "${goal}".
Each: Strategy name | Description | Psychology | Steps | Template | Time to implement`;
    if (engType === 'employee')
      return `Create an Employee Advocacy Social Media Program for "${bizType}".
Include: Monthly themes | 10 post ideas | Incentives | 5 caption templates | Brand guidelines`;
    return `Create a UGC Campaign for "${bizType}".
Include: Campaign concept + hashtag | 5 trigger tactics | Customer brief | Selection process | 5 request captions | KPIs`;
  },

  reply: ({ comment, commentType, tone }) =>
    `Generate 3 reply variations to this ${commentType} comment: "${comment}". Tone: ${tone}
For each: Ready-to-use reply | Why it works. Bonus: One reply that generates MORE engagement.`,
};

module.exports = { callAI, callAllAIs, getUserUsageStats, PROMPTS, MODELS };
