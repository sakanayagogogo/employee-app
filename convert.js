const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3005;
const PUBLIC_DIR = path.join(__dirname, 'public');

function generateIco(pngs) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(pngs.length, 4);

  let offset = 6 + 16 * pngs.length;
  const entries = [];
  const datas = [];

  for (const png of pngs) {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(png.width >= 256 ? 0 : png.width, 0);
    entry.writeUInt8(png.height >= 256 ? 0 : png.height, 1);
    entry.writeUInt8(0, 2); // palette colors
    entry.writeUInt8(0, 3); // reserved
    entry.writeUInt16LE(1, 4); // color planes
    entry.writeUInt16LE(32, 6); // bits per pixel
    entry.writeUInt32LE(png.buffer.length, 8); // size of image data
    entry.writeUInt32LE(offset, 12); // offset of image data

    entries.push(entry);
    datas.push(png.buffer);
    offset += png.buffer.length;
  }

  return Buffer.concat([header, ...entries, ...datas]);
}

const server = http.createServer((req, res) => {
  if (req.method === 'GET' && req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>SVG to PNG/ICO Converter</title>
      </head>
      <body>
        <h1>Converting SVG to PNG/ICO...</h1>
        <div id="status">Starting...</div>
        <script>
          async function start() {
            try {
              document.getElementById('status').innerText = 'Loading SVG...';
              const response = await fetch('/kizuna-color.svg');
              const svgText = await response.text();
              
              const parser = new DOMParser();
              const svgDoc = parser.parseFromString(svgText, 'image/svg+xml');
              const svgElement = svgDoc.documentElement;
              
              // We need to render the SVG to Canvas at different sizes
              const sizes = [16, 32, 48, 180, 192, 512];
              const results = {};
              
              for (const size of sizes) {
                document.getElementById('status').innerText = 'Rendering size ' + size + 'x' + size + '...';
                const canvas = document.createElement('canvas');
                canvas.width = size;
                canvas.height = size;
                const ctx = canvas.getContext('2d');
                
                const img = new Image();
                const svgBlob = new Blob([svgText], { type: 'image/svg+xml;charset=utf-8' });
                const url = URL.createObjectURL(svgBlob);
                
                await new Promise((resolve, reject) => {
                  img.onload = () => {
                    ctx.drawImage(img, 0, 0, size, size);
                    URL.revokeObjectURL(url);
                    resolve();
                  };
                  img.onerror = reject;
                  img.src = url;
                });
                
                const dataUrl = canvas.toDataURL('image/png');
                const base64 = dataUrl.split(',')[1];
                results[size] = base64;
              }
              
              document.getElementById('status').innerText = 'Sending rendered images back to server...';
              const uploadResponse = await fetch('/upload', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(results)
              });
              const uploadText = await uploadResponse.text();
              document.getElementById('status').innerText = 'Done! Server response: ' + uploadText;
            } catch (err) {
              document.getElementById('status').innerText = 'Error: ' + err.toString();
              console.error(err);
            }
          }
          start();
        </script>
      </body>
      </html>
    `);
  } else if (req.method === 'GET' && req.url === '/kizuna-color.svg') {
    const svgPath = path.join(PUBLIC_DIR, 'kizuna-color.svg');
    fs.readFile(svgPath, (err, data) => {
      if (err) {
        res.writeHead(404);
        res.end('SVG not found');
      } else {
        res.writeHead(200, { 'Content-Type': 'image/svg+xml' });
        res.end(data);
      }
    });
  } else if (req.method === 'POST' && req.url === '/upload') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const results = JSON.parse(body);
        const png16 = Buffer.from(results['16'], 'base64');
        const png32 = Buffer.from(results['32'], 'base64');
        const png48 = Buffer.from(results['48'], 'base64');
        const png180 = Buffer.from(results['180'], 'base64');
        const png192 = Buffer.from(results['192'], 'base64');
        const png512 = Buffer.from(results['512'], 'base64');

        // Generate favicon.ico with 16x16, 32x32, 48x48
        const icoBuffer = generateIco([
          { width: 16, height: 16, buffer: png16 },
          { width: 32, height: 32, buffer: png32 },
          { width: 48, height: 48, buffer: png48 }
        ]);

        fs.writeFileSync(path.join(PUBLIC_DIR, 'favicon.ico'), icoBuffer);
        fs.writeFileSync(path.join(PUBLIC_DIR, 'icon.png'), png512);
        fs.writeFileSync(path.join(PUBLIC_DIR, 'apple-touch-icon.png'), png180);
        fs.writeFileSync(path.join(PUBLIC_DIR, 'apple-touch-icon-combined.png'), png180);
        fs.writeFileSync(path.join(PUBLIC_DIR, 'pwa-icon.png'), png512);
        fs.writeFileSync(path.join(PUBLIC_DIR, 'pwa-icon-color.png'), png512);

        res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('All icons successfully updated!');
        
        // Terminate server after short delay
        setTimeout(() => {
          console.log('Conversion finished. Exiting...');
          process.exit(0);
        }, 1000);
      } catch (err) {
        console.error(err);
        res.writeHead(500);
        res.end('Error processing images: ' + err.message);
      }
    });
  } else {
    res.writeHead(404);
    res.end('Not Found');
  }
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/`);
});
