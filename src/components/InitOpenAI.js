import OpenAI from "openai";

console.log(process.env)
  // Initialize OpenAI client (replace with your actual API key)
export const openai = new OpenAI({
    apiKey: process.env.REACT_APP_OPENAI_API_KEY,
    dangerouslyAllowBrowser: true // Note: Only for client-side demos. Use backend in production.
  });