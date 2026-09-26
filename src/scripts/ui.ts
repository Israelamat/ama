// Sin imports ni exports, TypeScript trata este archivo como script global y sus
// `const` de primer nivel colisionan con los de `motion.ts`. Lo declaramos módulo.
export {};

const SHOP_ORIGIN = 'https://amaartesana.com';
const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const menu = document.querySelector<HTMLElement>('[data-menu]');
const menuToggle = document.querySelector<HTMLButtonElement>('[data-menu-toggle]');
const menuLinks = Array.from(menu?.querySelectorAll<HTMLAnchorElement>('[data-menu-link]') ?? []);

let menuOpen = false;
let restoreFocusTo: HTMLElement | null = null;

/**
 * Antes: abrir el menú no bloqueaba el scroll, no había `overflow-y` (con el
 * menú en `100svh` los últimos enlaces quedaban inalcanzables en pantallas
 * cortas), los enlaces ancla no lo cerraban y el botón de aria-label se quedaba
 * en "Abrir menú" para siempre.
 */
const setMenu = (open: boolean) => {
  if (!menu || !menuToggle || open === menuOpen) return;
  menuOpen = open;

  menu.classList.toggle('is-open', open);
  menuToggle.setAttribute('aria-expanded', String(open));
  const label = menuToggle.querySelector('.sr-only');
  if (label) label.textContent = open ? 'Cerrar menú' : 'Abrir menú';
  document.body.classList.toggle('is-transitioning', open);

  // `inert` mantiene el menú fuera del orden de tabulación mientras está oculto
  // y, además, oculta su contenido de los lectores de pantalla.
  menu.toggleAttribute('inert', !open);
  menu.setAttribute('aria-hidden', String(!open));

  if (open) {
    restoreFocusTo = document.activeElement as HTMLElement | null;
    // El primer enlace, no el propio toggle: así Escape devuelve el foco allí
    // y el siguiente Tab recorre el menú hacia adelante.
    menuLinks[0]?.focus({ preventScroll: true });
  } else if (restoreFocusTo) {
    restoreFocusTo.focus({ preventScroll: true });
    restoreFocusTo = null;
  }
};

const closeMenu = () => setMenu(false);

// El menú arranca cerrado y `inert` en el HTML, así que si el JS no llegara a
// ejecutarse el overlay no se queda flotando en medio de la página.

menuToggle?.addEventListener('click', () => setMenu(!menuOpen));

// Bug: al pulsar un enlace del menú, la navegación ancla lo dejaba abierto y el
// `pointer-events` del overlay bloqueaba la página entera.
menuLinks.forEach((link) => link.addEventListener('click', closeMenu));

menu
  ?.querySelectorAll<HTMLAnchorElement>('[data-shop-link]')
  .forEach((link) => link.addEventListener('click', closeMenu));

document.addEventListener('keydown', (event) => {
  if (!menuOpen) return;

  if (event.key === 'Escape') {
    closeMenu();
    return;
  }

  // Trampa de foco: con el menú abierto el tabulador no debe salirse al header.
  if (event.key !== 'Tab') return;

  const focusables = [menuToggle!, ...menuLinks];
  const first = focusables[0]!;
  const last = focusables[focusables.length - 1]!;
  const active = document.activeElement;

  if (event.shiftKey && (active === first || !menu!.contains(active))) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && active === last) {
    event.preventDefault();
    first.focus();
  }
});

document.addEventListener('click', (event) => {
  if (!menuOpen) return;
  const target = event.target as Node;
  if (menu!.contains(target) || menuToggle?.contains(target)) return;
  closeMenu();
});

/**
 * Antes había un listener global que hacía `preventDefault()` sobre todos los
 * `a[href^="#"]`. Eso rompía Ctrl/Cmd+click, "abrir en pestaña nueva" y el
 * offset dependía de `header.offsetHeight` medido en el momento del click. Ahora
 * no hace falta: `scroll-margin-top` en global.css y scroll nativo.
 */

const shopLinks = Array.from(document.querySelectorAll<HTMLAnchorElement>('[data-shop-link]'));
const shopLabels = Array.from(document.querySelectorAll<HTMLElement>('[data-shop-label]'));
const prefetched = new Set<string>();

const prefetch = (url: string) => {
  if (prefetched.has(url) || !url.startsWith(SHOP_ORIGIN)) return;
  prefetched.add(url);
  const link = document.createElement('link');
  link.rel = 'prefetch';
  link.as = 'document';
  link.href = url;
  document.head.append(link);
};

const preconnectShopify = () => {
  if (document.querySelector('link[data-shopify-preconnect]')) return;
  const link = document.createElement('link');
  link.rel = 'preconnect';
  link.href = 'https://cdn.shopify.com';
  link.crossOrigin = 'anonymous';
  link.dataset.shopifyPreconnect = 'true';
  document.head.append(link);
};

shopLinks.forEach((link) => {
  const warm = () => {
    preconnectShopify();
    prefetch(link.href);
  };

  // `pointerenter` no se dispara al tabular, por eso el `focus` va aparte.
  link.addEventListener('pointerenter', warm);
  link.addEventListener('focus', warm);

  link.addEventListener('click', (event) => {
    // Respetar siempre los clics "modificados": abrir en pestaña nueva o
    // descargar no deben pasar por nuestro overlay.
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0)
      return;
    if (!link.href.startsWith(SHOP_ORIGIN)) return;

    event.preventDefault();
    warm();
    sessionStorage.setItem('ama:handoff', '1');
    document.body.classList.add('is-transitioning');

    const overlay = document.querySelector<HTMLElement>('[data-handoff]');
    overlay?.classList.add('is-active');

    window.setTimeout(() => (window.location.href = link.href), prefersReduced ? 120 : 520);
  });
});

try {
  if (sessionStorage.getItem('ama:handoff') === '1') {
    shopLabels.forEach((label) => (label.textContent = 'Volver a la tienda'));
  }
} catch {
  /* modo privado: sin overlay ni cambio de etiqueta, la navegación es normal */
} finally {
  try {
    sessionStorage.removeItem('ama:handoff');
  } catch {
    /* sin storage disponible */
  }
}

/**
 * Antes: `mode: 'no-cors'` hacia un endpoint de Shopify. Con `no-cors` la
 * respuesta es opaca, así que `fetch` nunca podía fallar: el formulario siempre
 * decía "¡Gracias!" aunque el alta no se hubiera hecho, y el texto legal de
 *Privacy se pisaba con el mensaje de éxito.
 *
 * Ahora: CORS simple (form-urlencoded + POST) y comprobación de `response.ok`,
 * con el aviso legal en su propio nodo para que ningún estado lo sobrescriba.
 */
const newsletter = document.querySelector<HTMLFormElement>('[data-newsletter]');

newsletter?.addEventListener('submit', (event) => {
  event.preventDefault();

  const status = newsletter.querySelector<HTMLElement>('[data-newsletter-status]');
  const submit = newsletter.querySelector<HTMLButtonElement>('[data-newsletter-submit]');
  const email = newsletter.querySelector<HTMLInputElement>('input[name="contact[email]"]');

  if (!email || !email.checkValidity()) {
    email?.reportValidity();
    return;
  }

  const say = (message: string, ok: boolean) => {
    if (!status) return;
    status.textContent = message;
    status.classList.toggle('text-teal', ok);
    status.classList.toggle('text-rose', !ok);
  };

  const body = new URLSearchParams(new FormData(newsletter) as unknown as Record<string, string>);
  body.set('form_type', 'customer');

  submit?.setAttribute('disabled', 'true');
  say('Dando de alta tu suscripción…', true);

  fetch(newsletter.action, {
    method: 'POST',
    credentials: 'omit',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })
    .then((response) => {
      if (!response.ok) throw new Error(String(response.status));
      say(
        '¡Gracias! Revisa tu correo para confirmar la suscripción (mira también la carpeta de spam).',
        true,
      );
      newsletter.reset();
    })
    .catch(() => {
      say('No hemos podido completar la suscripción. Escríbenos y la activamos nosotros.', false);
    })
    .finally(() => submit?.removeAttribute('disabled'));
});

const mapButton = document.querySelector<HTMLButtonElement>('[data-map-load]');
const mapFacade = document.querySelector<HTMLElement>('[data-map-facade]');

mapButton?.addEventListener('click', () => {
  if (!mapFacade) return;
  const iframe = document.createElement('iframe');
  iframe.src = mapButton.dataset.src ?? '';
  iframe.title = 'Mapa de la tienda en la Avenida de Elda 68, Petrer';
  iframe.loading = 'lazy';
  iframe.referrerPolicy = 'no-referrer-when-downgrade';
  iframe.className = 'h-full w-full border-0';
  iframe.setAttribute('allowfullscreen', '');
  mapFacade.replaceChildren(iframe);
});
