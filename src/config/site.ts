export const SITE_URL = process.env.SITE_URL ?? 'https://amaartesana.vercel.app';
export const SHOP = 'https://amaartesana.com';
export const CDN = 'https://amaartesana.com/cdn/shop';

/**
 * El proxy `/cdn/shop` de Shopify IGNORA `?width=` y `format=`: siempre devuelve
 * el original. El único mecanismo que redimensiona de verdad es el nombre de
 * archivo generado (`_NNNx`), que Shopify crea bajo demanda para cualquier ancho.
 * https://amaartesana.com/cdn/shop/files/x_800x.jpg
 */
const SIZED = /_(\d+)x(\.[a-z0-9]+)$/i;

export const cdn = (path: string, width: number): string => {
  const sized = SIZED.test(path)
    ? path.replace(SIZED, `_${width}x$2`)
    : path.replace(/(\.[a-z0-9]+)$/i, `_${width}x$1`);
  return `${CDN}/${sized}`;
};

export type Media = {
  /** Ruta en el CDN sin sufijo de tamaño ni `?width=`. */
  base: string;
  /** Ancho intrínseco del original, en px. Limita la escalera para no ampliar. */
  w: number;
  /** Alto intrínseco del original, en px. */
  h: number;
};

/**
 * Escalón único para tarjetas y aside. Importa que `sizes` sea *exacto*: con
 * `25vw` el navegador pedía 360 px y saltaba al escalón de 480 cuando la
 * tarjeta real mide 297 px. Y que la tarjeta destacada (614 px) y el aside del
 * bloque SEO local (527 px) caigan en el MISMO escalón: así el navegador
 * descarga la foto de herbolario una sola vez en lugar de dos.
 */
const CARD_STEPS = [240, 320, 480, 640, 960, 1280] as const;
const HERO_STEPS = [640, 1024, 1440, 2048] as const;

export const srcset = (m: Media, steps: readonly number[] = CARD_STEPS): string => {
  const widths = [...new Set([...steps.filter((w) => w < m.w), m.w])];
  return widths.map((w) => `${cdn(m.base, w)} ${w}w`).join(', ');
};

/**
 * Anchos reales de render, medidos sobre el `max-width: 78rem` (1248 px) de
 * `.wrap` con `gap-5` (20 px) y `gap-20` (80 px). Deducirlos a ojo con `vw`
 * hace que el navegador pida un escalón de más en casi todas las tarjetas.
 */
export const sizes = {
  /** grid de 4 columnas: (1248 − 3×20) / 4 */
  card: '(min-width: 1280px) 297px, (min-width: 640px) 50vw, 100vw',
  /** la destacada ocupa 2 columnas: 297×2 + 20 */
  cardFeatured: '(min-width: 1280px) 614px, (min-width: 640px) 50vw, 100vw',
  /** grid 1.1fr / 0.9fr con gap-20: (1248 − 80) × 0.9 / 2 */
  aside: '(min-width: 1024px) 527px, 100vw',
  /** grid de 3 columnas con gap-6 (24 px): (1248 − 2×24) / 3 */
  service: '(min-width: 1024px) 400px, 100vw',
} as const;

export const src = (m: Media): string => cdn(m.base, Math.min(m.w, 1000));

export const heroSteps = HERO_STEPS;

export const links = {
  catalogo: `${SHOP}/collections`,
  cursos: `${SHOP}/pages/cursos-talleres-terapias`,
  sobreNosotras: `${SHOP}/pages/sobre-nosotros`,
  contacto: `${SHOP}/pages/contacto`,
  newsletter: `${SHOP}/contact#ContactFooter`,
  busqueda: `${SHOP}/search`,
  carrito: `${SHOP}/cart`,
  mapas: 'https://www.google.com/maps/place/Av.+de+Elda,+68,+03610+Petrer,+Alicante',
  instagram: 'https://www.instagram.com/amaartesana',
  facebook: 'https://es-es.facebook.com/amaartesana8/',
  youtube: 'https://www.youtube.com/channel/UCsNZwmMu35rlipC5lWhI2DA',
  enviarCorreo: 'mailto:contactoamaartesana@gmail.com',
};

export const brand = {
  name: 'Ama arte-sana',
  claim: 'Estamos al cuidado de ti y de tus emociones',
  hero: 'Entra en nuestro pequeño pedacito de cielo',
  colors: {
    ink: '#190d0d',
    paper: '#f6f6f6',
    mint: '#5dd2b4',
    mintSoft: '#bdf2eb',
    teal: '#046b5c',
    rose: '#c80909',
  },
  /** Solo 4 pesos: Roboto 700 se eliminó, `--font-meta` usa 900 en todo. */
  fonts: {
    kalam:
      'https://amaartesana.com/cdn/fonts/kalam/kalam_n7.9d145e82c2f25f7b78520244aca4418b2ee7dc72.woff2',
    poppins500:
      'https://amaartesana.com/cdn/fonts/poppins/poppins_n5.ad5b4b72b59a00358afc706450c864c3c8323842.woff2',
    poppins700:
      'https://amaartesana.com/cdn/fonts/poppins/poppins_n7.56758dcf284489feb014a026f3727f2f20a54626.woff2',
    roboto900:
      'https://amaartesana.com/cdn/fonts/roboto/roboto_n9.0c184e6fa23f90226ecbf2340f41a7f829851913.woff2',
  },
  logo: `${CDN}/files/logo_ama_260x@2x.gif`,
  /** Intrínseco del GIF de cabecera: sin esto el `width`/`height` atribuidos
      inventaban una proporción 130/60 y el logo saltaba al cargar. */
  logoW: 520,
  logoH: 368,
  logoLarge: `${CDN}/files/logo_ama_1200x1200.gif`,
  heroImage: 'files/cloudy-sky-from-above.jpg',
  ogImage: cdn('files/cloudy-sky-from-above.jpg', 1200),
};

export const business = {
  name: 'Ama arte-sana',
  email: 'contactoamaartesana@gmail.com',
  /** Formato E.164 para `tel:` y schema; sin espacios ni paréntesis. */
  phone: '+34658552304',
  phoneDisplay: '658 55 23 04',
  priceMin: '10',
  freeShippingFrom: '80',
  address: {
    street: 'Avenida de Elda, 68',
    locality: 'Petrer',
    region: 'Alicante',
    regionCode: '03',
    postalCode: '03610',
    country: 'ES',
    countryName: 'España',
  },
  geo: { lat: 38.4832421, lng: -0.7830504 },
  mapBounds: '-0.803,38.473,-0.763,38.493',
  hours: [
    {
      days: 'Lunes a viernes',
      morning: '10:00 – 13:30',
      afternoon: '17:00 – 20:00',
    },
    { days: 'Sábado', morning: '10:30 – 13:30', afternoon: '' },
    { days: 'Domingo', morning: 'Cerrado', afternoon: '' },
  ],
  hoursSchema: [
    {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      opens: '10:00',
      closes: '13:30',
    },
    {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      opens: '17:00',
      closes: '20:00',
    },
    {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: 'Saturday',
      opens: '10:30',
      closes: '13:30',
    },
  ],
  paymentMethods: [
    'Visa',
    'Mastercard',
    'American Express',
    'Maestro',
    'PayPal',
    'Klarna',
    'Union Pay',
  ],
  areaServed: ['Petrer', 'Elda', 'Villena', 'Alicante', 'Caudete', 'Biar'],
};

export const heroMedia: Media = { base: brand.heroImage, w: 2048, h: 1152 };

export type Collection = {
  title: string;
  href: string;
  image: Media;
  alt: string;
  tagline: string;
  featured?: boolean;
};

export const collections: Collection[] = [
  {
    title: 'Herbolario y cosmética',
    href: `${SHOP}/collections/herbolario-y-cosmetica`,
    image: { base: 'collections/herbolario-ama.jpg', w: 768, h: 1024 },
    alt: 'Herbolario en Petrer con plantas medicinales, infusiones y cosmética natural',
    tagline: 'Plantas, infusiones y cosmética natural',
    featured: true,
  },
  {
    title: 'Inciensos y sahumerios',
    href: `${SHOP}/collections/inciensos`,
    image: { base: 'files/incienso-mineral-amaartesana.jpg', w: 1600, h: 1200 },
    alt: 'Incienso mineral y sahumerios en la tienda de productos naturales de Petrer',
    tagline: 'Purifica y armoniza tu espacio',
  },
  {
    title: 'Aceites esenciales',
    href: `${SHOP}/collections/aceites-esenciales-puros-100`,
    image: {
      base: 'collections/aceites-esenciales-terpenic-ama.jpg',
      w: 1600,
      h: 1600,
    },
    alt: 'Aceites esenciales puros al 100 por ciento en Ama arte-sana, Petrer',
    tagline: 'Puros, para aromas y difusores',
  },
  {
    title: 'Minerales y piedras',
    href: `${SHOP}/collections/minerales`,
    image: {
      base: 'collections/piedras-gemas-minerales-ama.jpg',
      w: 751,
      h: 604,
    },
    alt: 'Piedras, minerales, cuarzos y péndulos en el herbolario de Petrer',
    tagline: 'Cuarzos, ágatas y turmalinas',
  },
  {
    title: 'Cartas, tarot y oráculos',
    href: `${SHOP}/collections/cartas`,
    image: {
      base: 'collections/tarot-oraculo-cartas-kuan-yin-ama.jpg',
      w: 1600,
      h: 1200,
    },
    alt: 'Cartas de tarot, oráculos y libros en Ama arte-sana, Petrer',
    tagline: 'Para leer tu propio camino',
  },
  {
    title: 'Amuletos y esotérico',
    href: `${SHOP}/collections/amuletos`,
    image: {
      base: 'collections/cruz-ansada-amuletos-ama.jpg',
      w: 1706,
      h: 2048,
    },
    alt: 'Joyería, bisutería y amuletos esotéricos en la tienda de Petrer',
    tagline: 'Protección y compañía',
  },
  {
    title: 'Colonias espirituales',
    href: `${SHOP}/collections/colonias-espirituales`,
    image: {
      base: 'collections/colonias-espirituales-limpieza-ruda-agua-florida-ama.jpg',
      w: 707,
      h: 705,
    },
    alt: 'Colonias espirituales y perfumes de agua de Florida en Petrer',
    tagline: 'Aromas con intención',
  },
  {
    title: 'Decoración y hogar',
    href: `${SHOP}/collections/decoracion`,
    image: { base: 'collections/ama-decoracion-regalos.jpg', w: 1200, h: 1600 },
    alt: 'Decoración del hogar, velas y velones en Ama arte-sana',
    tagline: 'Un rincón de calma',
  },
];

/** Reutilizada en la sección SEO local y en la tarjeta destacada del catálogo. */
export const herbolarioMedia: Media = collections[0].image;

export type Service = {
  title: string;
  href: string;
  image?: Media;
  alt?: string;
  text: string;
  meta: string;
  cta: string;
};

export const services: Service[] = [
  {
    title: 'Constelaciones familiares',
    href: `${SHOP}/products/constelaciones-familiares-grupal`,
    image: {
      base: 'files/constelaciones-archivos-akasicos-ama-amaartesana.jpg',
      w: 384,
      h: 383,
    },
    alt: 'Constelaciones familiares grupales en Ama arte-sana, Petrer',
    text: 'Sesiones grupales para mirar lo que se repite en tu historia y devolverte la libertad de elegir.',
    meta: 'Grupal · Presencial',
    cta: 'Ver el servicio',
  },
  {
    title: 'Curso de tarot método Jenesis',
    href: `${SHOP}/products/curso-de-tarot-metodo-jenesis`,
    image: { base: 'files/cartel-tarot-jenesis-ama.jpg', w: 1024, h: 1449 },
    alt: 'Curso de tarot método Jenesis en Petrer',
    text: 'Aprende a leer las cartas con un método propio, para uso personal o si te dedicas a la terapia.',
    meta: 'Curso · Presencial',
    cta: 'Ver el curso',
  },
  {
    title: 'Masajes, reiki y flores de Bach',
    href: links.cursos,
    image: {
      base: 'products/relajacion-relax-masajes-esencias-aromaticas-velas-aceites-ama.jpg',
      w: 1600,
      h: 1000,
    },
    alt: 'Masajes, reiki y flores del Dr. Bach en Ama arte-sana, Petrer',
    text: 'Masaje, reiki, acupuntura y acompañamiento con flores del Dr. Bach para soltar lo que pesa.',
    meta: 'Terapias · A demanda',
    cta: 'Pedir información',
  },
];

export const values = [
  {
    title: 'Amor incondicional',
    text: 'Acompañamos sin juzgar, con tiempo para escuchar y con mimo a quien entra por primera vez.',
  },
  {
    title: 'Claridad y coherencia',
    text: 'Te explicamos qué es cada producto y por qué te puede servir. Sin humo y sin promesas imposibles.',
  },
  {
    title: 'Compromiso',
    text: 'Selección cuidada, precios claros y una tienda donde siempre puedes preguntar sin prisa.',
  },
];

export const faqs = [
  {
    q: '¿Dónde estáis exactamente?',
    a: 'Estamos en la Avenida de Elda 68, en Petrer (03610, Alicante). Puedes vernos en el mapa o pasar por la tienda, que está en pleno centro y muy cerca de Elda.',
  },
  {
    q: '¿Sois un herbolario en Petrer o en Elda?',
    a: 'Somos un herbolario y una herboristería en Petrer, y también un herbolario cerca de Elda: estamos a unos pocos kilómetros, porque Petrer y Elda son municipios contiguos. Venir de Elda a vernos es un paseo de pocos minutos.',
  },
  {
    q: '¿Qué productos naturales encontráis?',
    a: 'Plantas medicinales, infusiones naturales, suplementos, vitaminas, cosmética natural, productos ecológicos, productos de dietética, aceites esenciales, incienso, minerales, cartas de tarot, amuletos, velas y decoración del hogar.',
  },
  {
    q: '¿Me asesoráis para elegir productos?',
    a: 'Sí. En tienda te contamos para qué sirve cada referencia y te ayudamos a decidir sin agobios. La información es orientativa y no sustituye la consulta con un profesional sanitario.',
  },
  {
    q: '¿Vendéis productos de dietética?',
    a: 'Sí, tenemos una selección de productos de dietética y complementos. No prometemos adelgazar mágicamente: te ayudamos a elegir lo que encaja contigo y con tu día a día.',
  },
  {
    q: '¿Ofrecéis constelaciones, reiki o talleres?',
    a: 'Sí. Hacemos constelaciones familiares grupales, cursos y talleres de tarot y otras charlas, además de masajes, reiki, acupuntura y flores de Bach. De momento se realizan de forma presencial en la tienda.',
  },
  {
    q: '¿Puedo comprar online y cuánto cuesta el envío?',
    a: 'Puedes comprar online con tarjeta, PayPal o Klarna. El pedido mínimo es de 10 € y los portes son gratuitos a partir de 80 €.',
  },
  {
    q: '¿Cuáles son los horarios?',
    a: 'De lunes a viernes de 10:00 a 13:30 y de 17:00 a 20:00, y los sábados de 10:30 a 13:30. Los domingos cerrado.',
  },
];
