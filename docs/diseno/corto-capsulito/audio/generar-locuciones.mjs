// Genera las siete locuciones del guion aprobado con el generador por tandas del desarrollo paralelo.
// Mientras F11/F12 no esté integrado en esta rama, se toma la API pública del árbol principal sin modificarlo.
// Uso: Node 24 docs/diseno/corto-capsulito/audio/generar-locuciones.mjs [--plan]
import { existsSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const base = dirname(fileURLToPath(import.meta.url));
const worktree = resolve(base, '../../../..');
const main = '/Apps/beCafe';
const generator = await import(pathToFileURL(join(main, 'scripts/generar-voces.mjs')).href);
const salida = join(base, 'locuciones');
const crudos = join(worktree, '.local/corto-capsulito/voces-tandas', new Date().toISOString().replace(/[:.]/g, '-'));

// «beCafé» se escribe «Bicafé» en `textoVoz`: la primera sílaba se dice en inglés (plan.md §6).
const items = [
  { id: 'corto_01', texto: 'Buenos días, señora cafetera. Lo de siempre.', textoVoz: '[sleepy] Buenos días, señora cafetera. [cheerful] Lo de siempre.' },
  { id: 'corto_02', texto: 'Un momento. Según el papel, aquí hay cápsulas. Según mis ojos… hay aire.', textoVoz: '[surprised] Un momento. Según el papel, aquí hay cápsulas. Según mis ojos… [short pause] hay aire.' },
  { id: 'corto_03', texto: 'El misterio de los cafés invisibles. Se hacen, se disfrutan… y se olvidan de apuntar.', textoVoz: '[suspenseful] El misterio de los cafés invisibles. [cheerful] Se hacen, se disfrutan… y se olvidan de apuntar.' },
  { id: 'corto_04', texto: 'Nueva pista: un toque por cada café. Y ahora sí sabemos lo que queda.', textoVoz: '[excited] Nueva pista: un toque por cada café. Y ahora sí sabemos lo que queda.' },
  { id: 'corto_05', texto: 'Si quedan pocas, beCafé avisa. Cuando compramos, apuntamos las cajas.', textoVoz: '[cheerful] Si quedan pocas, Bicafé avisa. Cuando compramos, apuntamos las cajas.' },
  { id: 'corto_06', texto: 'Cada café va a tu saldo. El dinero de verdad entra en la hucha cuando aportas. Entendido, jefa.', textoVoz: '[cheerful] Cada café va a tu saldo. El dinero de verdad entra en la hucha cuando aportas. [chuckles] Entendido, jefa.' },
  { id: 'corto_07', texto: 'Menos arqueología de cajón. Más café. beCafé.', textoVoz: '[excited] Menos arqueología de cajón. Más café. Bicafé.' },
];

const prev = process.cwd();
process.chdir(main);
let envFile;
try { envFile = generator.cargarDotEnv(); } finally { process.chdir(prev); }
const apiKey = process.env.ELEVENLABS_API_KEY || envFile.ELEVENLABS_API_KEY;
const voiceId = process.env.ELEVENLABS_VOICE_ID || envFile.ELEVENLABS_VOICE_ID || generator.VOZ_POR_DEFECTO;
const pendientes = items.filter((item) => !existsSync(join(salida, `${item.id}.mp3`)) || !existsSync(join(salida, `${item.id}.json`)));
const tandas = generator.agruparEnTandas(pendientes);
const caracteres = tandas.reduce((total, grupo) => total + generator.construirTanda(grupo).texto.length, 0);

process.stdout.write(`${pendientes.length} locuciones pendientes, ${tandas.length} tandas, ${caracteres} caracteres facturables antes de reintentos.\n`);
if (process.argv.includes('--plan')) process.exit(0);
if (!apiKey) throw new Error('Falta ELEVENLABS_API_KEY; no se ha llamado a la API.');
if (!generator.herramientasFfmpeg.disponible()) throw new Error('Falta ffmpeg; no se ha llamado a la API.');
mkdirSync(salida, { recursive: true });
const result = await generator.generarLocuciones(pendientes, { apiKey, voiceId }, {
  dirSalida: salida,
  dirCrudos: crudos,
  avisar: (line) => process.stdout.write(`${line}\n`),
});
if (result.error) throw new Error(result.error);
if (result.falladas.size) throw new Error(`Quedaron ${result.falladas.size} locuciones sin corte limpio.`);
process.stdout.write(`Generadas ${result.hechas.length} locuciones en ${salida}.\n`);
