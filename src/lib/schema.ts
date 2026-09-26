import { SITE_URL, business, brand, collections, faqs, links, services } from '../config/site';

/**
 * JSON-LD.
 *
 * Se quitó lo que Google no bonifica y que solo inflaba el HTML inline:
 * `hasOfferCatalog` con 8 `CollectionPage` anidadas y `makesOffer` con 3
 * `Service` completos (direcciones repetidas, `areaServed`, `availableAtOrFrom`)
 * sumaban ~6 KB. Se conserva el `@graph` con referencias por `@id`, que es lo
 * que sí recomienda la documentación de schema.org para entidades relacionadas.
 */

const org = {
  '@type': 'Organization',
  '@id': `${SITE_URL}/#organizacion`,
  name: business.name,
  url: SITE_URL,
  logo: { '@type': 'ImageObject', url: brand.logoLarge },
  image: brand.ogImage,
  email: business.email,
  description: brand.claim,
  sameAs: [links.instagram, links.facebook, links.youtube],
};

const webSite = {
  '@type': 'WebSite',
  '@id': `${SITE_URL}/#web`,
  url: SITE_URL,
  name: `${business.name} · ${brand.claim}`,
  inLanguage: 'es-ES',
  publisher: { '@id': `${SITE_URL}/#organizacion` },
};

const localBusiness = {
  '@type': ['HealthAndBeautyBusiness', 'Store'],
  '@id': `${SITE_URL}/#negocio`,
  name: business.name,
  alternateName: ['Herbolario en Petrer', 'Herboristería en Petrer', 'Ama Arte Sana'],
  description:
    'Herbolario y herboristería en Petrer (Alicante): plantas medicinales, infusiones naturales, suplementos, vitaminas, cosmética natural, productos ecológicos y productos de dietética, además de incienso, minerales, tarot, amuletos y decoración del hogar. Tienda de productos naturales con envío a toda España.',
  url: SITE_URL,
  logo: brand.logoLarge,
  image: brand.ogImage,
  email: business.email,
  telephone: business.phone,
  contactPoint: [
    {
      '@type': 'ContactPoint',
      telephone: business.phone,
      contactType: 'customer service',
      areaServed: 'ES',
      availableLanguage: ['es'],
    },
  ],
  priceRange: '€€',
  currenciesAccepted: 'EUR',
  address: {
    '@type': 'PostalAddress',
    streetAddress: business.address.street,
    addressLocality: business.address.locality,
    addressRegion: business.address.region,
    addressCountry: business.address.country,
    postalCode: business.address.postalCode,
  },
  geo: {
    '@type': 'GeoCoordinates',
    latitude: business.geo.lat,
    longitude: business.geo.lng,
  },
  hasMap: links.mapas,
  openingHoursSpecification: business.hoursSchema,
  areaServed: business.areaServed.map((area) => ({
    '@type': 'City',
    name: area,
  })),
  parentOrganization: { '@id': `${SITE_URL}/#organizacion` },
  // `hasOfferCatalog` reducido a las cinco colecciones del footer, que son las que
  // la landing enlaza como destino principal de tienda.
  hasOfferCatalog: {
    '@type': 'OfferCatalog',
    name: 'Catálogo de productos naturales y esotéricos',
    itemListElement: collections.slice(0, 5).map((collection, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'CollectionPage',
        name: collection.title,
        url: collection.href,
        isPartOf: { '@id': `${SITE_URL}/#web` },
      },
    })),
  },
  makesOffer: services
    .filter((service) => service.image)
    .map((service, index) => ({
      '@type': 'Offer',
      position: index + 1,
      itemOffered: {
        '@type': 'Service',
        name: service.title,
        description: service.text,
        url: service.href,
        provider: { '@id': `${SITE_URL}/#negocio` },
        areaServed: { '@type': 'City', name: 'Petrer' },
      },
    })),
};

const faqPage = {
  '@type': 'FAQPage',
  '@id': `${SITE_URL}/#faq`,
  mainEntity: faqs.map((faq) => ({
    '@type': 'Question',
    name: faq.q,
    acceptedAnswer: { '@type': 'Answer', text: faq.a },
  })),
};

const webPage = {
  '@type': 'WebPage',
  '@id': `${SITE_URL}/#pagina`,
  url: SITE_URL,
  name: `Herbolario en Petrer · ${business.name}`,
  description: brand.claim,
  inLanguage: 'es-ES',
  isPartOf: { '@id': `${SITE_URL}/#web` },
  about: { '@id': `${SITE_URL}/#negocio` },
  primaryImageOfPage: {
    '@type': 'ImageObject',
    url: brand.ogImage,
    width: 1200,
    height: 675,
  },
  speakable: {
    '@type': 'SpeakableSpecification',
    cssSelector: ['#hero-title', '#local-title'],
  },
};

export const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [org, webSite, localBusiness, faqPage, webPage],
};
