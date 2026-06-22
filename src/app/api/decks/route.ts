import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Get all decks (History and Saved)
export async function GET() {
  try {
    const { data: decks, error } = await supabase
      .from('saved_decks')
      .select('*')
      .order('createdAt', { ascending: false });

    if (error) throw error;
    
    // Parse JSON for cards
    const parsedDecks = decks.map(d => ({
      ...d,
      cards: d.cards ? JSON.parse(d.cards) : []
    }));

    return NextResponse.json({ success: true, decks: parsedDecks });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// Update deck is_saved status
export async function PUT(request: Request) {
  try {
    const { id, is_saved } = await request.json();
    if (!id) return NextResponse.json({ error: 'Deck ID required' }, { status: 400 });

    const { error } = await supabase.from('saved_decks').update({ is_saved: is_saved ? 1 : 0 }).eq('id', id);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// Delete deck
export async function DELETE(request: Request) {
  try {
    const { id } = await request.json();
    if (!id) return NextResponse.json({ error: 'Deck ID required' }, { status: 400 });

    const { error } = await supabase.from('saved_decks').delete().eq('id', id);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
