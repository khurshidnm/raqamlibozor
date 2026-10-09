import type { Landing, Settings } from './content';
import type { NewsPost } from './news';

type JsonLd = Record<string, unknown>;

/** Organization node shared by every page; optional CMS fields are only emitted when filled in. */
export function organizationNode(settings: Settings, logoUrl: string): JsonLd {
  const { organization, seo } = settings;
  return {
    '@type': 'Organization',
    '@id': `${organization.url.replace(/\/$/, '')}/#organization`,
    name: organization.name,
    url: organization.url,
    logo: logoUrl,
    brand: { '@type': 'Brand', name: settings.siteName },
    ...(seo.socials.length ? { sameAs: seo.socials.map((s) => s.url) } : {}),
    ...(organization.email || organization.phone
      ? {
          contactPoint: {
            '@type': 'ContactPoint',
            contactType: 'sales',
            ...(organization.email ? { email: organization.email } : {}),
            ...(organization.phone ? { telephone: organization.phone } : {}),
          },
        }
      : {}),
  };
}

export function buildJsonLd(opts: {
  settings: Settings;
  landing: Landing;
  pageUrl: string;
  ogImageUrl: string;
  logoUrl: string;
}): JsonLd[] {
  const { settings, landing, pageUrl, ogImageUrl, logoUrl } = opts;
  const data = landing.data;
  return [
    { '@context': 'https://schema.org', ...organizationNode(settings, logoUrl) },
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: settings.siteName,
      url: settings.siteUrl,
      inLanguage: data.lang,
      publisher: { '@id': `${settings.organization.url.replace(/\/$/, '')}/#organization` },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: data.seo.title,
      description: data.seo.description,
      url: pageUrl,
      inLanguage: data.lang,
      primaryImageOfPage: ogImageUrl,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: data.faq.items.map((item) => ({
        '@type': 'Question',
        name: item.question,
        acceptedAnswer: { '@type': 'Answer', text: item.answer },
      })),
    },
  ];
}

export function buildNewsArticleJsonLd(opts: {
  settings: Settings;
  landing: Landing;
  post: NewsPost;
  pageUrl: string;
  listUrl: string;
  coverUrl: string;
  logoUrl: string;
}): JsonLd[] {
  const { settings, landing, post, pageUrl, listUrl, coverUrl, logoUrl } = opts;
  const org = organizationNode(settings, logoUrl);
  const author = post.data.author ? { '@type': 'Person', name: post.data.author } : org;
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'NewsArticle',
      headline: post.data.title,
      description: post.data.excerpt,
      image: [coverUrl],
      datePublished: post.data.publishedAt.toISOString(),
      dateModified: (post.data.updatedAt ?? post.data.publishedAt).toISOString(),
      inLanguage: landing.data.lang,
      mainEntityOfPage: pageUrl,
      author,
      publisher: org,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: settings.siteName, item: settings.siteUrl },
        { '@type': 'ListItem', position: 2, name: landing.data.news.listTitle, item: listUrl },
        { '@type': 'ListItem', position: 3, name: post.data.title, item: pageUrl },
      ],
    },
  ];
}
