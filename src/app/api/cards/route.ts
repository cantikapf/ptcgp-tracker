import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    let allCards: any[] = [];
    let hasMore = true;
    let page = 0;
    const pageSize = 1000;

    while (hasMore) {
      const { data, error } = await supabase
        .from('cards')
        .select('id, name, slug, expansionId, expansionName, pokedexNumber, quantity, imageUrl, cardType, hp, lastReceivedAt')
        .order('expansionId', { ascending: true })
        .order('pokedexNumber', { ascending: true })
        .range(page * pageSize, (page + 1) * pageSize - 1);

      if (error) throw error;

      if (data && data.length > 0) {
        allCards = [...allCards, ...data];
        if (data.length < pageSize) {
          hasMore = false;
        } else {
          page++;
        }
      } else {
        hasMore = false;
      }
    }

    return NextResponse.json({ success: true, cards: allCards });
  } catch (error) {
    console.error('Failed to fetch cards:', error);
    return NextResponse.json({ error: 'Failed to fetch cards' }, { status: 500 });
  }
}
