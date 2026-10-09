import { describe, expect, it } from 'vitest';
import { launchIssues } from '../src/integrations/launch-checks';

const settings = { siteUrl: 'https://example.com', demoEndpoint: '' };

describe('launchIssues', () => {
  it('flags a missing endpoint and SITE_URL', () => {
    expect(launchIssues({}, settings)).toHaveLength(2);
  });
  it('accepts an https endpoint from env or settings', () => {
    const env = { SITE_URL: 'https://example.com' };
    expect(launchIssues({ ...env, PUBLIC_DEMO_ENDPOINT: 'https://api.example.com/demo' }, settings)).toEqual([]);
    expect(launchIssues(env, { ...settings, demoEndpoint: 'https://api.example.com/demo' })).toEqual([]);
  });
  it('rejects a non-https endpoint', () => {
    const issues = launchIssues({ SITE_URL: 'https://example.com', PUBLIC_DEMO_ENDPOINT: 'http://x.test' }, settings);
    expect(issues).toHaveLength(1);
  });
});
