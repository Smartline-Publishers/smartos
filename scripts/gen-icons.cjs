// Set DOMParser shim BEFORE requiring canvg (it captures DOMParser at load time)
const { JSDOM } = require('jsdom');
globalThis.DOMParser = function DOMParser() {};
DOMParser.prototype.parseFromString = function (xml, mimeType) {
  if (mimeType !== 'image/svg+xml') throw new Error('unsupported mimeType');
  const dom = new JSDOM(xml, { contentType: 'image/svg+xml' });
  return dom.window.document;
};

const { createCanvas } = require('@napi-rs/canvas');
const { Canvg } = require('canvg');
const fs = require('fs');

const svg = fs.readFileSync('public/branding/smartline-logo.svg', 'utf8');

async function renderSvg(ctx, size) {
  const v = await Canvg.from(ctx, svg, { width: size, height: size, ignoreDimensions: true });
  await v.render();
}

async function main() {
  const sizes = [16, 32, 48, 64, 96, 128, 192, 256, 384, 512];
  for (const size of sizes) {
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');
    await renderSvg(ctx, size);
    fs.writeFileSync(`public/icons/icon-${size}.png`, canvas.toBuffer('image/png'));
    console.log(`wrote public/icons/icon-${size}.png`);
  }

  const at = createCanvas(180, 180);
  const atCtx = at.getContext('2d');
  await renderSvg(atCtx, 180);
  fs.writeFileSync('public/apple-touch-icon.png', at.toBuffer('image/png'));
  console.log('wrote public/apple-touch-icon.png');

  for (const size of [32, 16]) {
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');
    await renderSvg(ctx, size);
    fs.writeFileSync(`public/favicon-${size}x${size}.png`, canvas.toBuffer('image/png'));
    console.log(`wrote public/favicon-${size}x${size}.png`);
  }

  const mc = createCanvas(400, 400);
  const mctx = mc.getContext('2d');
  await renderSvg(mctx, 400);
  const mb = createCanvas(512, 512);
  const mbctx = mb.getContext('2d');
  mbctx.drawImage(mc, 56, 56);
  fs.writeFileSync('public/icons/maskable-icon.png', mb.toBuffer('image/png'));
  console.log('wrote public/icons/maskable-icon.png');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
