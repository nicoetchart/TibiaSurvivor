/* One-off: fetch hitpoints from tibia.fandom.com creature pages. */
const https = require('https');
const fs = require('fs');
const path = require('path');

const NAMES = [
  'Cat', 'Dog', 'Deer', 'Rabbit', 'Bug', 'Troll', 'Wolf', 'Orc_Shaman', 'Minotaur',
  'Black_Knight', 'Wasp', 'Fire_Devil', 'Ghoul', 'Bonelord', 'Hero', 'Demon', 'Orshabaal'
];

function fetchPage(title) {
  const page = title.replace(/ /g, '_');
  const u =
    'https://tibia.fandom.com/api.php?action=parse&page=' +
    encodeURIComponent(page) +
    '&prop=text&format=json';
  return new Promise((resolve, reject) => {
    https.get(u, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; TibiaSurvivor-data/1.0)' } }, (res) => {
      let d = '';
      res.on('data', (c) => { d += c; });
      res.on('end', () => {
        let body = '';
        if (res.statusCode === 200) {
          try {
            const j = JSON.parse(d);
            body = (j.parse && j.parse.text && j.parse.text['*']) || '';
          } catch (_) { /* keep empty */ }
        }
        resolve({
          status: res.statusCode,
          body,
          url: 'https://tibia.fandom.com/wiki/' + encodeURIComponent(page)
        });
      });
    }).on('error', reject);
  });
}

function parseHp(html) {
  for (const src of ['hp', 'hitpoints']) {
    const portable = html.match(
      new RegExp(
        'data-source="' + src + '"[\\s\\S]*?<div class="pi-data-value[^"]*"[^>]*>([\\s\\S]*?)</div>',
        'i'
      )
    );
    if (portable) {
      const raw = portable[1].replace(/<[^>]+>/g, '').trim();
      const n = parseInt(raw.replace(/,/g, ''), 10);
      if (Number.isFinite(n)) return n;
    }
  }
  return null;
}

(async () => {
  const out = {};
  for (const name of NAMES) {
    const { status, body, url } = await fetchPage(name);
    const hp = status === 200 ? parseHp(body) : null;
    out[name] = { hp, status, url };
    console.log(name + ':', hp == null ? 'FAIL ' + status : hp);
    await new Promise((r) => setTimeout(r, 350));
  }
  fs.writeFileSync(path.join(__dirname, 'tibia-wiki-hp.json'), JSON.stringify(out, null, 2));
})();