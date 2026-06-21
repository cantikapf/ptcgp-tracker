import { NextResponse } from 'next/server';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';

export async function GET() {
  try {
    const dbPath = path.resolve(process.cwd(), 'ptcgp_tracker.sqlite');
    const db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });

    const cards = await db.all(`
      SELECT id, name, slug, expansionId, expansionName, pokedexNumber, quantity, imageUrl, cardType, hp, lastReceivedAt
      FROM cards 
      ORDER BY expansionId ASC, pokedexNumber ASC
    `);

    await db.close();

    return NextResponse.json({ cards });
  } catch (error) {
    console.error('Failed to fetch cards:', error);
    return NextResponse.json({ error: 'Failed to fetch cards' }, { status: 500 });
  }
}
