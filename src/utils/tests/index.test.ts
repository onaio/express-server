import { getOriginFromUrl } from '../index';

describe('test util functions', () => {
  it('get origin from url', () => {
    const url = 'https://keycloak-example.domain.org/auth/realms/example-realm';
    const result = getOriginFromUrl(url);
    expect(result).toEqual(['https://keycloak-example.domain.org']);
  });
  it('returns empty array if url is empty or undefined', () => {
    const emptyUrl = '';
    const emptyUrlResult = getOriginFromUrl(emptyUrl);
    const undefinedUrlResult = getOriginFromUrl();
    expect(emptyUrlResult).toEqual([]);
    expect(undefinedUrlResult).toEqual([]);
  });
});
