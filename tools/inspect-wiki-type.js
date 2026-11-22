const https = require('https');
const page = process.argv[2] || 'Chicken';
https.get(
  'https://tibia.fandom.com/api.php?action=parse&page=' + encodeURIComponent(page) + '&prop=text&format=json',
  { headers: { 'User-Agent': 'Mozilla/5.0' } },
  (r) => {
    let d = '';
    r.on('data', (c) => { d += c; });
    r.on('end', () => {
      const b = JSON.parse(d).parse.text['*'];
      const s = b.match(/data-source="[^"]+"/g) || [];
      console.log(s.join('\n'));
    });
  }
);