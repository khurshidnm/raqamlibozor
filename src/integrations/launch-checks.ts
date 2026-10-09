/** Release-readiness checks, kept pure so Vitest can cover them. */

export interface LaunchSettings {
  siteUrl: string;
  demoEndpoint?: string | null;
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
  if (!env.SITE_URL) {
    issues.push(
      `SITE_URL is not set, so canonical URLs, Open Graph and the sitemap use “${settings.siteUrl}” from Site settings.`,
    );
  }
  return issues;
}
