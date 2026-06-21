import { NextResponse } from 'next/server';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';

async function getDb() {
  return open({
    filename: path.resolve(process.cwd(), 'ptcgp_tracker.sqlite'),
    driver: sqlite3.Database
  });
}

// Get all decks (History and Saved)
export async function GET() {
  try {
    const db = await getDb();
    const decks = await db.all('SELECT * FROM decks ORDER BY created_at DESC');
    await db.close();
    
    // Parse JSON for cards
    const parsedDecks = decks.map(d => ({
      ...d,
      cards: JSON.parse(d.cards_json)
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

    const db = await getDb();
    await db.run('UPDATE decks SET is_saved = ? WHERE id = ?', is_saved ? 1 : 0, id);
    await db.close();

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

    const db = await getDb();
    await db.run('DELETE FROM decks WHERE id = ?', id);
    await db.close();

    return NextResponse.json({ success: true });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
