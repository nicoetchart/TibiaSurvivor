import https from 'https';
const u = 'https://tibia.fandom.com/api.php?action=parse&page=Amazon&prop=text&format=json';
https.get(u, { headers: { 'User-Agent': 'x' } }, (r) => {
  let d = '';
  r.on('data', (c) => { d += c; });
  r.on('end', () => {
    const b = JSON.parse(d).parse.text['*'];
    const re = /data-source="([^"]+)"/g;
    const sources = [];
    let m;
    while ((m = re.exec(b))) sources.push(m[1]);
    console.log('sources', sources.filter((x) => /look|colour|color|addon|type/i.test(x)));
    const idx = b.search(/113|120|Colours|colours/i);
    console.log(b.slice(idx, idx + 400));
  });
});