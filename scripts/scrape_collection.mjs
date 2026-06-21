import { chromium } from 'playwright';
import fs from 'fs';

(async () => {
  console.log('Membuka browser... (Mohon jangan ditutup, ini untuk melewati sistem keamanan Cloudflare)');
  
  // Launch visible browser to pass Cloudflare Turnstile
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Listen to network responses to catch the collection data
  let dataExtracted = false;
  page.on('response', async (response) => {
    const url = response.url();
    // Pokemon-zone likely uses an API endpoint to fetch user collection
    if (url.includes('api/') && url.includes('collection') || url.includes('cards')) {
      try {
        const json = await response.json();
        if (json) {
          fs.writeFileSync('collection_dump.json', JSON.stringify(json, null, 2));
          console.log('\n✅ BERHASIL! Data koleksi berhasil disadap dari API dan disimpan ke collection_dump.json');
          dataExtracted = true;
        }
      } catch (e) {
        // Not a JSON response or failed to parse, ignore
      }
    }
  });

  try {
    await page.goto('https://www.pokemon-zone.com/login', { waitUntil: 'domcontentloaded' });
    
    console.log('\n⏳ Menunggu Anda untuk menyelesaikan verifikasi Cloudflare jika ada...');
    
    // Attempt to auto-fill if fields are present
    try {
      await page.waitForSelector('input[name="username"]', { timeout: 15000 });
      await page.fill('input[name="username"]', 'xxcylops');
      // Wait for password field
      const passField = await page.$('input[type="password"], input[name="password"]');
      if(passField) {
        await passField.fill('jeonsomi7');
        console.log('Kredensial otomatis terisi! Silakan klik tombol Login.');
      }
    } catch(e) {
      console.log('Gagal mengisi otomatis. Silakan login manual dengan:');
      console.log('Username: xxcylops');
      console.log('Password: jeonsomi7');
    }

    console.log('\n>> SETELAH LOGIN, SILAKAN BUKA HALAMAN "COLLECTION" ANDA DI WEB TERSEBUT.');
    console.log('>> Skrip ini sedang menyadap (intercept) data yang lewat. Tunggu sampai ada pesan BERHASIL.');
    
    // Wait until data is extracted or timeout after 3 minutes
    let elapsed = 0;
    while (!dataExtracted && elapsed < 180) {
      await page.waitForTimeout(1000);
      elapsed++;
    }

    if (!dataExtracted) {
      console.log('\n❌ Waktu habis. Data koleksi tidak terdeteksi. Silakan coba lagi.');
    }
    
  } catch (error) {
    console.error('Terjadi kesalahan:', error.message);
  } finally {
    await browser.close();
  }
})();
