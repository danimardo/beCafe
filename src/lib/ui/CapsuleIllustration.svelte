<script lang="ts">
	import { cn, estiloColorCapsula } from './utils';

	type Props = {
		/** Color del tipo: un token (`cap-lungo`) o un color propio `#rrggbb` (RF-001, RF-269). */
		color: string;
		class?: string;
	};
	let { color, class: className }: Props = $props();
	const id = $props.id();
</script>

<!-- Ilustración vectorial de cápsula en el estilo de Capsulito (cuerpo y cúpula del color del tipo, aro crema).
     Decorativa: el nombre del tipo siempre va como texto al lado. Misma figura que static/ilustraciones/capsula.svg. -->
<svg viewBox="0 0 100 100" aria-hidden="true" class={cn('block', className)} style="{estiloColorCapsula(color)};color:var(--cap-color)">
	<defs>
		<linearGradient id="{id}-b" x1="0" x2="1" y1="0" y2="0">
			<stop offset="0" stop-color="#fff" stop-opacity=".22" />
			<stop offset=".35" stop-color="#fff" stop-opacity="0" />
			<stop offset=".7" stop-color="#000" stop-opacity=".08" />
			<stop offset="1" stop-color="#000" stop-opacity=".32" />
		</linearGradient>
		<radialGradient id="{id}-d" cx=".35" cy=".25" r=".7">
			<stop offset="0" stop-color="#fff" stop-opacity=".55" />
			<stop offset=".45" stop-color="#fff" stop-opacity=".08" />
			<stop offset="1" stop-color="#000" stop-opacity=".18" />
		</radialGradient>
		<linearGradient id="{id}-r" x1="0" x2="0" y1="0" y2="1">
			<stop offset="0" stop-color="#fbf3e8" />
			<stop offset="1" stop-color="#dcc8b0" />
		</linearGradient>
	</defs>
	<ellipse cx="50" cy="94" rx="24" ry="3.5" fill="#000" opacity=".14" />
	<path d="M23 40 L77 40 L69.5 85 Q68.4 91 62 91 L38 91 Q31.6 91 30.5 85 Z" fill="currentColor" />
	<path d="M23 40 L77 40 L69.5 85 Q68.4 91 62 91 L38 91 Q31.6 91 30.5 85 Z" fill="url(#{id}-b)" />
	<path d="M31 46 L35 84" stroke="#fff" stroke-opacity=".35" stroke-width="3" stroke-linecap="round" />
	<path
		d="M23 40 L77 40 L69.5 85 Q68.4 91 62 91 L38 91 Q31.6 91 30.5 85 Z"
		fill="none"
		stroke="#000"
		stroke-opacity=".22"
		stroke-width="1.5"
	/>
	<path d="M19 33 Q19 9 50 9 Q81 9 81 33 Z" fill="currentColor" />
	<path d="M19 33 Q19 9 50 9 Q81 9 81 33 Z" fill="url(#{id}-d)" />
	<path d="M19 33 Q19 9 50 9 Q81 9 81 33" fill="none" stroke="#000" stroke-opacity=".22" stroke-width="1.5" />
	<rect x="13" y="30" width="74" height="13" rx="6.5" fill="url(#{id}-r)" />
	<rect x="13" y="30" width="74" height="13" rx="6.5" fill="none" stroke="#6b5343" stroke-opacity=".45" stroke-width="1.5" />
	<path d="M20 33.5 H62" stroke="#fff" stroke-opacity=".8" stroke-width="2" stroke-linecap="round" />
</svg>
