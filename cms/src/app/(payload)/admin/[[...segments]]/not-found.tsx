import config from '@payload-config';
import { NotFoundPage } from '@payloadcms/next/views';
import { importMap } from '../importMap.js';

type Args = {
  params: Promise<{ segments: string[] }>;
  searchParams: Promise<{ [key: string]: string | string[] }>;
};

export const generateMetadata = () => ({ title: 'Not found' });

const NotFound = ({ params, searchParams }: Args) => NotFoundPage({ config, params, searchParams, importMap });

export default NotFound;
