/** Central SEO & business identity for Shreeji Caretaker (All-India manpower). */

export const SITE_NAME = 'Shreeji Caretaker';
export const LEGAL_NAME = 'M/s. Shreeji Caretaker Company';
export const TAGLINE = 'Manage People · Track Progress · Build Tomorrow';

/** Live production origin. Override with VITE_SITE_URL if needed. */
export const SITE_URL = (
  (import.meta.env.VITE_SITE_URL as string | undefined) || 'https://shreejicaretaker.com'
).replace(/\/$/, '');

export const COMPANY = {
  legalName: LEGAL_NAME,
  shortName: SITE_NAME,
  phone: '+919784785808',
  phoneDisplay: '+91 97847 85808',
  email: 'shreejicaretaker2007@gmail.com',
  addressLine: 'N-33, Govind Nagar, R.H.B. Colony, Kankroli',
  city: 'Kankroli',
  district: 'Rajsamand',
  state: 'Rajasthan',
  postalCode: '313342',
  country: 'IN',
  countryName: 'India',
  fullAddress:
    'N-33, Govind Nagar, R.H.B. Colony, Kankroli, Distt. Rajsamand, Pin 313342, Rajasthan, India',
} as const;

export const DEFAULT_DESCRIPTION =
  'Shreeji Caretaker Company — All India manpower supply. We supply skilled & unskilled manpower across India for factories, sites, offices and facilities. Call +91 97847 85808.';

export const DEFAULT_KEYWORDS = [
  'manpower supply',
  'manpower supply India',
  'all India manpower supply',
  'manpower supply company India',
  'manpower supplier India',
  'best manpower supply company',
  'pan India manpower supply',
  'manpower agency India',
  'manpower contractor India',
  'industrial manpower supply',
  'factory manpower supply',
  'skilled unskilled manpower supply',
  'contract manpower supply',
  'caretaker manpower supply',
  'workforce supply India',
  'मैनपावर सप्लाई',
  'ऑल इंडिया मैनपावर सप्लाई',
  'मैनपावर सप्लाई कंपनी',
  'पूरे भारत में मैनपावर सप्लाई',
  'Shreeji Caretaker',
  'Shreeji Caretaker Company',
  'श्रीजी केयरटेकर',
].join(', ');

export const OG_IMAGE_PATH = '/og-image.png';

export function absoluteUrl(path = '/'): string {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${SITE_URL}${normalized}`;
}

export type SeoPageConfig = {
  title: string;
  description: string;
  path: string;
  keywords?: string;
  robots?: string;
  type?: 'website' | 'article';
  image?: string;
};

export const SEO_PAGES = {
  home: {
    title: 'Reliable Manpower. Stronger Business. | Shreeji Caretaker Manpower Solutions',
    description: DEFAULT_DESCRIPTION,
    path: '/',
    keywords: DEFAULT_KEYWORDS,
    robots: 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',
  },
  manpower: {
    title: 'Manpower Supply Across All India | Shreeji Caretaker Company',
    description:
      'Shreeji Caretaker works in manpower supply across all India — skilled & unskilled workers for factories, construction, offices and facilities. Get manpower anywhere in India. Call +91 97847 85808.',
    path: '/manpower-supply',
    keywords:
      'manpower supply all India, manpower supply across India, pan India manpower supply, hire manpower India, मैनपावर सप्लाई पूरे भारत, ऑल इंडिया मैनपावर',
    robots: 'index, follow',
  },
  services: {
    title: 'All India Manpower Supply Services | Shreeji Caretaker',
    description:
      'Manpower supply services across India — contract workers, caretaker manpower, industrial & site workforce. Shreeji Caretaker delivers reliable manpower wherever you need it.',
    path: '/services',
    keywords:
      'manpower supply services India, all India manpower services, contract manpower, industrial manpower, caretaker manpower supply',
    robots: 'index, follow',
  },
  about: {
    title: 'About Shreeji Caretaker | All India Manpower Supply Company',
    description:
      'M/s. Shreeji Caretaker Company works in manpower supply across all India. Head office: Kankroli, Rajsamand, Rajasthan. Reliable workforce for organizations nationwide.',
    path: '/about',
    keywords:
      'about Shreeji Caretaker, all India manpower supply company, manpower supplier Rajasthan, Shreeji manpower',
    robots: 'index, follow',
  },
  contact: {
    title: 'Contact All India Manpower Supply | Shreeji Caretaker',
    description:
      'Need manpower supply anywhere in India? Call +91 97847 85808 or email shreejicaretaker2007@gmail.com. Office: Kankroli, Rajsamand, Rajasthan 313342.',
    path: '/contact',
    keywords:
      'manpower supply contact India, all India manpower contact, Shreeji Caretaker phone, hire manpower contact',
    robots: 'index, follow',
  },
  login: {
    title: 'Sign In | Shreeji Caretaker Workflow',
    description:
      'Secure sign-in to Shreeji Caretaker Workflow — manage employees, attendance, payroll, invoices and organization operations.',
    path: '/login',
    keywords: 'Shreeji Caretaker login, HR workflow login',
    robots: 'index, follow',
  },
  forgotPassword: {
    title: 'Forgot Password | Shreeji Caretaker',
    description: 'Reset your Shreeji Caretaker Workflow account password.',
    path: '/forgot-password',
    robots: 'noindex, nofollow',
  },
  resetPassword: {
    title: 'Reset Password | Shreeji Caretaker',
    description: 'Choose a new password for your Shreeji Caretaker Workflow account.',
    path: '/reset-password',
    robots: 'noindex, nofollow',
  },
  adminDashboard: {
    title: 'Admin Dashboard | Shreeji Caretaker',
    description: 'Private admin workspace for Shreeji Caretaker Workflow.',
    path: '/admin/dashboard',
    robots: 'noindex, nofollow',
  },
  orgDashboard: {
    title: 'Organization Dashboard | Shreeji Caretaker',
    description: 'Private organization workspace for Shreeji Caretaker Workflow.',
    path: '/organization/dashboard',
    robots: 'noindex, nofollow',
  },
} as const satisfies Record<string, SeoPageConfig>;

const INDIA_CITIES = [
  'Delhi',
  'Mumbai',
  'Bengaluru',
  'Hyderabad',
  'Chennai',
  'Kolkata',
  'Pune',
  'Ahmedabad',
  'Jaipur',
  'Surat',
  'Udaipur',
  'Kankroli',
  'Rajsamand',
] as const;

export function buildOrganizationJsonLd(origin?: string) {
  const base = origin || SITE_URL;
  return {
    '@context': 'https://schema.org',
    '@type': ['Organization', 'LocalBusiness', 'EmploymentAgency', 'ProfessionalService'],
    '@id': `${base}/#organization`,
    name: LEGAL_NAME,
    alternateName: [
      SITE_NAME,
      'श्रीजी केयरटेकर कंपनी',
      'Shreeji Workflow',
      'Shreeji Manpower Supply',
      'Shreeji Labour Supply',
    ],
    description: DEFAULT_DESCRIPTION,
    url: base,
    email: COMPANY.email,
    telephone: COMPANY.phone,
    image: `${base}${OG_IMAGE_PATH}`,
    logo: `${base}/favicon.svg`,
    address: {
      '@type': 'PostalAddress',
      streetAddress: COMPANY.addressLine,
      addressLocality: COMPANY.city,
      addressRegion: COMPANY.state,
      postalCode: COMPANY.postalCode,
      addressCountry: COMPANY.country,
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: 25.0711,
      longitude: 73.8798,
    },
    areaServed: [
      { '@type': 'Country', name: 'India' },
      ...INDIA_CITIES.map((name) => ({ '@type': 'City', name })),
    ],
    contactPoint: [
      {
        '@type': 'ContactPoint',
        telephone: COMPANY.phone,
        contactType: 'sales',
        areaServed: 'IN',
        availableLanguage: ['en', 'hi'],
      },
      {
        '@type': 'ContactPoint',
        telephone: COMPANY.phone,
        contactType: 'customer service',
        areaServed: 'IN',
        availableLanguage: ['en', 'hi'],
      },
    ],
    knowsAbout: [
      'All India manpower supply',
      'Manpower supply',
      'Contract manpower',
      'Skilled and unskilled manpower',
      'Industrial manpower supply',
      'Factory manpower supply',
      'Caretaker manpower supply',
      'Site workforce supply',
    ],
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'All India manpower supply',
      itemListElement: [
        { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'All India manpower supply' } },
        { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Skilled & unskilled manpower' } },
        { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Industrial & factory manpower' } },
        { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Site & construction manpower' } },
        { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Caretaker manpower supply' } },
      ],
    },
  };
}

export function buildWebsiteJsonLd(origin?: string) {
  const base = origin || SITE_URL;
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${base}/#website`,
    name: SITE_NAME,
    url: base,
    description: DEFAULT_DESCRIPTION,
    publisher: { '@id': `${base}/#organization` },
    inLanguage: ['en-IN', 'hi-IN'],
    potentialAction: {
      '@type': 'SearchAction',
      target: `${base}/manpower-supply`,
      'query-input': 'required name=search_term_string',
    },
  };
}

export function buildSoftwareJsonLd(origin?: string) {
  const base = origin || SITE_URL;
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Shreeji Workflow',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    description:
      'HR and workforce operations platform for manpower contractors — employees, attendance, payroll, documents and invoices.',
    url: base,
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'INR',
      description: 'Access via authorized Shreeji Caretaker accounts',
    },
    provider: { '@id': `${base}/#organization` },
  };
}

export function buildManpowerServiceJsonLd(origin?: string) {
  const base = origin || SITE_URL;
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    '@id': `${base}/manpower-supply#service`,
    name: 'All India Manpower Supply',
    serviceType: 'Manpower supply',
    provider: { '@id': `${base}/#organization` },
    areaServed: { '@type': 'Country', name: 'India' },
    description:
      'Shreeji Caretaker works in manpower supply across all India — skilled and unskilled manpower for factories, sites, offices and facilities nationwide.',
    url: `${base}/manpower-supply`,
    offers: {
      '@type': 'Offer',
      availability: 'https://schema.org/InStock',
      priceCurrency: 'INR',
      url: `${base}/contact`,
    },
  };
}

export function buildFaqJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'Does Shreeji Caretaker provide manpower supply across all India?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes. Shreeji Caretaker Company works in manpower supply across all India. We supply skilled and unskilled manpower for organizations, factories and sites nationwide. Call +91 97847 85808 or visit https://shreejicaretaker.com/manpower-supply',
        },
      },
      {
        '@type': 'Question',
        name: 'What is your main work?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Our main work is manpower supply across all India — providing reliable skilled and unskilled manpower wherever companies need workforce.',
        },
      },
      {
        '@type': 'Question',
        name: 'क्या श्रीजी केयरटेकर पूरे भारत में मैनपावर सप्लाई करती है?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'हाँ। श्रीजी केयरटेकर कंपनी का मुख्य काम पूरे भारत में मैनपावर सप्लाई करना है। संपर्क: +91 97847 85808',
        },
      },
      {
        '@type': 'Question',
        name: 'Which types of manpower do you supply?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'We supply skilled and unskilled manpower including industrial/factory workers, site manpower, helpers, caretaker manpower and other contract workforce as per requirement.',
        },
      },
    ],
  };
}
