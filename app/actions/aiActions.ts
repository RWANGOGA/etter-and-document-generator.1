// app/actions/aiActions.ts
'use server';

import { Groq } from 'groq-sdk';

// ==================== CLEANING HELPER ====================
function extractCleanContent(rawContent: string | null | undefined): string {
  if (!rawContent) return '';

  let cleaned = rawContent.trim();

  // Remove <think>...</think> blocks - more robust patterns
  cleaned = cleaned.replace(/<think>[\s\S]*?<\/think>/gi, '');
  cleaned = cleaned.replace(/<thinking>[\s\S]*?<\/thinking>/gi, '');

  // Alternative patterns (some models use different tags)
  cleaned = cleaned.replace(/<think>[\s\S]*?<\/?think>/gi, '');
  
  // Remove everything before the first </think> if it starts with thinking
  cleaned = cleaned.replace(/^[\s\S]*?<\/think>/i, '');

  // Final cleanup - take content after last think block
  if (cleaned.includes('</think>') || cleaned.includes('<think>')) {
    const parts = cleaned.split(/<\/?think>/i);
    cleaned = parts[parts.length - 1]?.trim() || cleaned;
  }

  cleaned = cleaned.trim();

  // SAFETY NET: some reasoning models narrate their chain-of-thought as plain
  // prose with no <think> tags at all (e.g. "Thinking Process:\n1. **Deconstruct
  // the User's Notes:**..."). The tag-stripping above can't catch that since
  // there's no tag to match. Detect that pattern and recover just the actual
  // final answer instead of returning the whole reasoning trace.
  const looksLikeLeakedReasoning =
    /^\s*thinking process\s*:/i.test(cleaned) ||
    /\*\*\s*(deconstruct|determine structure|drafting)\b/i.test(cleaned);

  if (looksLikeLeakedReasoning) {
    // Look for a "**Final ...:**" style header (Final Polish, Final Output,
    // Final Answer, Final Draft, etc.) - the model's own label for its
    // last step - and take everything after the LAST such header, since
    // that's the actual answer it settled on.
    const finalHeaderRegex = /\*\*\s*final[^*]*\*\*\s*:?\s*/gi;
    let match: RegExpExecArray | null;
    let lastMatchEnd = -1;
    while ((match = finalHeaderRegex.exec(cleaned)) !== null) {
      lastMatchEnd = match.index + match[0].length;
    }

    if (lastMatchEnd !== -1) {
      let recovered = cleaned.slice(lastMatchEnd).trim();

      // Strip markdown list bullets at the start of each line (e.g. "*   ")
      recovered = recovered
        .split('\n')
        .map((line) => line.replace(/^\s*[*\-]\s+/, ''))
        .join('\n')
        .trim();

      // Strip a leading/trailing wrapping quote if the model quoted its
      // own final answer (straight or curly quotes)
      recovered = recovered.replace(/^["'"]\s*/, '').replace(/\s*["'"]$/, '');

      if (recovered.trim()) {
        cleaned = recovered.trim();
      }
    }
    // If no "Final ...:" header was found, fall through and return `cleaned`
    // as-is below rather than guessing further - better to show the raw
    // reasoning (visibly wrong, easy to notice) than silently return nothing.
  }

  return cleaned.trim();
}

// Strips markdown code fences (```html ... ```) some models wrap HTML in,
// and strips accidental <html>/<body> wrappers so it's a clean fragment
// that Tiptap's setContent/insertContent can parse directly.
function extractCleanHtml(rawContent: string | null | undefined): string {
  let cleaned = extractCleanContent(rawContent);

  cleaned = cleaned.replace(/^```(?:html)?\s*/i, '');
  cleaned = cleaned.replace(/\s*```$/i, '');

  cleaned = cleaned.replace(/^[\s\S]*?<body[^>]*>/i, '');
  cleaned = cleaned.replace(/<\/body>[\s\S]*$/i, '');
  cleaned = cleaned.replace(/<\/?html[^>]*>/gi, '');
  cleaned = cleaned.replace(/<\/?head[^>]*>[\s\S]*?<\/head>/gi, '');

  return cleaned.trim();
}

// ==================== MAIN FUNCTION ====================
export async function generateLetterContent(
  prompt: string,
  mode: 'generate' | 'polish' | 'fix-grammar' | 'generate-document' | 'continue',
  currentText?: string
) {
  const GROQ_API_KEY = process.env.GROQ_API_KEY;
  const GROQ_MODEL = process.env.GROQ_MODEL || 'llama3-70b-8192';

  if (!GROQ_API_KEY) {
    console.error("❌ GROQ_API_KEY is not configured");
    return { success: false, text: "Server configuration error: Missing API key" };
  }

  if (!GROQ_API_KEY.startsWith('gsk_')) {
    console.error("⚠️ GROQ_API_KEY format appears invalid");
    return { success: false, text: "Server misconfiguration: Invalid API key" };
  }

  const groq = new Groq({ apiKey: GROQ_API_KEY });

  try {
    let systemMessage = '';
    let userMessage = '';
    let isHtmlMode = false;

    switch (mode) {
      case 'generate':
        systemMessage = `You are an expert professional letter writer. Write a highly formal, well-structured, and polite letter based on the user's notes. 
Do not include placeholders like [Your Name], [Date], or [Recipient]. Output only the body of the letter.`;
        userMessage = `Write a formal letter body based on these notes:\n\n${prompt}`;
        break;

      case 'fix-grammar':
        systemMessage = `You are an expert proofreader. Fix all spelling, punctuation, and grammar errors. 
Keep the original meaning, tone, and structure exactly the same. Return ONLY the corrected text.`;
        userMessage = `Fix this text:\n\n${currentText}`;
        break;

      case 'polish':
        systemMessage = `You are an expert editor. Rewrite the text to be more professional, formal, and eloquent 
while preserving the original meaning. Return ONLY the polished text.`;
        userMessage = `Polish and elevate this letter text:\n\n${currentText}`;
        break;

      case 'generate-document':
        isHtmlMode = true;
        systemMessage = `You are an expert writer who produces complete, well-researched, well-structured documents (reports, essays, articles, proposals, etc).

Given a short topic or set of notes from the user, write the ENTIRE document yourself — do not ask questions, do not leave placeholders, do not leave sections for the user to fill in. Invent reasonable, plausible supporting details, structure, and content consistent with the topic.

Format the output as clean semantic HTML using ONLY these tags: <h1>, <h2>, <h3>, <p>, <ul>, <ol>, <li>, <strong>, <em>, <u>, <blockquote>.
- Use exactly one <h1> for the document title.
- Use <h2> for major sections and <h3> for subsections where appropriate.
- Write substantial, complete paragraphs — not outlines or bullet-point skeletons, unless a list is genuinely the best format for that content.
- Do NOT wrap the output in <html>, <head>, or <body> tags.
- Do NOT use markdown syntax (no #, no **, no -) — only the HTML tags listed above.
- Do NOT include any commentary, notes, or explanation outside the document itself. Output ONLY the HTML fragment.`;
        userMessage = `Write a complete document based on this request:\n\n${prompt}`;
        break;

      case 'continue':
        isHtmlMode = true;
        systemMessage = `You are an expert writer continuing an in-progress document. You will be given the document written so far.

Continue writing from exactly where it leaves off, matching the existing tone, style, structure, and level of detail. Add substantial new content (new paragraphs, and new sections with <h2>/<h3> headings if appropriate) that moves the document meaningfully forward — do not just summarize or restate what's already there.

Format the output as clean semantic HTML using ONLY these tags: <h1>, <h2>, <h3>, <p>, <ul>, <ol>, <li>, <strong>, <em>, <u>, <blockquote>.
- Do NOT repeat any text that already exists in the document.
- Do NOT wrap the output in <html>, <head>, or <body> tags.
- Do NOT use markdown syntax.
- Output ONLY the new HTML content to append — no commentary.`;
        userMessage = `Here is the document written so far:\n\n${currentText}\n\n${prompt ? `Direction for what to write next: ${prompt}\n\n` : ''}Continue writing the document from here.`;
        break;

      default:
        throw new Error(`Invalid mode: ${mode}`);
    }

    const completion = await groq.chat.completions.create({
      model: GROQ_MODEL,
      messages: [
        { role: "system", content: systemMessage },
        { role: "user", content: userMessage },
      ],
      temperature: mode === 'generate' || mode === 'generate-document' ? 0.7 : 0.3,
      max_tokens: mode === 'generate-document' || mode === 'continue' ? 4000 : 2000,
      // Tells Groq to strip chain-of-thought server-side for reasoning-capable
      // models (e.g. deepseek-r1-distill-*, qwen-qwq-*, kimi-k2, gpt-oss-*).
      // Non-reasoning models like llama3-70b-8192 simply ignore this field.
      // This is the actual fix for the leaked "Thinking Process:" output -
      // extractCleanContent's pattern-matching above is just a fallback in
      // case a given model/version doesn't honor this parameter.
      reasoning_format: 'hidden',
    } as any);

    const rawContent = completion.choices?.[0]?.message?.content;
    const text = isHtmlMode ? extractCleanHtml(rawContent) : extractCleanContent(rawContent);

    if (!text?.trim()) {
      console.warn("⚠️ Empty content after cleaning");
      return { success: false, text: "AI returned empty content" };
    }

    return { success: true, text };

  } catch (error: any) {
    console.error("Groq Error:", error);

    if (error?.status === 401) return { success: false, text: "Invalid Groq API key" };
    if (error?.status === 429) return { success: false, text: "Rate limit exceeded. Please try again shortly." };

    return { 
      success: false, 
      text: "Sorry, an error occurred while generating the letter. Please try again." 
    };
  }
}