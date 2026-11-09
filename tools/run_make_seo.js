/* Lanza tools/make_seo_pages.py con un Python real en Windows/Linux.
 *   node tools/run_make_seo.js
 * Ruta fija (opcional): tools/python.local.json → { "python": "C:\\\\..." }
 */
const fs = require('fs');
const path = require('path');
const { spawnSync, execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const SCRIPT = path.join(__dirname, 'make_seo_pages.py');
const LOCAL = path.join(__dirname, 'python.local.json');

function isStoreStub(exe) {
  const n = String(exe).replace(/\\/g, '/').toLowerCase();
  return n.includes('/windowsapps/') || n.endsWith('microsoft/python.exe');
}

function tryVersion(exe, args = ['--version']) {
  if (isStoreStub(exe)) return false;
  try {
    execFileSync(exe, args, { stdio: 'pipe', windowsHide: true });
    return true;
  } catch {
    return false;
  }
}

function candidates() {
  const list = [];
  if (process.env.POKESURVIVOR_PYTHON) list.push(process.env.POKESURVIVOR_PYTHON);
  try {
    const j = JSON.parse(fs.readFileSync(LOCAL, 'utf8'));
    if (j.python) list.push(j.python);
  } catch { /* ignore */ }
  if (process.platform === 'win32') {
    const home = process.env.USERPROFILE || process.env.HOME;
    const extra = [
      'C:\\pinokio\\bin\\miniconda\\python.exe',
      path.join(home, 'AppData', 'Local', 'Programs', 'Python', 'Python312', 'python.exe'),
      path.join(home, 'AppData', 'Local', 'Programs', 'Python', 'Python311', 'python.exe'),
      path.join(home, 'AppData', 'Local', 'Programs', 'Python', 'Python310', 'python.exe')
    ];
    for (const p of extra) if (p) list.push(p);
  }
  list.push('python3', 'python', 'py');
  return [...new Set(list)];
}

function resolve() {
  for (const c of candidates()) {
    if (c === 'py') {
      if (tryVersion('py', ['-3', '--version'])) return { exe: 'py', args: ['-3'] };
      continue;
    }
    if (tryVersion(c)) return { exe: c, args: [] };
  }
  return null;
}

const py = resolve();
if (!py) {
  console.error([
    'No se encontró Python para make_seo_pages.py.',
    '',
    'Opciones:',
    '  1) winget install Python.Python.3.12  (marca “Add to PATH” en el instalador)',
    '  2) Crea tools/python.local.json: { "python": "C:\\\\ruta\\\\python.exe" }',
    '  3) Variable de entorno POKESURVIVOR_PYTHON',
    '',
    'Luego: node tools/export_data.js && node tools/run_make_seo.js'
  ].join('\n'));
  process.exit(1);
}

const runArgs = [...py.args, SCRIPT];
const r = spawnSync(py.exe, runArgs, { cwd: ROOT, stdio: 'inherit', shell: false });
if (r.error) {
  console.error(r.error.message);
  process.exit(1);
}
process.exit(r.status == null ? 1 : r.status);
