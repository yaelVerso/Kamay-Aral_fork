import { GoogleGenerativeAI } from '@google/generative-ai'

export const gemini = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

// Flash-Lite tier — free-tier daily quota (500 req/day) is far higher than
// the newest flagship Flash models (~20/day), and unlike "gemini-3-flash"
// (which doesn't exist as a real model — only the preview variant does),
// this is a stable, non-preview release actually available to a normal key.
// Report generation is on-demand and low-volume, so quota headroom matters
// more here than a flagship model's marginally better writing quality.
export const GEMINI_REPORT_MODEL = 'gemini-3.1-flash-lite'
