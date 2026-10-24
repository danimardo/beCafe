import { verificarCopia } from '#lib/server/copias';

// Comando `npm run copia:verificar -- <archivo.tar.gz>` (plan F8 D11, EV-070). Escribe solo totales en la salida del operador.
// La salida no es un registro técnico (XVI): no lleva nombres, correos ni importes por persona.
const linea = (texto: string) => process.stdout.write(`${texto}\n`);
const error = (texto: string) => process.stderr.write(`${texto}\n`);

const archivo = process.argv[2];
if (!archivo) {
	error('Uso: npm run copia:verificar -- <archivo.tar.gz>');
	process.exit(2);
}

let resultado;
try {
	resultado = await verificarCopia(archivo, 'drizzle/meta/_journal.json');
} catch {
	error('No se pudo leer la copia: el archivo no existe o no es una copia válida.');
	process.exit(1);
}
linea(`integridad: ${resultado.integridad}`);
linea(`migraciones: ${resultado.migracionesAplicadas} de ${resultado.migracionesEsperadas}`);
linea(`personas: ${resultado.usuarios}`);
const correcta = resultado.integridad === 'ok' && resultado.migracionesAplicadas === resultado.migracionesEsperadas;
linea(correcta ? 'copia correcta' : 'copia NO válida');
process.exit(correcta ? 0 : 1);
