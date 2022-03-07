/**
 * get the url origin from full url
 * e.g https://keycloak-example.domain.org from https://keycloak-example.domain.org/auth/realms/example-realm
 * @param url
 * @returns
 */
export const getOriginFromUrl = (url?: string) => {
  if (!url) {
    return [];
  }
  const urlObject = new URL(url);
  return [urlObject.origin];
};

export default getOriginFromUrl;
