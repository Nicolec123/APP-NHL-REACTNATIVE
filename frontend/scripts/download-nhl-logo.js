const https = require('https');
const fs = require('fs');
const path = require('path');

const url = 'https://upload.wikimedia.org/wikipedia/en/thumb/3/3a/05_NHL_Shield.svg/200px-05_NHL_Shield.png';
const outPath = path.join(__dirname, '..', 'src', 'assets', 'nhl-logo.png');

const file = fs.createWriteStream(outPath);
https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; rv:91.0) Gecko/20100101 Firefox/91.0' } }, (res) => {
  if (res.statusCode === 200) {
    res.pipe(file);
    file.on('finish', () => {
      file.close();
      console.log('Logo NHL salva em', outPath);
    });
  } else {
    console.error('Falha ao baixar:', res.statusCode);
    process.exit(1);
  }
}).on('error', (err) => {
  fs.unlink(outPath, () => {});
  console.error('Erro:', err.message);
  process.exit(1);
});
