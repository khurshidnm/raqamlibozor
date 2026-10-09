import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
export const contentRoot = process.env.CONTENT_ROOT ? path.resolve(process.env.CONTENT_ROOT) : repoRoot;

/** Keys that hold a media reference: a media id (slug) in the site files, a relationship in the CMS. */
export const mediaKeys = new Set(['ogImage', 'image', 'imageMobile', 'icon', 'socialImage', 'cover']);
