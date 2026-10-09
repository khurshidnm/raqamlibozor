import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { postgresAdapter } from '@payloadcms/db-postgres';
import { sqliteAdapter } from '@payloadcms/db-sqlite';
import { buildConfig } from 'payload';
import sharp from 'sharp';
import { Landing } from './collections/Landing';
import { Leads } from './collections/Leads';
import { Markets } from './collections/Markets';
import { Media } from './collections/Media';
import { News, newsEditor } from './collections/News';
import { Users } from './collections/Users';
import { Settings } from './globals/Settings';
import { leadEndpoints } from './lib/leads-endpoint';

const dirname = path.dirname(fileURLToPath(import.meta.url));
const databaseUrl = process.env.DATABASE_URL ?? '';
const isPostgres = /^postgres(ql)?:/.test(databaseUrl);

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: { baseDir: path.resolve(dirname) },
    meta: { titleSuffix: ' · Raqamli Bozor CMS' },
  },
  collections: [Landing, News, Markets, Media, Leads, Users],
  globals: [Settings],
  endpoints: leadEndpoints,
  editor: newsEditor,
  secret: process.env.PAYLOAD_SECRET || 'dev-only-secret-change-me',
  typescript: { outputFile: path.resolve(dirname, 'payload-types.ts') },
  db: isPostgres
    ? postgresAdapter({ pool: { connectionString: databaseUrl } })
    : sqliteAdapter({
        client: { url: databaseUrl || `file:${path.resolve(dirname, '../data/cms.db')}` },
        push: true,
      }),
  sharp,
});
