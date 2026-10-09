import type { CollectionAfterChangeHook, GlobalAfterChangeHook } from 'payload';

/** Triggers a site rebuild (Netlify, Vercel, GitHub Actions dispatch proxy …) when SITE_DEPLOY_HOOK_URL is set. */
async function trigger(): Promise<void> {
  const url = process.env.SITE_DEPLOY_HOOK_URL;
  if (!url) return;
  try {
    await fetch(url, { method: 'POST' });
  } catch (error) {
    console.error('Deploy hook failed', error);
  }
}

export const collectionDeployHook: CollectionAfterChangeHook = async ({ doc }) => {
  await trigger();
  return doc;
};
export const globalDeployHook: GlobalAfterChangeHook = async ({ doc }) => {
  await trigger();
  return doc;
};
