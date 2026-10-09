import { describe, expect, it } from 'vitest';
import { launchIssues } from '../src/integrations/launch-checks';

const settings = { siteUrl: 'https://example.com', demoEndpoint: '' };

describe('launchIssues', () => {
  it('flags a missing endpoint and a non-https site URL', () => {
    expect(launchIssues({}, settings)).toHaveLength(1);
    expect(launchIssues({ SITE_URL: 'http://example.com' }, settings)).toHaveLength(2);
  });
  it('accepts an https endpoint from env or settings', () => {
    const env = {};
    expect(launchIssues({ ...env, PUBLIC_DEMO_ENDPOINT: 'https://api.example.com/demo' }, settings)).toEqual([]);
    expect(launchIssues(env, { ...settings, demoEndpoint: 'https://api.example.com/demo' })).toEqual([]);
  });
  it('warns when indexing is switched off', () => {
    const issues = launchIssues({ PUBLIC_DEMO_ENDPOINT: 'https://x.test' }, { ...settings, seo: { indexable: false } });
    expect(issues).toHaveLength(1);
  });
  it('rejects a non-https endpoint', () => {
    const issues = launchIssues({ PUBLIC_DEMO_ENDPOINT: 'http://x.test' }, settings);
    expect(issues).toHaveLength(1);
  });
});
