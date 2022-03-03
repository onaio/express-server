import { getOriginFromUrl } from '../index';

describe('test util functions', () => {
  it('get origin from url', () => {
    const url = 'https://keycloak-example.domain.org/auth/realms/example-realm';
    const result = getOriginFromUrl(url);
    expect(result).toEqual(['https://keycloak-example.domain.org']);
  });
});
