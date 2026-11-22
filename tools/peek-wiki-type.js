const https = require('https');
const page = process.argv[2] || 'Crocodile';
https.get(
  'https://tibia.fandom.com/api.php?action=parse&page=' + encodeURIComponent(page) + '&prop=text&format=json',
  { headers: { 'User-Agent': 'Mozilla/5.0' } },
  (res) => {
    let d = '';
    res.on('data', (c) => { d += c; });
    res.on('end', () => {
      const b = JSON.parse(d).parse.text['*'];
      const sources = [...b.matchAll(/data-source="([^"]+)"/g)].map((m) => m[1]);
      console.log('sources with type/look:', sources.filter((s) => /type|look|sprite|race/i.test(s)));
      for (const src of ['type', 'creaturetype', 'looktype', 'immunities']) {
        const portable = b.match(
          new RegExp(
            'data-source="' + src + '"[\\s\\S]*?<div class="pi-data-value[^"]*"[^>]*>([\\s\\S]*?)</div>',
            'i'
          )
        );
        if (portable) console.log(src, '=', portable[1].replace(/<[^>]+>/g, '').trim().slice(0, 80));
      }
    });
  }
);