import fs from 'fs';
import path from 'path';
import protobuf from 'protobufjs';
import { fileURLToPath } from 'url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const cfg = JSON.parse(fs.readFileSync(path.join(ROOT, 'tools/tibia-client.local.json'), 'utf8'));
const cat = JSON.parse(fs.readFileSync(path.join(cfg.clientRoot, 'assets/catalog-content.json'), 'utf8'));
const ap = cat.find((e) => e.type === 'appearances');
const apPath = path.join(cfg.clientRoot, 'assets', ap.file);

const root = await protobuf.load(path.join(ROOT, 'tools/vendor/appearances.proto'));
const T = root.lookupType('Canary.protobuf.appearances.Appearances');
const msg = T.decode(fs.readFileSync(apPath));

for (const id of [1927, 1928, 1929, 81, 1029, 27, 28, 131]) {
  const o = msg.outfit.find((x) => x.id === id);
  if (!o) {
    console.log(id, 'missing');
    continue;
  }
  const fg = o.frameGroup || o.frame_group || [];
  const si0 = fg[0] && (fg[0].spriteInfo || fg[0].sprite_info);
  const si1 = fg[1] && (fg[1].spriteInfo || fg[1].sprite_info);
  console.log(id, {
    layers0: si0 && si0.layers,
    w0: si0 && (si0.patternWidth ?? si0.pattern_width),
    h0: si0 && (si0.patternHeight ?? si0.pattern_height),
    w1: si1 && (si1.patternWidth ?? si1.pattern_width),
    colors: o.colors || o.colours
  });
}