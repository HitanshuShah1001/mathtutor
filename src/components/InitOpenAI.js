import OpenAI from "openai";

  // Initialize OpenAI client (replace with your actual API key)
export const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    dangerouslyAllowBrowser: true // Note: Only for client-side demos. Use backend in production.
  });