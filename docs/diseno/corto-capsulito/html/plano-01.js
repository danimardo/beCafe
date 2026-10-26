// Plano 1 · «Buenos días, cafetera» (guion.md, plano 1). Capsulito llega andando con sueño, bosteza, saluda a
// la cafetera, que le responde, y abre el armario. Termina mirando el hueco del Ristretto, que enlaza con el plano 2.
import { BOCAS, andar, lerp, mezclarBocas, tramo } from './capsulito.js';
import { SUELO_ESCENA, pintarDecorado, tirador } from './decorado.js';
import { ESCALA, aTorso, montarPlano, parpadeo, pulso, vozEn } from './plano.js';

export const DURACION = 9.6;
/** La locución `corto_01` suena entera desde el segundo 2,9. */
const TRAMOS = [{ desde: 0, hasta: 4.83, en: 2.9 }];
const SUBTITULOS = [
  [3.55, 5.7, 'Buenos días, señora cafetera.'],
  [6.45, 7.75, 'Lo de siempre.'],
];

const plano = await montarPlano({ numero: '01', titulo: 'Buenos días, cafetera', duracion: DURACION, tramos: TRAMOS });
const { camara, decorado, capsulito } = plano;

/** Ángulo de la puerta: el tirón (hasta 25°), el giro libre con rebote y el reposo en 100°. */
function anguloPuerta(t) {
  if (t < 7.15) return 0;
  if (t < 7.45) return 25 * tramo(t, 7.15, 7.45);
  if (t < 7.9) return lerp(25, 112, 1 - (1 - (t - 7.45) / 0.45) ** 3);
  return lerp(112, 100, tramo(t, 7.9, 8.3));
}

/**
 * Cámara: encuadre con zoom anclado en el suelo. `foco` es la x de la escena que queda en el centro de la pantalla.
 * Acompaña a Capsulito y termina sobre el armario abierto.
 */
function camara_(t) {
  const zoom = lerp(1.25, 1.14, tramo(t, 7.6, 8.8));
  let foco = lerp(432, 520, tramo(t, 0.8, 3.0));
  foco = lerp(foco, 600, tramo(t, 5.8, 6.8));
  foco = lerp(foco, 588, tramo(t, 7.6, 8.8));
  return `translate(540 ${SUELO_ESCENA}) scale(${zoom}) translate(${-foco} ${-SUELO_ESCENA})`;
}

function estadoCapsulito(t) {
  // Paseo: velocidad constante y frenada en el último 20 %.
  const X0 = -170;
  const X1 = 377;
  const u = Math.min(Math.max((t - 0.2) / 2.7, 0), 1);
  const recorrido = u <= 0.8 ? u : 0.8 + (u - 0.8) - (u - 0.8) ** 2 / 0.4;
  let x = X0 + ((X1 - X0) * recorrido) / 0.9;
  const pesoPaso = u < 0.8 ? 1 : 1 - tramo(u, 0.8, 1);
  let paso = andar((x - X0) / ESCALA, { paso: 130, altura: 20, peso: pesoPaso });
  // Medio paso atrás con el tirón de la puerta.
  if (t > 7.4) {
    const atras = tramo(t, 7.4, 7.9);
    x -= 34 * atras;
    paso = andar((-34 * atras) / ESCALA, { paso: 130, altura: 18, peso: Math.sin(Math.PI * atras) });
  }

  const sueno = 1 - tramo(t, 2.9, 3.3);
  const bostezo = tramo(t, 1.0, 1.25) * (1 - tramo(t, 1.7, 2.0));

  // Inclinación del cuerpo según la acción.
  let incl = 3 * pesoPaso - 5 * bostezo;
  incl += -3 * tramo(t, 3.4, 3.7) * (1 - tramo(t, 5.3, 5.6));
  incl += 7 * tramo(t, 6.1, 6.6) * (1 - tramo(t, 7.15, 7.35));
  incl += -8 * tramo(t, 7.15, 7.35) * (1 - tramo(t, 7.6, 8.0));
  incl += 8 * tramo(t, 8.0, 8.4);
  const bob = paso.bob + 10 * pulso(t, 5.6, 0.25);

  // Ojos y cejas.
  const abiertos = lerp(0.55, 0.08, 1 - sueno);
  const cierre = Math.max(bostezo, parpadeo(t, [4.6, 7.95]));
  const p = Math.max(abiertos, cierre);
  let mirada = [0.45, 0.15];
  mirada = mirada.map((m, i) => lerp(m, [0.75, -0.75][i], tramo(t, 2.9, 3.2)));
  mirada = mirada.map((m, i) => lerp(m, [0.7, 0.55][i], tramo(t, 6.0, 6.3)));
  mirada = mirada.map((m, i) => lerp(m, [0.95, 0.25][i], tramo(t, 7.9, 8.2)));
  const asombro = tramo(t, 8.2, 8.45);
  const cejas = { subida: lerp(-10, 4, 1 - sueno) + 22 * asombro, giro: lerp(-8, 0, 1 - sueno) };

  // Boca: sueño y bostezo, la locución y el asombro final.
  let boca = mezclarBocas(BOCAS.sueno, BOCAS.bostezo, bostezo);
  boca = mezclarBocas(boca, BOCAS.sonrisa, tramo(t, 2.9, 3.3));
  if (vozEn(t, TRAMOS) !== null) boca = plano.boca(t, BOCAS.sonrisa);
  boca = mezclarBocas(boca, BOCAS.feliz, tramo(t, 5.45, 5.6) * (1 - tramo(t, 6.0, 6.3)));
  boca = mezclarBocas(boca, BOCAS.asombro, asombro);

  // Brazos. El derecho (detrás) saluda, agarra el tirador y lo suelta; el izquierdo se balancea y va a la cintura.
  const vaiven = paso.vaiven;
  const restoDer = [975 + vaiven * 40, 795];
  const saludo = [1000, 445];
  const enJarra = [352, 813];
  const restoIzq = [340 - vaiven * 45, 880];
  const tTirador = tirador(anguloPuerta(Math.min(t, 7.45)));
  const agarre = aTorso([tTirador.x, tTirador.y], x, incl, bob);
  const saludando = tramo(t, 3.4, 3.7) * (1 - tramo(t, 5.3, 5.7));
  const alcanzando = tramo(t, 6.1, 6.6) * (1 - tramo(t, 7.45, 7.8));
  let objetivoDer = restoDer.map((v, i) => lerp(v, saludo[i], saludando));
  objetivoDer = objetivoDer.map((v, i) => lerp(v, agarre[i], alcanzando));
  const ola = Math.sin(2 * Math.PI * 2.6 * (t - 3.4)) * 24 * saludando;
  const der = {
    ik: objetivoDer,
    signo: 1,
    mano: saludando > 0.3 ? 'abierta' : 'puno',
    giroMano: ola,
  };
  const izq = { ik: restoIzq.map((v, i) => lerp(v, enJarra[i], tramo(t, 2.7, 3.2))), signo: 1, mano: 'puno' };

  return {
    x,
    y: SUELO_ESCENA,
    escala: ESCALA,
    incl,
    bob,
    pies: paso.pies,
    brazos: { der, izq },
    parpados: [p, p],
    mirada,
    cejas,
    asombro,
    boca,
  };
}

function estadoDecorado(t) {
  return {
    puerta: anguloPuerta(t),
    led: tramo(t, 5.4, 5.5),
    rebote: t > 5.45 && t < 6.05 ? (t - 5.45) / 0.6 : 0,
    vapor: t > 5.6 && t < 7.2 ? (t - 5.6) / 1.6 : 0,
    reloj: t / 60,
    balanceo: Math.sin((t - 8.5) * 14) * 7 * (t > 8.5 ? Math.exp(-(t - 8.5) * 2.5) : 0),
  };
}

/** Pinta el fotograma del instante `t` (s). No depende de fotogramas anteriores. */
function render(t) {
  camara.setAttribute('transform', camara_(t));
  pintarDecorado(decorado, estadoDecorado(t));
  capsulito.pintar(estadoCapsulito(t));
  plano.ponerSubtitulo(t, SUBTITULOS);
}

plano.publicar(render);
