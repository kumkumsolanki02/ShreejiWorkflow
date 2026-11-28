import { useEffect } from 'react';
import {
  DEFAULT_KEYWORDS,
  OG_IMAGE_PATH,
  SITE_NAME,
  SITE_URL,
  absoluteUrl,
  buildFaqJsonLd,
  buildManpowerServiceJsonLd,
  buildOrganizationJsonLd,
  buildSoftwareJsonLd,
  buildWebsiteJsonLd,
  type SeoPageConfig,
} from './siteConfig';

function upsertMeta(attr: 'name' | 'property', key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function upsertLink(rel: string, href: string, extra?: Record<string, string>) {
  const selector = `link[rel="${rel}"]${extra?.hreflang ? `[hreflang="${extra.hreflang}"]` : ''}`;
  let el = document.head.querySelector<HTMLLinkElement>(selector);
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
  if (extra) {
    for (const [k, v] of Object.entries(extra)) el.setAttribute(k, v);
  }
}

function upsertJsonLd(id: string, data: unknown) {
  let el = document.getElementById(id) as HTMLScriptElement | null;
  if (!el) {
    el = document.createElement('script');
    el.type = 'application/ld+json';
    el.id = id;
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify(data);
}

function removeJsonLd(id: string) {
  document.getElementById(id)?.remove();
}

type SeoHeadProps = SeoPageConfig & {
  includeBusinessSchema?: boolean;
  includeManpowerSchema?: boolean;
  includeFaqSchema?: boolean;
};

function SeoHead({
  title,
  description,
  path,
  keywords = DEFAULT_KEYWORDS,
  robots = 'index, follow',
  type = 'website',
  image = OG_IMAGE_PATH,
  includeBusinessSchema = false,
  includeManpowerSchema = false,
  includeFaqSchema = false,
}: SeoHeadProps) {
  useEffect(() => {
    const url = absoluteUrl(path);
    const imageUrl = image.startsWith('http') ? image : absoluteUrl(image);
    const fullTitle = title.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`;

    document.title = fullTitle;
    document.documentElement.lang = 'en-IN';

    upsertMeta('name', 'description', description);
    upsertMeta('name', 'keywords', keywords);
    upsertMeta('name', 'robots', robots);
    upsertMeta('name', 'googlebot', robots);
    upsertMeta('name', 'author', SITE_NAME);
    upsertMeta('name', 'application-name', SITE_NAME);
    upsertMeta('name', 'theme-color', '#4F46E5');
    upsertMeta('name', 'geo.region', 'IN');
    upsertMeta('name', 'geo.placename', 'India');
    upsertMeta('name', 'language', 'English');
    upsertMeta('name', 'coverage', 'India');
    upsertMeta('name', 'target', 'all');
    upsertMeta('name', 'audience', 'all');
    upsertMeta('name', 'HandheldFriendly', 'true');

    upsertMeta('property', 'og:type', type);
    upsertMeta('property', 'og:site_name', SITE_NAME);
    upsertMeta('property', 'og:title', fullTitle);
    upsertMeta('property', 'og:description', description);
    upsertMeta('property', 'og:url', url);
    upsertMeta('property', 'og:image', imageUrl);
    upsertMeta('property', 'og:locale', 'en_IN');
    upsertMeta('property', 'og:locale:alternate', 'hi_IN');

    upsertMeta('name', 'twitter:card', 'summary_large_image');
    upsertMeta('name', 'twitter:title', fullTitle);
    upsertMeta('name', 'twitter:description', description);
    upsertMeta('name', 'twitter:image', imageUrl);

    upsertLink('canonical', url);
    upsertLink('alternate', url, { hreflang: 'en-IN' });
    upsertLink('alternate', url, { hreflang: 'hi-IN' });
    upsertLink('alternate', url, { hreflang: 'x-default' });

    if (includeBusinessSchema) {
      upsertJsonLd('ld-organization', buildOrganizationJsonLd(SITE_URL));
      upsertJsonLd('ld-website', buildWebsiteJsonLd(SITE_URL));
      upsertJsonLd('ld-software', buildSoftwareJsonLd(SITE_URL));
    }

    if (includeManpowerSchema) {
      upsertJsonLd('ld-manpower-service', buildManpowerServiceJsonLd(SITE_URL));
    } else {
      removeJsonLd('ld-manpower-service');
    }

    if (includeFaqSchema) {
      upsertJsonLd('ld-faq', buildFaqJsonLd());
    } else {
      removeJsonLd('ld-faq');
    }
  }, [
    title,
    description,
    path,
    keywords,
    robots,
    type,
    image,
    includeBusinessSchema,
    includeManpowerSchema,
    includeFaqSchema,
  ]);

  return null;
}

export default SeoHead;
