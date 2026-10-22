export function initials(name: string): string {
	const partes = name.trim().split(/\s+/).filter(Boolean);
	const inicial = (palabra: string | undefined) => palabra?.charAt(0) ?? '';
	return (inicial(partes[0]) + (partes.length > 1 ? inicial(partes[partes.length - 1]) : '')).toUpperCase();
}
