import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    const { data: cards, error } = await supabase
      .from('cards')
      .select('id, name, slug, expansionId, expansionName, pokedexNumber, quantity, imageUrl, cardType, hp, lastReceivedAt')
      .order('expansionId', { ascending: true })
      .order('pokedexNumber', { ascending: true });

    if (error) throw error;

    return NextResponse.json({ cards });
  } catch (error) {
    console.error('Failed to fetch cards:', error);
    return NextResponse.json({ error: 'Failed to fetch cards' }, { status: 500 });
  }
}
