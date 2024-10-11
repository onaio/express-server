import { EXPRESS_OPENSRP_ACCESS_TOKEN_URL } from '../../configs/envs';

export function parseKeycloakUrl(keycloakUrl: string) {
  // Parse the URL
  const parsedUrl = new URL(keycloakUrl);
  const { origin } = parsedUrl;
  const keycloakBaseUrl = `${origin}/auth`;

  // Split the path to get the segments
  const pathSegments = parsedUrl.pathname.split('/');

  // The realm is usually the second-to-last segment in the path
  const realmIndex = pathSegments.indexOf('realms') + 1;

  let realm;

  // Check if we have a valid realm index
  if (realmIndex > 0 && realmIndex < pathSegments.length) {
    realm = pathSegments[realmIndex];
  }
  return { realm, keycloakBaseUrl };
}

export const { realm, keycloakBaseUrl } = parseKeycloakUrl(EXPRESS_OPENSRP_ACCESS_TOKEN_URL);
