import Prismic from '@prismicio/client';
import { DefaultClient } from '@prismicio/client/types/client';

export function getPrismicClient(req?: unknown): DefaultClient {
  const prismicApiEndpoint = process.env.PRISMIC_API_ENDPOINT;
  const accessToken = process.env.PRISMIC_ACCESS_TOKEN;

  const prismic = Prismic.client(prismicApiEndpoint, {
    req,
    accessToken,
  });

  return prismic;
}
