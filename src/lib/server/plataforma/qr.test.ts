import { describe, expect, it } from 'vitest';
import { qrSvg } from './qr';

describe('qrSvg', () => {
	it('CA-189: dibuja el enlace de visitante como SVG escalable', () => {
		const svg = qrSvg('https://becafe.example/visita/abc');
		expect(svg.startsWith('<svg')).toBe(true);
		expect(svg).toContain('viewBox=');
		expect(svg).not.toMatch(/<svg[^>]*\swidth=/);
	});

	it('CA-189: dos enlaces distintos dan QR distintos', () => {
		expect(qrSvg('https://becafe.example/visita/a')).not.toBe(qrSvg('https://becafe.example/visita/b'));
	});
});
