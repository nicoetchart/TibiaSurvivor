# Páginas SEO TibiaSurvivor (bestiario, guía, hechizos…). Redirects desde rutas legacy.
#   node tools/export_data.js && node tools/run_make_seo.js
# Son páginas de texto de verdad (el juego es un canvas que Google no puede leer)
# hechas con los datos del propio juego, y enlazan al juego. Genera:
#   es: guia/ bestiario/ legendarios/ tipos/ movimientos/ … + redirect pokedex/ shinies/
#   en: en/bestiary/ en/guide/ …
#   404.html, robots.txt, sitemap.xml (con las versiones de cada idioma)
import json, os, re, datetime, html

ROOT = os.path.join(os.path.dirname(__file__), '..')
_CFG = json.load(open(os.path.join(ROOT, 'tools', 'site-config.json'), encoding='utf-8'))
SITE = (os.environ.get('TIBIASURVIVOR_SITE_URL') or _CFG.get('siteUrl') or 'https://www.tibiasurvivor.com/').rstrip('/') + '/'
TODAY = datetime.date.today().isoformat()
D = json.load(open(os.path.join(ROOT, 'tools', 'cache', 'gamedata.json'), encoding='utf-8'))
esc = html.escape
BRAND = D.get('brand') or 'TibiaSurvivor'
REPO = 'https://github.com/nicoetchart/TibiaSurvivor'
CREATURES = D.get('creatures') or []
SPELLS = D.get('spells') or D.get('moves', [])
RUN_MIN = int(D.get('runDurationMin', 15))
N_CRE = len(CREATURES)
N_SPELL = len(SPELLS)
NA = len(D.get('achievements') or [])
DT = D.get('damageTypes') or {}
DTYPES = DT.get('all') or D.get('typeOrder') or []
DTN = DT.get('name') or D.get('typeName') or {}
DTC = DT.get('color') or D.get('typeColor') or {}
CHANGELOG_SEO = D.get('changelog') or []

# ---------------- traducción con el diccionario del juego ----------------
EN = D['en']
PATS = []
for k, v in EN.items():
    if '{x}' in k:
        parts = [re.escape(p) for p in k.split('{x}')]
        PATS.append((re.compile('^' + '(.+?)'.join(parts) + '$'), v))
def en(s):
    if s in EN: return EN[s]
    for rx, v in PATS:
        m = rx.match(s)
        if m:
            g = iter(m.groups())
            return re.sub(r'\{x\}', lambda _: en(next(g)), v)
    return s
def L(lang, es, eng=None):
    """Sitewide English copy (route lang is only for URL paths)."""
    return eng if eng is not None else en(es)

DT_EN = {'physical': 'Physical', 'fire': 'Fire', 'ice': 'Ice', 'energy': 'Energy', 'earth': 'Earth', 'death': 'Death', 'holy': 'Holy'}
def dtname(t, lang):
    return esc(DT_EN.get(t, t.replace('_', ' ').title()))
def dtbadge(t, lang): return f'<i class="ty" style="background:{DTC.get(t, "#888")}">{dtname(t, lang)}</i>'

# ---------------- rutas ----------------
PAGES = ['home', 'guide', 'bestiary', 'legends', 'types', 'moves', 'items', 'achievements', 'news', 'support']
PATH = {
    'es': {'home': '', 'guide': 'guia/', 'bestiary': 'bestiario/', 'legends': 'legendarios/', 'types': 'tipos/',
           'moves': 'movimientos/', 'items': 'objetos/', 'achievements': 'logros/', 'news': 'novedades/', 'support': 'apoyar/'},
    'en': {'home': 'en/', 'guide': 'en/guide/', 'bestiary': 'en/bestiary/', 'legends': 'en/legendaries/', 'types': 'en/types/',
           'moves': 'en/moves/', 'items': 'en/items/', 'achievements': 'en/achievements/', 'news': 'en/news/', 'support': 'en/support/'},
}
NAV = {'es': [('guide', 'Guide'), ('bestiary', 'Bestiary'), ('legends', 'Elite & boss'), ('moves', 'Spells'), ('types', 'Damage types')],
       'en': [('guide', 'Guide'), ('bestiary', 'Bestiary'), ('legends', 'Elite & boss'), ('moves', 'Spells'), ('types', 'Damage types')]}
FOOT = {'es': [('guide', 'Guide'), ('bestiary', 'Bestiary'), ('legends', 'Elite & final boss'), ('types', 'Damage types'),
               ('moves', 'Master Sorcerer spells'), ('items', 'Items'), ('achievements', 'Achievements & missions'), ('news', 'News'), ('support', 'Support the project')],
        'en': [('guide', 'Guide'), ('bestiary', 'Bestiary'), ('legends', 'Elite & final boss'), ('types', 'Damage types'),
               ('moves', 'Master Sorcerer spells'), ('items', 'Items'), ('achievements', 'Achievements & missions'), ('news', 'News'), ('support', 'Support the project')]}

def rel(frm, to):
    """Ruta relativa entre dos páginas (las dos son carpetas)."""
    up = '../' * frm.count('/')
    return up + to if (up + to) else './'

def page(pid, lang, title, desc, body, ld=None):
    me = PATH[lang][pid]
    up = '../' * me.count('/')
    alts = f'<link rel="alternate" hreflang="en" href="{SITE}{PATH["en"][pid]}">\n'
    alts += f'<link rel="alternate" hreflang="x-default" href="{SITE}{PATH["en"][pid]}">\n'
    nav = ''.join(f'<a href="{rel(me, PATH[lang][p])}">{esc(t)}</a>' for p, t in NAV['en'])
    foot = ' · '.join(f'<a href="{rel(me, PATH[lang][p])}">{esc(t)}</a>' for p, t in FOOT['en'])
    play = 'Play free'
    switch = ''
    legal = (f'{BRAND} is a <b>free</b> fan game inspired by classic hunting sessions, with Tibia-style creatures and art. '
             'It is not affiliated with CipSoft GmbH and is not an official Tibia product; names and setting belong to their respective owners. '
             'Sprites and icons per project sources · original or attributed music and sounds.')
    ldj = ('<script type="application/ld+json">\n' + json.dumps(ld, ensure_ascii=False) + '\n</script>') if ld else ''
    return f'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>{esc(title)}</title>
<meta name="description" content="{esc(desc)}">
<link rel="canonical" href="{SITE}{me}">
{alts}<meta name="theme-color" content="#12100e">
<meta property="og:type" content="website">
<meta property="og:site_name" content="{BRAND}">
<meta property="og:locale" content="en_US">
<meta property="og:url" content="{SITE}{me}">
<meta property="og:title" content="{esc(title)}">
<meta property="og:description" content="{esc(desc)}">
<meta property="og:image" content="{SITE}assets/og-image.jpg">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="{up}favicon.ico" sizes="any">
<link rel="icon" type="image/png" sizes="48x48" href="{up}assets/icons/icon-48.png">
<link rel="icon" type="image/png" sizes="96x96" href="{up}assets/icons/icon-96.png">
<link rel="icon" type="image/png" sizes="144x144" href="{up}assets/icons/icon-144.png">
<link rel="apple-touch-icon" href="{up}assets/icons/icon-180.png">
<link rel="stylesheet" href="{up}css/pages.css">
{ldj}
</head>
<body>
<header class="top">
  <a class="brand" href="{rel(me, PATH[lang]['home'])}">{BRAND}</a>
  <nav>{nav}{switch}<a class="play" href="{rel(me, PATH[lang]['home'])}">{play}</a></nav>
</header>
<main>
{body}
</main>
<footer>
  <p>{foot}</p>
  <p>{legal}</p>
  <p><a href="{REPO}">GitHub</a></p>
</footer>
</body>
</html>
'''

def write(pid, lang, html_):
    p = os.path.join(ROOT, PATH[lang][pid], 'index.html')
    os.makedirs(os.path.dirname(p), exist_ok=True)
    open(p, 'w', encoding='utf-8').write(html_)

def crumbs(pid, lang, name):
    return {'@type': 'BreadcrumbList', 'itemListElement': [
        {'@type': 'ListItem', 'position': 1, 'name': BRAND, 'item': SITE + PATH[lang]['home']},
        {'@type': 'ListItem', 'position': 2, 'name': name, 'item': SITE + PATH[lang][pid]}]}

def upof(pid, lang): return '../' * PATH[lang][pid].count('/')
def cta(pid, lang, text):
    return f'<p class="cta"><a class="btn" href="{rel(PATH[lang][pid], PATH[lang]["home"])}">{esc(text)}</a></p>'

# ================= guía =================
FAQ = {
 'es': [
  (f'¿{BRAND} es gratis?', f'Sí. Es un juego de fans en el navegador: sin descarga obligatoria y sin pagar por ventaja en partida. Puedes apoyar el proyecto con donaciones voluntarias (servidores y dominio).'),
  ('¿Hay que descargar algo?', 'No. Se juega en el navegador en PC, tablet o móvil (mejor en horizontal en pantallas pequeñas). Puedes añadirlo a la pantalla de inicio como app.'),
  ('¿Qué personaje uso?', f'En el MVP juegas como <b>Master Sorcerer</b>: hechizos de daño, auras y utilidad que eliges al subir de nivel, al estilo survivor.'),
  ('¿Cuánto dura una partida?', f'Cada run dura unos <b>{RUN_MIN} minutos</b>: hordas de criaturas, un centinela de élite y un jefe final si aguantas.'),
  (f'¿Cuántas criaturas hay?', f'En el bestiario del MVP hay <b>{N_CRE} criaturas</b> (orcos, no muertos, demonios…), cada una con debilidades de daño distintas.'),
  ('¿Qué son los tipos de daño?', 'Físico, fuego, hielo, energía, tierra, muerte y sagrado. Tus hechizos y los ataques enemigos usan estos tipos; las criaturas resisten o son débiles a algunos (ver la tabla de daño).'),
  ('¿Hay gacha o tickets en partida?', 'No en el MVP Tibia: el botín son monedas, experiencia y mejoras; sin gacha ni tickets en el menú neutral.'),
  ('¿Se guarda mi progreso?', 'Sí: monedas, mejoras permanentes, bestiario y misiones se guardan en el navegador (y en la nube si tienes cuenta). Una partida en curso no se interrumpe por actualizaciones.'),
  (f'¿Es un juego oficial de Tibia?', 'No. Es un fan game inspirado en la sensación de cazar en mazmorras; no está afiliado a CipSoft.')],
 'en': [
  (f'Is {BRAND} free?', f'Yes. It is a browser fan game: no mandatory download and no pay-to-win in a run. You can support the project with voluntary donations (servers and domain).'),
  ('Do I need to download anything?', 'No. Play in your browser on PC, tablet or phone (landscape works best on small screens). You can add it to your home screen as an app.'),
  ('Which character do I play?', f'In the MVP you are a <b>Master Sorcerer</b>: damage spells, auras and utility you pick on level-up, survivor-style.'),
  ('How long is a run?', f'Each run lasts about <b>{RUN_MIN} minutes</b>: creature hordes, an elite sentinel and a final boss if you last long enough.'),
  (f'How many creatures are there?', f'The MVP bestiary lists <b>{N_CRE} creatures</b> (orcs, undead, demons…), each with different damage weaknesses.'),
  ('What are damage types?', 'Physical, fire, ice, energy, earth, death and holy. Your spells and enemy attacks use these; creatures resist or are weak to some (see the damage chart).'),
  ('Is there gacha or tickets in a run?', 'Not in the Tibia MVP: floor loot is coins, XP and upgrades; neutral menu has no gacha or tickets.'),
  ('Is my progress saved?', 'Yes: coins, permanent upgrades, bestiary and missions are saved in the browser (and in the cloud with an account). A run in progress is not interrupted by updates.'),
  (f'Is this an official Tibia game?', 'No. It is a fan game inspired by dungeon hunting; it is not affiliated with CipSoft.')]}

def guide(lang):
    pid = 'guide'; me = PATH[lang][pid]
    lk = lambda p: rel(me, PATH[lang][p])
    fq = ''.join(f'<h3>{q}</h3><p>{a}</p>' for q, a in FAQ['en'])
    body = f'''<article class="doc">
<h1>{BRAND} guide</h1>
<p class="lead"><b>{BRAND}</b> is a pixel-art fantasy survivor in your browser: you play a <b>Master Sorcerer</b>,
roam an endless dungeon and your <a href="{lk('moves')}">spells</a> fire on their own while creature hordes close in.
Each run lasts about <b>{RUN_MIN} minutes</b> up to the final boss.</p>
{cta(pid, lang, 'Play free now')}
<h2>How to play</h2>
<ul>
<li><b>On PC:</b> <kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> or arrows to move. <kbd>1</kbd>–<kbd>4</kbd>, <kbd>Q</kbd>/<kbd>E</kbd> or HUD click to switch spells. <kbd>Esc</kbd> pauses.</li>
<li><b>On mobile (landscape):</b> drag to move; tap a spell icon to activate it.</li>
<li>The active spell <b>casts itself</b>; you dodge and position to avoid being surrounded.</li>
<li>Collect XP orbs, pick level-up cards and bind fused spells into one HUD slot.</li>
</ul>
<h2>MVP content</h2>
<ul class="feat">
<li><b>{N_CRE} creatures</b> in the <a href="{lk('bestiary')}">bestiary</a> (orcs, undead, demons…).</li>
<li><b>{N_SPELL} Master Sorcerer spells and passives</b> with Tibia-style icons.</li>
<li><a href="{lk('legends')}"><b>Elite sentinel</b></a> (Minotaur Guard) and <b>Demon</b> boss at the end of the run.</li>
<li><a href="{lk('types')}"><b>Damage types</b></a>: weaknesses and resistances per creature.</li>
<li>Coins, permanent upgrades, run <a href="{lk('items')}">items</a> and <a href="{lk('achievements')}">missions / achievements</a>.</li>
<li>Installable as an app from the browser.</li>
</ul>
<h2>Tips</h2>
<ol>
<li>Loop in wide circles so hordes line up for chain spells.</li>
<li>Check <a href="{lk('bestiary')}">bestiary</a> weaknesses and swap to the right element.</li>
<li>Step out of ground circles and lines: telegraphed enemy attacks.</li>
<li>Drop healers and shielders first (sentinel, ghouls…).</li>
<li>Spend coins on permanent upgrades between runs.</li>
</ol>
<h2>Frequently asked questions</h2>
{fq}
{cta(pid, lang, f'Play {BRAND}')}
</article>'''
    title = f'{BRAND} guide: how to play, tips and FAQ'
    desc = f'How to play {BRAND} on PC and mobile: Master Sorcerer, {N_CRE} creatures, spells, elite and boss in {RUN_MIN}-minute runs.'
    ld = {'@context': 'https://schema.org', '@graph': [
        {'@type': 'FAQPage', 'inLanguage': 'en', 'mainEntity': [{'@type': 'Question', 'name': q, 'acceptedAnswer': {'@type': 'Answer', 'text': re.sub(r'<[^>]+>', '', a)}} for q, a in FAQ['en']]},
        crumbs(pid, lang, 'Guide')]}
    write(pid, lang, page(pid, lang, title, desc, body, ld))

# ================= Bestiario =================
FAM_ES = {'humanoid': 'Humanoides', 'undead': 'No muertos', 'demon': 'Demonios', 'vermin': 'Vermin', 'magical': 'Mágicos'}
FAM_EN = {'humanoid': 'Humanoids', 'undead': 'Undead', 'demon': 'Demons', 'vermin': 'Vermin', 'magical': 'Magical'}

def creature_li(c, lang):
    role = c.get('role', 'enemy')
    tag = ''
    if role == 'elite':
        tag = f'<b class="leg">Elite</b>'
    elif role == 'boss':
        tag = f'<b class="leg">Boss</b>'
    wk = ''.join(dtbadge(t, lang) for t in (c.get('weaknesses') or [])[:4])
    desc = esc(c.get('description', ''))
    diff = esc(c.get('difficulty', ''))
    return (f'<li id="{esc(c["id"])}"><span class="nm">{esc(c["name"])}</span>'
            f'<span class="n">{diff}</span><span class="tys">{wk}</span>{tag}<p class="sm">{desc}</p></li>')

def bestiary_page(lang):
    pid = 'bestiary'
    fam_l = FAM_EN
    by_fam = {}
    for c in sorted(CREATURES, key=lambda x: x['name']):
        fam = fam_l.get(c.get('family', ''), c.get('family', 'Other'))
        by_fam.setdefault(fam, []).append(c)
    secs = []
    nav = []
    for fam, lst in sorted(by_fam.items(), key=lambda x: x[0].lower()):
        fid = re.sub(r'[^a-z0-9]+', '-', fam.lower()).strip('-')
        nav.append(f'<a href="#{fid}">{esc(fam)}</a>')
        secs.append(f'<section id="{fid}"><h2>{esc(fam)} <small>({len(lst)})</small></h2><ul class="dexgrid">{"".join(creature_li(c, lang) for c in lst)}</ul></section>')
    h1 = f'{BRAND} bestiary: {N_CRE} MVP creatures'
    lead = (f'Creatures that spawn in {BRAND} runs: damage weaknesses, family and behaviour notes. '
            f'Unlock entries by defeating them and read the in-game bestiary book.')
    c = 'Enter the dungeon'
    title = f'{BRAND} bestiary: {N_CRE} creatures and weaknesses'
    desc = f'All {N_CRE} MVP creatures in {BRAND} with weak damage types and descriptions. Free browser survivor.'
    crumb = 'Bestiary'
    body = f'<article class="doc wide"><h1>{esc(h1)}</h1><p class="lead">{esc(lead)}</p><nav class="gens">{"".join(nav)}</nav>{"".join(secs)}{cta(pid, lang, c)}</article>'
    ld = {'@context': 'https://schema.org', '@graph': [{'@type': 'CollectionPage', 'name': h1, 'url': SITE + PATH[lang][pid], 'inLanguage': 'en'}, crumbs(pid, lang, crumb)]}
    write(pid, lang, page(pid, lang, title, desc, body, ld))

# ================= élite y jefe final =================
def legends(lang):
    pid = 'legends'
    elites = [c for c in CREATURES if c.get('role') == 'elite']
    bosses = [c for c in CREATURES if c.get('role') == 'boss']
    el = ''.join(creature_li(c, lang) for c in elites)
    bo = ''.join(creature_li(c, lang) for c in bosses)
    h1 = f'Elite and final boss in {BRAND}'
    intro = (f'<p class="lead">In a typical <b>{RUN_MIN}-minute</b> run you meet an <b>elite sentinel</b> '
             f'and, if you last until the end, the session <b>boss</b>.</p>')
    h2a, h2b = 'Elite sentinels', 'Final run boss'
    tip = '<p>Use the right element (check the bestiary) and dodge telegraphed ground markers.</p>'
    title, desc, c = f'Elite and boss in {BRAND}', f'Elite sentinel and Demon boss in {RUN_MIN}-minute {BRAND} runs.', 'Survive to the boss'
    crumb = 'Elite & boss'
    body = f'<article class="doc wide"><h1>{esc(h1)}</h1>{intro}<h2>{h2a}</h2><ul class="dexgrid">{el or "<li>—</li>"}</ul>{tip}<h2>{h2b}</h2><ul class="dexgrid">{bo or "<li>—</li>"}</ul>{cta(pid, lang, c)}</article>'
    write(pid, lang, page(pid, lang, title, desc, body, {'@context': 'https://schema.org', '@graph': [crumbs(pid, lang, crumb)]}))

# ================= tipos de daño (Tibia MVP) =================
def types_page(lang):
    pid = 'types'
    cells = []
    for t in DTYPES:
        weak, res = '×1.25', '×0.70'
        cells.append(f'<tr><td>{dtbadge(t, lang)}</td><td>{weak}</td><td>{res}</td><td>×0</td></tr>')
    th = '<th>Type</th><th>Weak (takes)</th><th>Resists</th><th>Immune</th>'
    table = f'<div class="tablewrap"><table class="list"><thead><tr>{th}</tr></thead><tbody>{"".join(cells)}</tbody></table></div>'
    h1 = f'Damage types in {BRAND}'
    intro = ('<p class="lead">In the Tibia MVP, combat uses <b>elemental damage types</b> (physical, fire, ice, energy, earth, death, holy). '
             'Each creature lists weaknesses and resistances in the <b>bestiary</b>. Typical in-run values: '
             '<b>weak ×1.25</b>, <b>resist ×0.70</b>, <b>immune ×0</b> (no damage).</p>')
    legacy = '<p class="note">Legacy Pokémon type charts are not exported for SEO; only Tibia damage types apply in the MVP.</p>'
    title, desc, c = f'{BRAND} damage types (Tibia MVP)', f'Damage types in {BRAND}: weakness, resistance and immunity for spells and creatures.', 'Use the right element'
    crumb = 'Damage types'
    body = f'<article class="doc wide"><h1>{h1}</h1>{intro}{table}{legacy}{cta(pid, lang, c)}</article>'
    write(pid, lang, page(pid, lang, title, desc, body, {'@context': 'https://schema.org', '@graph': [crumbs(pid, lang, crumb)]}))

# ================= movimientos =================
KIND = {'es': {'projectile': 'Proyectil', 'melee': 'Cuerpo a cuerpo', 'beam': 'Rayo', 'orbit': 'Órbita', 'nova': 'Ráfaga', 'aura': 'Aura', 'buff': 'Mejora',
               'boomerang': 'Bumerán', 'chain': 'Cadena', 'mine': 'Minas', 'meteor': 'Meteoros', 'turret': 'Torreta', 'dash': 'Embestida',
               'trail': 'Rastro', 'cone': 'Abanico'},
        'en': {'projectile': 'Projectile', 'melee': 'Melee', 'beam': 'Beam', 'orbit': 'Orbit', 'nova': 'Burst', 'aura': 'Aura', 'buff': 'Buff',
               'boomerang': 'Boomerang', 'chain': 'Chain', 'mine': 'Mines', 'meteor': 'Meteors', 'turret': 'Turret', 'dash': 'Dash',
               'trail': 'Trail', 'cone': 'Spray'}}
def moves_page(lang):
    pid = 'moves'
    spell_types = sorted({s.get('type', 'energy') for s in SPELLS}, key=lambda x: (x not in DTYPES, x))
    rows = []
    for t in spell_types:
        for m in [x for x in SPELLS if x.get('type') == t]:
            inc = m.get('incantation') or ''
            inc_html = f'<small class="inc">{esc(inc)}</small>' if inc else ''
            rows.append(f'<tr><td><b>{esc(m["name"])}</b>{inc_html}</td><td>{dtbadge(t, lang)}</td>'
                        f'<td>{KIND["en"].get(m.get("kind"), m.get("kind", ""))}</td><td>{esc(m.get("desc", ""))}</td></tr>')
    th = '<th>Spell</th><th>Damage</th><th>Kind</th><th>What it does</th>'
    h1 = f'Master Sorcerer spells in {BRAND}'
    intro = (f'<p class="lead">The MVP has <b>{N_SPELL} spells and passives</b> for the Master Sorcerer. The active one casts itself; '
             f'on level-up you pick cards to learn, upgrade or <b>bind</b> spells into one HUD slot.</p>')
    title, desc, c = f'{BRAND} spells: Master Sorcerer list', f'All {N_SPELL} Master Sorcerer spells and passives in {BRAND}, by damage type.', 'Cast them in a run'
    crumb = 'Spells'
    body = f'<article class="doc wide"><h1>{h1}</h1>{intro}<div class="tablewrap"><table class="list"><thead><tr>{th}</tr></thead><tbody>{"".join(rows)}</tbody></table></div>{cta(pid, lang, c)}</article>'
    write(pid, lang, page(pid, lang, title, desc, body, {'@context': 'https://schema.org', '@graph': [crumbs(pid, lang, crumb)]}))

# ================= objetos =================
def items_page(lang):
    pid = 'items'
    rows = ''.join(f'<li><b>{esc(L(lang, i["name"]))}</b><span>{esc(L(lang, i["desc"]))}</span></li>' for i in D['items'])
    ni = len(D['items'])
    h1 = f'{BRAND} held items'
    intro = ('<p class="lead">During a run you can find <b>held items</b> in chests and by defeating elites or the boss. Only one at a time; lasts the whole run.</p>')
    title, desc, c = f'{BRAND} items: all {ni} held items', f'The {ni} held items in {BRAND} and what each one does.', 'Play free'
    body = f'<article class="doc"><h1>{h1}</h1>{intro}<ul class="items">{rows}</ul>{cta(pid, lang, c)}</article>'
    write(pid, lang, page(pid, lang, title, desc, body, {'@context': 'https://schema.org', '@graph': [crumbs(pid, lang, h1)]}))

# ================= logros =================
def ach_page(lang):
    pid = 'achievements'
    cats = D['achCats'] or []
    secs = []
    for cid, cname in cats:
        items = [a for a in D['achievements'] if a['cat'] == cid]
        if not items: continue
        li = ''.join('<li><b>' + esc(L(lang, a['name'])) + '</b><span>' + esc(L(lang, a['desc'])) + '</span>'
                     + ('<em>' + esc(L(lang, a['title'])) + '</em>' if a['title'] else '') + '</li>' for a in items)
        secs.append(f'<h2>{esc(L(lang, cname))} <small>({len(items)})</small></h2><ul class="items ach">{li}</ul>')
    na = len(D['achievements'])
    h1 = f'{BRAND} achievements and missions'
    intro = (f'<p class="lead">There are <b>{na} achievements</b> in game data (part legacy content, part general goals). '
             f'The Tibia MVP also has <b>Golden Goblet missions</b> in the menu. Achievements may grant medals, coins and profile titles.</p>'
             '<p>In italics, the title it unlocks.</p>')
    title, desc, c = f'{BRAND} achievements', f'List of the {na} achievements in {BRAND} plus menu missions.', 'Start unlocking them'
    body = f'<article class="doc wide"><h1>{h1}</h1>{intro}{"".join(secs)}{cta(pid, lang, c)}</article>'
    write(pid, lang, page(pid, lang, title, desc, body, {'@context': 'https://schema.org', '@graph': [crumbs(pid, lang, h1)]}))

# ================= novedades =================
def news(lang):
    pid = 'news'
    pool = CHANGELOG_SEO or []
    items = ''
    for e in pool:
        topic = e.get('topic', ['', ''])
        tit = topic[1] if isinstance(topic, (list, tuple)) and len(topic) > 1 else (topic[0] if topic else BRAND)
        txt = e.get('en', e.get('es', ''))
        items += f'<article class="news"><time datetime="{e["d"]}">{e["d"]}</time><h2>{esc(tit)}</h2><p>{esc(txt)}</p></article>'
    if not items:
        items = '<p class="lead">No changelog entries exported yet.</p>'
    h1 = f'{BRAND} news'
    title = h1 + ' · updates'
    desc = f'Latest {BRAND} changes (Tibia UI, spells, bestiary).'
    body = f'<div class="doc"><h1>{h1}</h1>{items}{cta(pid, lang, "Play free")}</div>'
    write(pid, lang, page(pid, lang, title, desc, body, {'@context': 'https://schema.org', '@graph': [crumbs(pid, lang, h1)]}))

# ================= apoyar el proyecto =================
def support(lang):
    pid = 'support'
    F = D['funding']
    val = lambda v: (f'€{v}/month' if isinstance(v, (int, float)) else esc(L(lang, v)))
    rows = ''.join(f'<tr><td>{esc(L(lang, c))}</td><td class="num">{val(v)}</td></tr>' for c, v in F['costs'])
    kofi = f'https://ko-fi.com/{F["kofi"]}' if F['kofi'] else ''
    spons = f'https://github.com/sponsors/{F["sponsors"]}' if F['sponsors'] else ''
    h1 = f'Support {BRAND}'
    btns = ''.join(x for x in [f'<a class="btn" href="{kofi}" rel="noopener">Donate on Ko-fi</a>' if kofi else '',
                               f'<a class="btn ghost" href="{spons}" rel="noopener">GitHub Sponsors</a>' if spons else ''])
    soon_donate = "You'll be able to donate from here very soon."
    body = f"""<article class="doc"><h1>{h1}</h1>
<p class="lead">{BRAND} is and will stay <b>free</b>: no ads, no purchases and no pay-to-win. If you enjoy it and want to help keep it online,
you can make a <b>voluntary donation</b>. <b>All the money goes to the servers and the domain</b>; anything left over is saved for the following months.</p>
<p>Donating gives no advantage in the game: everyone plays on equal terms.</p>
<h2>What it costs to run</h2>
<table class="list"><tbody>{rows}</tbody></table>
<p>The servers store saves and accounts, the leaderboards and group games: the more people play, the more they cost.</p>
<h2>How to support</h2>
<p>{btns or soon_donate}</p>
<p>Sharing the game with your friends, recommending it and reporting bugs helps a lot too, and it's free.</p>
{cta(pid, lang, 'Back to the game')}</article>"""
    title, desc = f'Support {BRAND}: donations', f'{BRAND} is free. Voluntary donations pay for servers and the domain.'
    write(pid, lang, page(pid, lang, title, desc, body, {'@context': 'https://schema.org', '@graph': [crumbs(pid, lang, h1)]}))

# ================= el juego en inglés (/en/) =================
def game_en():
    # Parte de dev.html (con lo de SEO) y usa el mismo app.min.js que index.html,
    # así sale bien aunque index.html se haya generado con --sin-seo.
    dev = open(os.path.join(ROOT, 'dev.html'), encoding='utf-8').read()
    idx = open(os.path.join(ROOT, 'index.html'), encoding='utf-8').read()
    app = re.search(r'<script defer src="js/app\.min\.js\?v=[^"]+"></script>', idx).group(0)
    a, b = dev.index('<!-- scripts:begin -->'), dev.index('<!-- scripts:end -->') + len('<!-- scripts:end -->')
    src = dev[:a] + app + dev[b:]
    src = re.sub(r'<!-- seo:(begin|end) -->\n?', '', src)
    src = re.sub(r'<meta name="robots" content="noindex">\s*', '', src)
    src = re.sub(r'<!-- dev\.html: página fuente[^>]*-->\n?', '', src)
    s = src.replace('<html lang="en"', '<html lang="en"')  # no-op; keep lang en
    s = s.replace('<head>\n<meta charset="utf-8">', '<head>\n<meta charset="utf-8">\n<base href="../">', 1)
    rep = [
        ('<link rel="canonical" href="./">', f'<link rel="canonical" href="{SITE}en/">'),
        ('<meta property="og:url" content="./">', f'<meta property="og:url" content="{SITE}en/">'),
    ]
    for a, b in rep:
        s = s.replace(a, b)
    # Enlaces a las páginas: las de inglés (legacy Pokémon si existen en el HTML).
    s = s.replace('href="guia/"', 'href="en/guide/"').replace('href="bestiario/"', 'href="en/bestiary/"')
    os.makedirs(os.path.join(ROOT, 'en'), exist_ok=True)
    open(os.path.join(ROOT, 'en', 'index.html'), 'w', encoding='utf-8').write(s)

# ================= 404, robots y sitemap =================
def extra():
    nf = '''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex"><title>404 · TibiaSurvivor</title><link rel="icon" href="/favicon.ico" sizes="any"><link rel="icon" type="image/png" sizes="48x48" href="/assets/icons/icon-48.png"><link rel="stylesheet" href="/css/pages.css"></head>
<body><header class="top"><a class="brand" href="/">TibiaSurvivor</a><nav><a href="/en/guide/">Guide</a><a class="play" href="/">Play free</a></nav></header>
<main><article class="doc center"><h1>404 · Lost in the dungeon</h1><p class="lead">This page doesn't exist. The hordes are still waiting…</p>
<p class="cta"><a class="btn" href="/">Back to the game</a></p></article></main></body></html>
'''
    open(os.path.join(ROOT, '404.html'), 'w', encoding='utf-8').write(nf)
    open(os.path.join(ROOT, 'robots.txt'), 'w', encoding='utf-8').write(f'# TibiaSurvivor\nUser-agent: *\nAllow: /\nDisallow: /tools/\nDisallow: /docs/\nDisallow: /dev.html\n\nSitemap: {SITE}sitemap.xml\n')
    PRI = {'home': '1.0', 'guide': '0.8', 'bestiary': '0.7', 'legends': '0.7', 'moves': '0.6', 'types': '0.6', 'achievements': '0.5', 'items': '0.5', 'news': '0.5', 'support': '0.4'}
    urls = []
    for pid in PAGES:
        for lang in ('es', 'en'):
            alts = f'<xhtml:link rel="alternate" hreflang="en" href="{SITE}{PATH["en"][pid]}"/>'
            alts += f'<xhtml:link rel="alternate" hreflang="x-default" href="{SITE}{PATH["en"][pid]}"/>'
            urls.append(f'  <url><loc>{SITE}{PATH[lang][pid]}</loc><lastmod>{TODAY}</lastmod><priority>{PRI[pid]}</priority>{alts}</url>\n')
    open(os.path.join(ROOT, 'sitemap.xml'), 'w', encoding='utf-8').write(
        '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n' + ''.join(urls) + '</urlset>\n')

def write_redirect(from_path, to_path, title):
    """Redirect estático GitHub Pages (rutas legacy)."""
    up = '../' * from_path.count('/')
    dest = SITE + to_path
    rel_href = up + to_path if from_path.count('/') else to_path
    html = f'''<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta http-equiv="refresh" content="0;url={rel_href}">
<link rel="canonical" href="{dest}">
<title>{esc(title)} · {BRAND}</title>
<meta name="robots" content="noindex,follow">
<link rel="stylesheet" href="{up}css/pages.css"></head>
<body><article class="doc center"><h1>Moved</h1><p><a href="{rel_href}">Continue to the {esc(title)}</a></p></article></body></html>
'''
    p = os.path.join(ROOT, from_path, 'index.html')
    os.makedirs(os.path.dirname(p), exist_ok=True)
    open(p, 'w', encoding='utf-8').write(html)

for lang in ('es', 'en'):
    guide(lang); bestiary_page(lang); legends(lang); types_page(lang); moves_page(lang); items_page(lang); ach_page(lang); news(lang); support(lang)
write_redirect('pokedex', PATH['es']['bestiary'], 'Bestiary')
write_redirect('en/pokedex', PATH['en']['bestiary'], 'Bestiary')
write_redirect('shinies', PATH['es']['bestiary'], 'Bestiary')
write_redirect('en/shinies', PATH['en']['bestiary'], 'Bestiary')
game_en(); extra()
print('ok:', 2 * (len(PAGES) - 1), 'páginas + en/ (juego en inglés), 404, robots, sitemap')
