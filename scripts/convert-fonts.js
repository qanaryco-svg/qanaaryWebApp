const fs = require('fs')
const path = require('path')

async function run() {
  const inPath = path.join(__dirname, '..', 'public', 'fonts', 'A-Iranian-Sans', 'Iranian Sans.ttf')
  if (!fs.existsSync(inPath)) {
    console.error('Input TTF not found:', inPath)
    process.exit(1)
  }
  const buf = fs.readFileSync(inPath)

  // ttf2woff
  try {
    const ttf2woff = require('ttf2woff')
    const woff = ttf2woff(new Uint8Array(buf))
    const outWoff = path.join(__dirname, '..', 'public', 'fonts', 'IranSans.woff')
    fs.writeFileSync(outWoff, Buffer.from(woff.buffer))
    console.log('WROTE', outWoff)
  } catch (e) {
    console.error('ttf2woff failed:', e.message)
  }

  // ttf2woff2
  try {
    const ttf2woff2 = require('ttf2woff2')
    const woff2 = ttf2woff2(buf)
    const outWoff2 = path.join(__dirname, '..', 'public', 'fonts', 'IranSans.woff2')
    fs.writeFileSync(outWoff2, Buffer.from(woff2))
    console.log('WROTE', outWoff2)
  } catch (e) {
    console.error('ttf2woff2 failed:', e.message)
  }
}

run()
