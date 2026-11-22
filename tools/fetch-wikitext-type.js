const https = require('https');
const page = process.argv[2] || 'Crocodile';
https.get(
  'https://tibia.fandom.com/api.php?action=parse&page=' +
    encodeURIComponent(page) +
    '&prop=wikitext&format=json',
  { headers: { 'User-Agent': 'Mozilla/5.0' } },
  (res) => {
    let d = '';
    res.on('data', (c) => { d += c; });
    res.on('end', () => {
      const w = JSON.parse(d).parse.wikitext['*'];
      const m = w.match(/\|\s*type\s*=\s*([^\n|]+)/i) || w.match(/\|appearance\s*=\s*(\d+)/i);
      console.log('match', m && m[1].trim());
      console.log('snippet', w.slice(0, 400));
    });
  }
);