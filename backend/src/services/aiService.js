const Anthropic = require('@anthropic-ai/sdk');
const { query } = require('../config/database');
const logger = require('../config/logger');

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

const MODEL = 'claude-sonnet-4-20250514';
const MAX_TOKENS = 2000;

/**
 * Call Claude API — standard completion
 */
async function callClaude({ systemPrompt, userMessage, userId, action, useWebSearch = false }) {
  try {
    const messageConfig = {
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }]
    };

    if (useWebSearch) {
      messageConfig.tools = [{ type: 'web_search_20250305', name: 'web_search' }];
    }

    const response = await anthropic.messages.create(messageConfig);

    // Extract text from response (handles tool_use blocks too)
    const text = response.content
      .filter(block => block.type === 'text')
      .map(block => block.text)
      .join('\n');

    const tokensUsed = response.usage?.input_tokens + response.usage?.output_tokens || 0;

    // Log usage in DB
    if (userId) {
      await logUsage(userId, action, tokensUsed);
    }

    return { success: true, result: text, tokensUsed };
  } catch (error) {
    logger.error('Claude API error:', { message: error.message, action });
    throw new Error(`AI generation failed: ${error.message}`);
  }
}

/**
 * Log AI usage to database
 */
async function logUsage(userId, action, tokensUsed) {
  try {
    await query(
      'INSERT INTO ai_usage_log (user_id, action, tokens_used) VALUES ($1, $2, $3)',
      [userId, action, tokensUsed]
    );

    // Deduct from free credits if on free plan
    await query(
      `UPDATE users 
       SET ai_credits = GREATEST(ai_credits - 1, 0)
       WHERE id = $1 AND plan = 'free'`,
      [userId]
    );
  } catch (err) {
    logger.warn('Failed to log AI usage:', err.message);
  }
}

/**
 * Get usage stats for a user
 */
async function getUserUsageStats(userId) {
  const result = await query(
    `SELECT 
       COUNT(*) as total_generations,
       SUM(tokens_used) as total_tokens,
       COUNT(CASE WHEN created_at > NOW() - INTERVAL '24 hours' THEN 1 END) as today_count,
       COUNT(CASE WHEN created_at > NOW() - INTERVAL '7 days' THEN 1 END) as week_count
     FROM ai_usage_log
     WHERE user_id = $1`,
    [userId]
  );
  return result.rows[0];
}

// ============================================================
// PROMPT TEMPLATES
// ============================================================

const PROMPTS = {
  detectCompetitors: ({ bizName, industry, location, size }) =>
    `You are an expert social media competitive intelligence analyst.

Business: "${bizName}"
Industry: "${industry}"
Market: "${location || 'India / Global'}"
Size: "${size || 'Not specified'}"

Identify TOP 10 DIRECT social media competitors and TOP 5 INDIRECT ones.

Format your response clearly with sections:
1. DIRECT COMPETITORS (numbered list with: name, platforms, why they compete, estimated follower range, content style)
2. INDIRECT COMPETITORS (same format)
3. ASPIRATION BRANDS TO STUDY (3 brands dominating social in this space)
4. YOUR WINNING DIFFERENTIATOR (3 specific angles to stand out)

Be specific to the ${location || 'Indian'} market where relevant. Use real brand names.`,

  analyzeCompetitor: ({ handle, platform, focus }) =>
    `Perform a detailed social media competitor analysis for: "${handle}" on ${platform}.
Focus: ${focus}

Provide:
📊 PROFILE OVERVIEW (followers estimate, posting frequency, engagement rate)
🎯 CONTENT STRATEGY (pillars, formats, hook styles, caption approach)
💪 STRENGTHS (what they do brilliantly)
⚠️ WEAKNESSES & GAPS (opportunities for YOU)
🗓️ POSTING PATTERN (best days/times they post)
⚡ TOP 5 ACTIONABLE TAKEAWAYS

Be specific and strategic.`,

  contentGaps: ({ input }) =>
    `Perform a Content Gap Analysis for: "${input}"

Identify:
1. 10 TOPIC GAPS (topics competitors haven't covered well, with content angle)
2. FORMAT GAPS (underused content formats)  
3. AUDIENCE GAPS (underserved segments)
4. PLATFORM GAPS (low competition platforms)
5. TOP 5 IMMEDIATE OPPORTUNITIES (ranked by impact, with specific content idea)

Be very specific and actionable.`,

  reelIdeas: ({ niche, goal, tone, count = 10 }) =>
    `Generate ${count} high-performing Instagram Reel ideas for:
Niche: "${niche}"
Goal: "${goal}"
Style: "${tone}"

For each idea include:
🎬 Title | 💡 Concept (2 sentences) | ⚡ Hook (exact first line) | 📐 Format | ⏱️ Length | 🎵 Audio style | 📝 Caption starter | 🏷️ 5 hashtags | 💪 Why it will perform

End with: Best posting time for this niche.`,

  postIdeas: ({ topic, platform, type, base }) =>
    `Generate 8 unique ${type} post ideas for ${platform}:
Topic: "${topic}"
Based on: ${base}

For each: Concept | Hook | Content outline | CTA | Expected metric (saves/shares/comments) | 10 hashtags

Include a 70-20-10 mix: Educational / Entertaining / Promotional.
End with 3 best posting times for ${platform}.`,

  hooks: ({ topic, style, platform }) =>
    `Generate 5 powerful ${style} hooks for:
Topic: "${topic}"
Platform: ${platform}

For each hook: The hook line | Why it works | Which audience it targets | Engagement type driven

Finish with: A/B test recommendation — which 2 to test first.`,

  fullContent: ({ type, topic, audience, context, tone, language }) =>
    `Create a complete "${type}" for:
Topic: "${topic}"
Audience: "${audience || 'general social media audience'}"
Tone: ${tone}
Language: ${language}
Context: "${context || 'None'}"

Deliver the FULL ready-to-use content with:
- Complete script/caption/calendar
- Visual/staging directions where relevant
- Hashtag sets
- Posting time recommendation
- Performance prediction

${language === 'Hinglish (Hindi + English)' ? 'Write in natural Hinglish — Hindi for emotion/explanation, English for technical terms.' : ''}`,

  trends: ({ niche, platform, trendType }) =>
    `Fetch and analyze the LATEST social media trends for ${niche ? `the "${niche}" niche` : 'all niches'} on ${platform} (current date: June 2026).
Focus: ${trendType}

Provide:
📈 TOP 10 TRENDING ${trendType.toUpperCase()} (name, why trending, engagement potential, how to use, difficulty)
🔥 HOT RIGHT NOW this week (5 must-use trends)
🔮 COMING TRENDS next 2-4 weeks
⚡ 5 IMMEDIATE CONTENT IDEAS based on these trends
📊 PLATFORM ALGORITHM FAVORITES right now

Be specific with real trend names.`,

  news: ({ platform, topic, newsType }) =>
    `Report the most important recent social media news for ${platform || 'all platforms'}${topic ? `, focused on "${topic}"` : ''}.
Type: ${newsType}

Format as 8 news items. Each item:
📌 HEADLINE | 📅 When | 📝 Summary (2-3 sentences) | 💡 Impact for creators/brands | ⚡ Action required

Cover: Algorithm updates, new features, creator economy news, advertising changes, platform policies.
Date: June 2026. Be accurate and current.`,

  engagement: ({ bizType, goal, engType }) => {
    if (engType === 'customer') {
      return `Generate 10 customer engagement strategies for "${bizType}" focused on "${goal}".
For each: Strategy name | Description | Psychology behind it | Implementation steps | Template/example | Time to implement`;
    }
    if (engType === 'employee') {
      return `Create a complete Employee Advocacy Social Media Program for "${bizType}".
Include: Monthly content themes | 10 post ideas for employees | Incentivization strategy | 5 caption templates | Brand guidelines`;
    }
    return `Create a UGC Campaign for "${bizType}".
Include: Campaign concept + hashtag | 5 UGC trigger tactics | Customer brief | Selection process | 5 request captions | KPIs to track`;
  },

  reply: ({ comment, commentType, tone }) =>
    `Generate 3 reply variations to this ${commentType} comment:
"${comment}"
Tone: ${tone}

For each: Ready-to-use reply | Why it works
Requirements: Concise, human, on-brand, include emoji where natural.
Bonus: One reply that generates even MORE engagement.`
};

module.exports = { callClaude, getUserUsageStats, PROMPTS };
