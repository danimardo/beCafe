// API pública de `catalogo`. La tabla no se exporta: los otros módulos usan estas funciones (ARCHITECTURE.md §4).
export {
	actualizarDescriptivos,
	borrarTipo,
	cambiarEstadoTipo,
	esConflictoNombre,
	insertarTipo,
	leerTipo,
	listarTipos,
	type DatosDescriptivos,
	type EstadoTipo,
	type FilaTipoCapsula,
} from './datos';
export { leerFotoCapsula } from './fotos';
