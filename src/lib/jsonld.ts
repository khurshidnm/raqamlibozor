import type { Landing, Settings } from './content';
import type { NewsPost } from './news';

type JsonLd = Record<string, unknown>;

export function buildJsonLd(opts: {
  settings: Settings;
  landing: Landing;
  pageUrl: string;
  ogImageUrl: string;
}): JsonLd[] {
  const { settings, landing, pageUrl, ogImageUrl } = opts;
  const data = landing.data;
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: settings.organization.name,
      url: settings.organization.url,
      brand: { '@type': 'Brand', name: settings.siteName },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: settings.siteName,
      url: settings.siteUrl,
      inLanguage: data.lang,
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
  const org = {
    '@type': 'Organization',
    name: settings.organization.name,
    url: settings.organization.url,
    logo: logoUrl,
  };
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'NewsArticle',
      headline: post.data.title,
      description: post.data.excerpt,
      image: [coverUrl],
      datePublished: post.data.publishedAt.toISOString(),
      dateModified: post.data.publishedAt.toISOString(),
      inLanguage: landing.data.lang,
      mainEntityOfPage: pageUrl,
      author: org,
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
