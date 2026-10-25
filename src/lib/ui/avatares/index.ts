// Ilustraciones de un trazo del avatar sin foto (RF-222). El orden es el de `ilustracionAvatar`: no se reordena sin migrar el reparto.
import type { Component } from 'svelte';
import AvatarCapsula from './AvatarCapsula.svelte';
import AvatarCafetera from './AvatarCafetera.svelte';
import AvatarCruasan from './AvatarCruasan.svelte';
import AvatarCucharilla from './AvatarCucharilla.svelte';
import AvatarGrano from './AvatarGrano.svelte';
import AvatarMolinillo from './AvatarMolinillo.svelte';
import AvatarTaza from './AvatarTaza.svelte';
import AvatarVaso from './AvatarVaso.svelte';

export const ILUSTRACIONES: readonly Component[] = [
	AvatarTaza,
	AvatarCapsula,
	AvatarGrano,
	AvatarCafetera,
	AvatarMolinillo,
	AvatarVaso,
	AvatarCruasan,
	AvatarCucharilla,
];
