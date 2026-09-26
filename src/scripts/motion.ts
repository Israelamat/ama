/**
 * Animación y scroll.
 *
 * Antes esto eran GSAP + ScrollTrigger + Lenis (~51,5 KB gzip). Todo lo que
 * hacían se resuelve aquí con `IntersectionObserver` y transiciones de CSS, que
 * además las declaramos en global.css para que no haya *layout thrash* en JS.
 *
 * Lo que se ha perdido a propósito: el scroll suave "inercial" de Lenis y el
 * parallax del hero. El primero lo reemplaza `scroll-behavior: smooth` nativo
 * (que además respeta Ctrl/Cmd+click y el botón atrás, cosa que el
 * `preventDefault` manual rompía), y el segundo cuesta más de lo que aporta en
 * una landing de una sola página.
 */

// Sin imports ni exports, TypeScript trata este archivo como script global y sus
// `const` de primer nivel colisionan con los de `ui.ts`. Lo declaramos módulo.
export {};

const header = document.querySelector<HTMLElement>('[data-header]');
const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Una sola observación para todos los elementos. El margen de raíz del 12 %
 * dispara el reveal antes de que el elemento entre del todo en pantalla, que es
 * lo que evita el "salto" al hacer scroll rápido.
 */
const revealTargets = document.querySelectorAll<HTMLElement>(
  '[data-reveal],[data-reveal-rule],[data-reveal-words]',
);

if (revealTargets.length) {
  if (prefersReduced || !('IntersectionObserver' in window)) {
    revealTargets.forEach((el) => el.classList.add('is-in'));
  } else {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add('is-in');
          observer.unobserve(entry.target);
        }
      },
      { rootMargin: '0px 0px -12% 0px', threshold: 0.01 },
    );
    revealTargets.forEach((el) => observer.observe(el));
  }
}

/**
 * Se usa un `rAF` con bandera en vez de un listener de scroll: así el trabajo
 * se agrupa en un solo fotograma en lugar de disparar en cada evento.
 */
let ticking = false;

const syncHeader = () => {
  ticking = false;
  header?.classList.toggle('is-scrolled', window.scrollY > 24);
};

window.addEventListener(
  'scroll',
  () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(syncHeader);
  },
  { passive: true },
);

syncHeader();

/**
 * Los marques llevan el contenido duplicado para poder desplazar -50%. Pausarlos fuera de
 * pantalla evita que dos animaciones CSS consuman compositor sin verse. Se
 * registra en `requestIdleCallback` para no competir con el parseo del HTML.
 */
const afterPaint = (fn: () => void) => {
  const idle = (window as Window & { requestIdleCallback?: (cb: () => void) => void })
    .requestIdleCallback;
  if (typeof idle === 'function') idle(fn);
  else globalThis.setTimeout(fn, 1);
};

afterPaint(() => {
  const marquees = document.querySelectorAll<HTMLElement>('.marquee');
  if (!marquees.length || !('IntersectionObserver' in window)) return;

  const pause = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        entry.target.classList.toggle('is-paused', !entry.isIntersecting);
      }
    },
    { threshold: 0 },
  );
  marquees.forEach((marquee) => pause.observe(marquee));
});
