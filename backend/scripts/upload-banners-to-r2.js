#!/usr/bin/env node

/**
 * Upload Banner Images to R2
 * 
 * Optimizes and uploads:
 *  - Hero banners (desktop 1920px wide) → banners/home/hero-{n}.webp
 *  - Mobile banners (portrait 768px wide) → banners/home/mobile-{n}.webp
 *  - Mood cards (600px wide) → banners/mood/mood-{n}.webp
 *  - Reel images (portrait 480px wide) → banners/reels/reel-{n}.webp
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// ── R2 Config ──
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY = process.env.R2_ACCESS_KEY;
const R2_SECRET_KEY = process.env.R2_SECRET_KEY;
const R2_BUCKET = process.env.R2_BUCKET || 'ora-images';
const CDN_BASE = process.env.R2_PUBLIC_BASE_URL || 'https://cdn.orashop.in';

if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY || !R2_SECRET_KEY) {
  console.error('❌ Missing R2 credentials in .env');
  process.exit(1);
}

const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY,
    secretAccessKey: R2_SECRET_KEY,
  },
});

const IMAGES_DIR = path.join(__dirname, '..', '..', 'images');

// ── Upload helper ──
async function uploadBuffer(buffer, key) {
  const cmd = new PutObjectCommand({
    Bucket: R2_BUCKET,
    Key: key,
    Body: buffer,
    ContentType: 'image/webp',
    CacheControl: 'public, max-age=31536000, immutable',
    Metadata: {
      'uploaded-at': new Date().toISOString(),
      'source': 'ora-banner-upload-script',
    },
  });
  await s3.send(cmd);
  const url = `${CDN_BASE}/${key}`;
  console.log(`  ✅ ${key}  (${(buffer.length / 1024).toFixed(0)} KB)  →  ${url}`);
  return url;
}

// ── Process and upload a single image ──
async function processAndUpload(filePath, r2Key, width, height, quality) {
  const raw = fs.readFileSync(filePath);
  let pipeline = sharp(raw).webp({ quality });
  
  if (width && height) {
    pipeline = pipeline.resize(width, height, { fit: 'cover', position: 'center' });
  } else if (width) {
    pipeline = pipeline.resize(width, null, { fit: 'inside', withoutEnlargement: true });
  }
  
  const optimized = await pipeline.toBuffer();
  return uploadBuffer(optimized, r2Key);
}

// ── Main ──
async function main() {
  console.log('\n🚀 ORA Banner Image Upload to R2\n');
  console.log(`   Bucket: ${R2_BUCKET}`);
  console.log(`   CDN:    ${CDN_BASE}\n`);

  const results = {
    heroDesktop: [],
    heroMobile: [],
    mood: [],
    reels: [],
  };

  // ─────────────────────────────────────────
  // 1. HERO BANNERS (Desktop — 1920×800 webp)
  // ─────────────────────────────────────────
  console.log('━━━ Hero Banners (Desktop) ━━━');
  const heroDir = path.join(IMAGES_DIR, 'hero banner');
  // Sort files for consistent ordering
  const heroFiles = fs.readdirSync(heroDir)
    .filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f))
    .sort((a, b) => {
      const numA = parseInt(a.replace(/\D/g, '')) || 999;
      const numB = parseInt(b.replace(/\D/g, '')) || 999;
      return numA - numB;
    });

  for (let i = 0; i < heroFiles.length; i++) {
    const file = heroFiles[i];
    const filePath = path.join(heroDir, file);
    const key = `banners/home/hero-${i + 1}.webp`;
    const url = await processAndUpload(filePath, key, 1920, 800, 88);
    results.heroDesktop.push(url);
  }

  // ─────────────────────────────────────────
  // 2. MOBILE BANNERS (Portrait — 768×1024 webp)
  // ─────────────────────────────────────────
  console.log('\n━━━ Mobile Banners ━━━');
  const mobileDir = path.join(IMAGES_DIR, 'mobile banner');
  const mobileFiles = fs.readdirSync(mobileDir)
    .filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f))
    .sort((a, b) => {
      const numA = parseInt(a.replace(/\D/g, '')) || 999;
      const numB = parseInt(b.replace(/\D/g, '')) || 999;
      return numA - numB;
    });

  for (let i = 0; i < mobileFiles.length; i++) {
    const file = mobileFiles[i];
    const filePath = path.join(mobileDir, file);
    const key = `banners/home/mobile-${i + 1}.webp`;
    const url = await processAndUpload(filePath, key, 768, 1024, 85);
    results.heroMobile.push(url);
  }

  // ─────────────────────────────────────────
  // 3. MOOD CARDS (Portrait — 600×800 webp)
  // ─────────────────────────────────────────
  console.log('\n━━━ Mood Cards ━━━');
  const moodDir = path.join(IMAGES_DIR, 'Mood Card');
  const moodFiles = fs.readdirSync(moodDir)
    .filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f))
    .filter(f => !f.startsWith('Untitled')) // skip PSD exports
    .sort((a, b) => {
      const numA = parseInt(a.replace(/\D/g, '')) || 999;
      const numB = parseInt(b.replace(/\D/g, '')) || 999;
      return numA - numB;
    });

  for (let i = 0; i < moodFiles.length; i++) {
    const file = moodFiles[i];
    const filePath = path.join(moodDir, file);
    const key = `banners/mood/mood-${i + 1}.webp`;
    const url = await processAndUpload(filePath, key, 600, 800, 85);
    results.mood.push(url);
  }

  // ─────────────────────────────────────────
  // 4. REEL IMAGES (Portrait 9:16 — 480×854 webp)
  //    Using a mix of mobile banners for the reel strip
  // ─────────────────────────────────────────
  console.log('\n━━━ Reel Strip Images ━━━');
  // Use the first 8 mobile banners as reel images (they're portrait format, perfect for 9:16)
  const reelSourceFiles = mobileFiles.slice(0, 8);
  for (let i = 0; i < reelSourceFiles.length; i++) {
    const file = reelSourceFiles[i];
    const filePath = path.join(mobileDir, file);
    const key = `banners/reels/reel-${i + 1}.webp`;
    const url = await processAndUpload(filePath, key, 480, 854, 82);
    results.reels.push(url);
  }

  // ─────────────────────────────────────────
  // 5. CATEGORY HERO IMAGES (wide — 1200×800)
  //    Pick 3 hero banners for Necklaces, Rings, Bracelets
  // ─────────────────────────────────────────
  console.log('\n━━━ Category Images ━━━');
  // Use hero banner 1 for necklaces (wide hero), hero 3 for rings, hero 4 for bracelets
  const categoryMapping = [
    { name: 'necklaces', heroIndex: 0 },
    { name: 'rings', heroIndex: 2 },
    { name: 'bracelets', heroIndex: 3 },
  ];
  results.categories = [];
  for (const cat of categoryMapping) {
    if (heroFiles[cat.heroIndex]) {
      const filePath = path.join(heroDir, heroFiles[cat.heroIndex]);
      const key = `banners/categories/${cat.name}.webp`;
      const url = await processAndUpload(filePath, key, 1200, 800, 88);
      results.categories.push({ name: cat.name, url });
    }
  }

  // ─────────────────────────────────────────
  // Print summary
  // ─────────────────────────────────────────
  console.log('\n\n════════════════════════════════════════════');
  console.log('  📋 UPLOAD SUMMARY');
  console.log('════════════════════════════════════════════\n');
  
  console.log(`Hero Desktop:  ${results.heroDesktop.length} images`);
  results.heroDesktop.forEach((u, i) => console.log(`  [${i + 1}] ${u}`));
  
  console.log(`\nHero Mobile:   ${results.heroMobile.length} images`);
  results.heroMobile.forEach((u, i) => console.log(`  [${i + 1}] ${u}`));
  
  console.log(`\nMood Cards:    ${results.mood.length} images`);
  results.mood.forEach((u, i) => console.log(`  [${i + 1}] ${u}`));
  
  console.log(`\nReel Strip:    ${results.reels.length} images`);
  results.reels.forEach((u, i) => console.log(`  [${i + 1}] ${u}`));

  if (results.categories) {
    console.log(`\nCategories:    ${results.categories.length} images`);
    results.categories.forEach(c => console.log(`  ${c.name}: ${c.url}`));
  }

  console.log('\n✅ All images uploaded successfully!');
  console.log('   Now update the frontend components to use these CDN URLs.\n');

  // Write a JSON mapping file for reference
  const outputPath = path.join(__dirname, '..', 'data', 'banner-urls.json');
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
  console.log(`📄 URL mapping saved to: ${outputPath}\n`);
}

main().catch(err => {
  console.error('❌ Upload failed:', err);
  process.exit(1);
});
