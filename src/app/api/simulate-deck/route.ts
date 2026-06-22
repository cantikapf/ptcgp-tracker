import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const { deckCards, deckName } = await request.json();

    if (!deckCards || deckCards.length === 0) {
      return NextResponse.json({ error: 'Deck cards are required' }, { status: 400 });
    }

    const resolvedDeckCards = [];
    for (const c of deckCards) {
      let name = c.name;
      const count = c.count || c.quantity || 1;
      const cardId = c.id || c.cardId;
      
      if ((!name || name === 'Unknown Card') && cardId) {
        const { data, error } = await supabase.from('cards').select('name').eq('id', cardId).single();
        if (!error && data) {
          name = data.name;
        }
      }
      resolvedDeckCards.push({
        ...c,
        id: cardId,
        name: name || 'Unknown Card',
        count: count
      });
    }

    const deckContext = resolvedDeckCards.map((c: { count: number; name: string; }) => `[${c.count}x] ${c.name}`).join('\n');

    // Read meta-tier-list.json dynamically
    let metaText = '';
    let topDeckNames = [];
    try {
      const metaPath = path.join(process.cwd(), 'public', 'meta-tier-list.json');
      if (fs.existsSync(metaPath)) {
        const metaData = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
        const top3 = (metaData.topDecks || []).slice(0, 3);
        metaText = top3.map((m: { name: string; strategy: string; }, i: number) => `${i+1}. ${m.name} (${m.strategy})`).join('\n');
        topDeckNames = top3.map((m: { name: string; }) => m.name);
      }
    } catch(e) {
      console.warn("Failed to load meta-tier-list.json", e);
    }

    if (!metaText) {
      metaText = `1. Pikachu ex aggro (Fast lightning damage)\n2. Mewtwo ex / Gardevoir (High setup psychic damage)\n3. Charizard ex / Moltres ex (High damage fire engine)`;
      topDeckNames = ['Pikachu ex', 'Mewtwo ex', 'Charizard ex'];
    }

    const isMock = process.env.MOCK_API === 'true';
    if (isMock) {
      const matchups: Record<string, string> = {};
      topDeckNames.forEach((name: string) => {
        matchups[name] = "Favorable - Mock matchup description against " + name;
      });

      const mockResult: {
        winRate: number;
        analysis: string;
        strengths: string[];
        weaknesses: string[];
        matchups: Record<string, string> | Array<{ opponent: string; win_probability: number }>;
      } = {
        winRate: 65,
        analysis: "The custom deck has a solid structure and good synergy among its core cards. Win rate is estimated against the top meta decks.",
        strengths: ["Consistent draw options", "Strong primary attackers"],
        weaknesses: ["Vulnerable to fast aggressive decks", "Limited recovery options"],
        matchups: matchups
      };

      // Format matchups to array
      if (mockResult.matchups && !Array.isArray(mockResult.matchups)) {
        mockResult.matchups = Object.entries(mockResult.matchups).map(([opp, val]: [string, string]) => {
          let prob = 50;
          const vLower = val.toLowerCase();
          if (vLower.includes('favorable') && !vLower.includes('unfavorable')) prob = 70;
          else if (vLower.includes('unfavorable')) prob = 30;
          return { opponent: opp, win_probability: prob };
        });
      }

      return NextResponse.json(mockResult);
    }

    const matchupsTemplate = topDeckNames.map((name: string) => `    "${name}": "Favorable/Unfavorable/Even - Short reason"`).join(',\n');

    const systemPrompt = `You are an expert Pokemon TCG Pocket Battle Simulator. 
You are tasked with evaluating a user's custom deck against the current meta.
The meta consists of:
${metaText}

Evaluate the user's deck based on energy curve, synergies, and evolution lines.
Respond ONLY with a valid JSON object in the exact following format, without markdown or comments:
{
  "winRate": 68,
  "analysis": "A concise 2-3 sentence summary of why this win rate was given.",
  "strengths": ["Strength 1", "Strength 2"],
  "weaknesses": ["Weakness 1", "Weakness 2"],
  "matchups": {
${matchupsTemplate}
  }
}
`;

    const userPrompt = `Here is the user's deck titled "${deckName || 'Custom Deck'}":\n\n${deckContext}\n\nSimulate 100 battles and output the JSON evaluation.`;

    let aiResponse = '';

    // Strategy 1: Gemini
    if (process.env.GEMINI_API_KEY) {
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: [
            { role: 'user', parts: [{ text: systemPrompt + '\n\n' + userPrompt }] }
          ]
        });
        aiResponse = response.text || '';
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.warn('Gemini failed:', msg);
      }
    }

    // Strategy 2: Groq
    if (!aiResponse && process.env.GROQ_API_KEY) {
      try {
        const groq = new OpenAI({ apiKey: process.env.GROQ_API_KEY, baseURL: "https://api.groq.com/openai/v1" });
        const response = await groq.chat.completions.create({
          model: "llama-3.3-70b-versatile",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
          ],
          response_format: { type: "json_object" },
          temperature: 0.2
        });
        aiResponse = response.choices[0]?.message?.content || '';
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.warn('Groq failed:', msg);
      }
    }

    if (!aiResponse) {
      return NextResponse.json({ error: 'All AI models failed to simulate. Please check your API keys.' }, { status: 500 });
    }

    aiResponse = aiResponse.replace(/```json/g, '').replace(/```/g, '').trim();
    aiResponse = aiResponse.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '');

    const result: {
      winRate: number;
      analysis: string;
      strengths: string[];
      weaknesses: string[];
      matchups: Record<string, string> | Array<{ opponent: string; win_probability: number }>;
    } = JSON.parse(aiResponse);

    // Format matchups object to an array for easier rendering
    if (result.matchups && !Array.isArray(result.matchups)) {
      result.matchups = Object.entries(result.matchups).map(([opp, val]: [string, string]) => {
        let prob = 50;
        const vLower = val.toLowerCase();
        if (vLower.includes('favorable') && !vLower.includes('unfavorable')) prob = 70;
        else if (vLower.includes('unfavorable')) prob = 30;
        return { opponent: opp, win_probability: prob };
      });
    }

    return NextResponse.json(result);

  } catch (error) {
    console.error('Simulate API Error:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

