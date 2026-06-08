'use server';

import OpenAI from 'openai';

export async function generateLetterContent(
  prompt: string, 
  mode: 'generate' | 'polish' | 'fix-grammar', 
  currentText?: string
) {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    timeout: 30000,
  });

  try {
    let systemMessage = '';
    let userMessage = '';

    if (mode === 'generate') {
      systemMessage = "You are an expert professional letter writer. Write a highly formal, well-structured, and polite letter based on the user's bullet points. Do not include placeholders like [Your Name], just write the body of the letter.";
      userMessage = `Write a formal letter body based on these notes:\n${prompt}`;
    } 
    else if (mode === 'fix-grammar') {
      systemMessage = "You are an expert proofreader. Fix all spelling, punctuation, and grammar errors in the provided text. Keep the original meaning and formatting exactly the same. Return ONLY the corrected text, no explanations.";
      userMessage = `Fix all errors in this text:\n\n${currentText}`;
    } 
    else if (mode === 'polish') {
      systemMessage = "You are an expert editor. Rewrite the provided text to make it more professional, formal, and grammatically perfect. Keep the original meaning but elevate the vocabulary and tone. Return ONLY the rewritten text, no explanations.";
      userMessage = `Polish and improve this letter text:\n\n${currentText}`;
    } else {
      throw new Error(`Invalid mode: ${mode}`);
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemMessage },
        { role: "user", content: userMessage },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    const text = response.choices[0]?.message?.content?.trim();
    if (!text) {
      return { success: false, text: "AI returned empty content. Please try again." };
    }

    return { success: true, text };
  } catch (error: any) {
    console.error("OpenAI Error:", error);
    const message = error?.message || "Unknown error";
    return { success: false, text: `Error: ${message}` };
  }
}