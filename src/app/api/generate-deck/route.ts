import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { GoogleGenAI } from '@google/genai';
import OpenAI from 'openai';
import { randomUUID } from 'crypto';

export async function POST(request: Request) {
  try {
    const { prompt } = await request.json();

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    const isMock = process.env.MOCK_API === 'true';
    if (isMock) {
      const { data: ownedCards, error: fetchError } = await supabase.from('cards').select('id, name, cardType, quantity').gt('quantity', 0);
      
      if (fetchError || !ownedCards || ownedCards.length === 0) {
        return NextResponse.json({ error: 'You do not own any cards yet. Please sync your collection first.' }, { status: 400 });
      }

      const deckCards: Array<{ id: string; quantity: number }> = [];
      let totalCount = 0;

      for (const card of ownedCards) {
        if (totalCount >= 20) break;
        const maxAdd = Math.min(2, card.quantity, 20 - totalCount);
        if (maxAdd > 0) {
          deckCards.push({ id: card.id, quantity: maxAdd });
          totalCount += maxAdd;
        }
      }

      const deckId = randomUUID();
      const deckData = {
        id: deckId,
        thoughtProcess: "Generated mock deck based on owned cards.",
        deckName: "Mock " + (prompt || "Custom") + " Deck",
        strategy: "This is a mock deck strategy. Use your cards to attack and defend.",
        cards: deckCards
      };

      const { error: insertError } = await supabase.from('saved_decks').insert({
        id: deckId,
        name: deckData.deckName,
        strategy: deckData.strategy,
        cards: JSON.stringify(deckData.cards)
      });

      if (insertError) console.error(insertError);

      return NextResponse.json({ success: true, deck: deckData });
    }

    // 1. Fetch available cards from Supabase
    const { data: ownedCards, error: fetchError } = await supabase.from('cards').select('*').gt('quantity', 0);
    if (fetchError) throw fetchError;

    if (!ownedCards || ownedCards.length === 0) {
      return NextResponse.json({ error: 'You do not own any cards yet. Please sync your collection first.' }, { status: 400 });
    }

    const cardsContext = ownedCards.map(c => {
      let context = `- ${c.name} (Type: ${c.cardType}, Max Owned: ${c.quantity})`;
      if (c.stage === 'Stage 1' || c.stage === 'Stage 2' || c.stage === 'One' || c.stage === 'Two') {
         context += ` [Evolves from ${c.evolvesFrom}]`;
      }
      return context;
    }).join('\n');

    const systemPrompt = `You are an expert Pokemon TCG Pocket deck builder. 
Your task is to build a competitive deck based on the user's request, but YOU MUST strictly follow these rules:
1. The deck MUST contain exactly 20 cards.
2. You can ONLY use the cards provided in the "Owned Cards" list below.
3. You CANNOT use more copies of a specific card than the "Max Copies Owned" value provided.
4. HARD LIMIT: You ABSOLUTELY CANNOT include more than 2 copies of any single card, under ANY circumstances. The "quantity" field MUST be exactly 1 or 2.
5. LOGICAL SYNERGY & TYPING: Ensure your card choices actually work together in Pokemon TCG. 
   - A good deck MUST HAVE a balance: roughly 10-14 Pokemon cards and 6-10 Trainer cards (Item/Supporter).
   - DO NOT make a deck with only Pokemon cards! You MUST include staple Trainer cards (e.g., Professor's Research, Poke Ball, X Speed, Potion) if the user owns them.
   - You MUST STRICTLY build a Mono-type deck (only ONE type of Pokemon like Water, Fire, or Lightning). You may add Colorless Pokemon, but DO NOT mix multiple elemental types.
   - EVOLUTION RULE: If you include a Stage 1 or Stage 2 Pokemon (e.g. Gengar, Charizard, Raichu), you ABSOLUTELY MUST include its Basic form (e.g. Gastly, Charmander, Pikachu) from the Owned Cards list. Do NOT include evolved Pokemon without their base forms!
   - DO NOT include Trainer cards that support Stage 2 Pokemon (e.g. Juliana) if there are NO Stage 2 Pokemon in the deck.
6. META DECKS INSPIRATION: Consider the current top-tier meta decks. If the user has the cards, emulate strong synergies!
7. MISSING CARDS COMMUNICATION: If the user requested a specific Pokemon (e.g., "Charizard ex") but they DO NOT own it, YOU MUST explicitly state at the very beginning of the "strategy" field: "Sorry, you don't own [Requested Card] in your collection, so I used [Alternative] instead..."
8. (Note: Basic Energy cards are not part of the 20-card deck in Pokemon TCG Pocket, so DO NOT include them).
9. IMPORTANT: Your entire response (thoughtProcess, deckName, strategy) MUST BE IN ENGLISH. Do NOT use Indonesian.
10. Output MUST be ONLY valid JSON, without any markdown formatting or code blocks. DO NOT ADD CODE COMMENTS!

EXPECTED JSON FORMAT:
{
  "thoughtProcess": "string (Explain your reasoning)",
  "deckName": "string",
  "strategy": "string",
  "cards": [
    { "name": "card_name_string", "quantity": number (MUST be 1 or 2) }
  ]
}

Owned Cards:
${cardsContext}
`;

    const userPrompt = `User Request: ${prompt}\n\nPlease generate the deck in JSON format now.`;

    let aiResultText = '';
    const errorLogs: string[] = [];

    // Strategy 1: Gemini
    if (process.env.GEMINI_API_KEY && !aiResultText) {
      try {
        console.log('Trying Gemini API...');
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: systemPrompt + '\\n\\n' + userPrompt,
            config: {
                responseMimeType: "application/json",
            }
        });
        aiResultText = response.text || '';
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        console.error('Gemini Failed:', msg);
        errorLogs.push('Gemini: ' + msg);
      }
    }

    // Strategy 2: Groq
    if (process.env.GROQ_API_KEY && !aiResultText) {
      try {
        console.log('Trying Groq API...');
        const openai = new OpenAI({
          apiKey: process.env.GROQ_API_KEY,
          baseURL: "https://api.groq.com/openai/v1",
        });
        const completion = await openai.chat.completions.create({
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
          ],
          model: "llama-3.3-70b-versatile",
          response_format: { type: "json_object" }
        });
        aiResultText = completion.choices[0].message.content || '';
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        console.error('Groq Failed:', msg);
        errorLogs.push('Groq: ' + msg);
      }
    }

    // Strategy 3: OpenRouter
    if (process.env.OPENROUTER_API_KEY && !aiResultText) {
      try {
        console.log('Trying OpenRouter API...');
        const openai = new OpenAI({
          apiKey: process.env.OPENROUTER_API_KEY,
          baseURL: "https://openrouter.ai/api/v1",
        });
        const completion = await openai.chat.completions.create({
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
          ],
          model: "openai/gpt-4o-mini",
        });
        aiResultText = completion.choices[0].message.content || '';
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        console.error('OpenRouter Failed:', msg);
        errorLogs.push('OpenRouter: ' + msg);
      }
    }

    if (!aiResultText) {
      return NextResponse.json({ error: 'All AI models failed to generate a response. Details: ' + errorLogs.join(' | ') }, { status: 500 });
    }

    // Clean up markdown block if model ignored response_format
    let cleanJson = aiResultText.trim();
    if (cleanJson.startsWith('```json')) {
      cleanJson = cleanJson.replace(/^```json\\n/, '').replace(/\\n```$/, '');
    } else if (cleanJson.startsWith('```')) {
      cleanJson = cleanJson.replace(/^```\\n/, '').replace(/\\n```$/, '');
    }

    // Strip inline comments (e.g., // Froakie) that some LLMs illegally add to JSON
    cleanJson = cleanJson.replace(/\/\/.*$/gm, '');

    const deckData = JSON.parse(cleanJson);

    // Final Validation and mapping names to UUIDs
    let totalCards = 0;
    const finalCards: Array<{id: string, quantity: number}> = [];
    
    if (Array.isArray(deckData.cards)) {
        deckData.cards.forEach((c: { id?: string, name?: string, quantity: number }) => {
            const identifier = (c.name || c.id || '').toLowerCase();
            const realCard = ownedCards.find(oc => oc.name.toLowerCase() === identifier || oc.id.toLowerCase() === identifier);
            
            if (realCard) {
                let qty = c.quantity;
                if (qty > 2) qty = 2;
                
                // Enforce ownership limits strictly
                const allowedQty = Math.min(qty, realCard.quantity, 2);
                if (allowedQty > 0) {
                    const roomLeft = 20 - totalCards;
                    if (roomLeft <= 0) return;
                    
                    const qtyToAdd = Math.min(allowedQty, roomLeft);
                    finalCards.push({ id: realCard.id, quantity: qtyToAdd });
                    totalCards += qtyToAdd;
                }
            }
        });
    }
    
    deckData.cards = finalCards;

    if (totalCards < 20) {
        const missingCards = 20 - totalCards;
        const deckTypes = [...new Set(finalCards.map(c => {
            const oc = ownedCards.find(o => o.id === c.id);
            return oc ? oc.cardType : null;
        }).filter(t => t && t !== 'Trainer' && t !== 'Colorless'))];
        const primaryType = deckTypes[0] || 'Water';

        for (const owned of ownedCards) {
            if (totalCards >= 20) break;
            
            const inDeck = finalCards.find(c => c.id === owned.id);
            const currentQty = inDeck ? inDeck.quantity : 0;
            const maxAllowed = Math.min(2, owned.quantity);
            
            if (currentQty < maxAllowed) {
                if (owned.cardType === primaryType || owned.cardType === 'Colorless' || owned.cardType === 'Trainer') {
                    const qtyToAdd = Math.min(maxAllowed - currentQty, 20 - totalCards);
                    if (qtyToAdd > 0) {
                        if (inDeck) {
                            inDeck.quantity += qtyToAdd;
                        } else {
                            finalCards.push({ id: owned.id, quantity: qtyToAdd });
                        }
                        totalCards += qtyToAdd;
                    }
                }
            }
        }
        
        deckData.strategy += '\\n\\n(Auto-Fill Activated: The AI tried to use cards you do not own, leaving the deck with missing slots. I automatically filled the remaining ' + missingCards + ' slots with your owned cards to make it a valid 20-card deck!)';
    } else if (totalCards > 20) {
        deckData.strategy += '\\n\\n(Note: The AI generated more than 20 cards. The deck was truncated to 20 cards.)';
    }

    const deckId = randomUUID();
    deckData.id = deckId;

    const { error: insertError } = await supabase.from('saved_decks').insert({
      id: deckId,
      name: deckData.deckName || 'Generated Deck',
      cards: JSON.stringify(deckData.cards || [])
    });

    if (insertError) {
      console.error('Supabase Error:', insertError);
    }

    return NextResponse.json({ success: true, deck: deckData });

  } catch (error) {
    console.error('Deck Generation Error:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
