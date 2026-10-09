/** Release-readiness checks, kept pure so Vitest can cover them. */

export interface LaunchSettings {
  siteUrl: string;
  demoEndpoint?: string | null;
  seo?: { indexable?: boolean };
}

/** Problems that would ship a visibly broken site. Empty when the build is ready to publish. */
export function launchIssues(env: Record<string, string | undefined>, settings: LaunchSettings): string[] {
  const issues: string[] = [];
  const endpoint = (env.PUBLIC_DEMO_ENDPOINT || settings.demoEndpoint || '').trim();
  if (!endpoint) {
    issues.push(
      'No demo-request endpoint: the form would report success without sending anything. ' +
        'Set PUBLIC_DEMO_ENDPOINT or “Demo request endpoint” in Site settings.',
    );
  } else if (!/^https:\/\//.test(endpoint)) {
    issues.push(`The demo-request endpoint must be an https:// URL (got “${endpoint}”).`);
  }
  const siteUrl = env.SITE_URL || settings.siteUrl;
  if (!/^https:\/\//.test(siteUrl)) issues.push(`The site URL must be an https:// URL (got “${siteUrl}”).`);
  if (settings.seo?.indexable === false) {
    issues.push('Search engines are blocked: “Allow search engines to index the site” is off in SEO settings.');
  }
  return issues;
}
