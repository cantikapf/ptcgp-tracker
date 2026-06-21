import fs from 'fs';

function inspectFile(filename) {
  console.log(`\n--- Inspecting ${filename} ---`);
  try {
    const data = JSON.parse(fs.readFileSync(filename, 'utf-8'));
    console.log('Keys at root level:', Object.keys(data));
    if (data.data) {
        console.log('Keys in data:', Object.keys(data.data));
        if (data.data.cards) {
             console.log(`User has ${data.data.cards.length} or ${Object.keys(data.data.cards).length} cards.`);
        }
        if (Array.isArray(data.data)) {
            console.log(`Root data is an array of length ${data.data.length}`);
        }
    } else if (Array.isArray(data)) {
        console.log(`Root is an array of length ${data.length}`);
    }
  } catch (e) {
    console.log('Error parsing', e.message);
  }
}

inspectFile('pokezone json/mine.json');
inspectFile('pokezone json/game-data.json');
// For card-data, it's 58MB, so stream or parse carefully
try {
  const cd = JSON.parse(fs.readFileSync('pokezone json/card-data.json', 'utf-8'));
  console.log('\n--- Inspecting card-data.json ---');
  console.log('Keys at root:', Object.keys(cd));
  if (cd.data) {
      console.log('Data keys:', Object.keys(cd.data).slice(0, 10));
      if (Array.isArray(cd.data)) {
           console.log(`Card data array length: ${cd.data.length}`);
           console.log('First item keys:', Object.keys(cd.data[0]));
      } else {
           console.log(`Card data object keys count: ${Object.keys(cd.data).length}`);
      }
  } else if (Array.isArray(cd)) {
      console.log(`Card data array length: ${cd.length}`);
      console.log('First item keys:', Object.keys(cd[0]));
  }
} catch (e) {
    console.log('Error parsing card-data', e.message);
}
