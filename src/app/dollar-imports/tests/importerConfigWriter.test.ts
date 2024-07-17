import { generateImporterSCriptConfig } from '../importerConfigWriter';

afterEach(() => {
  jest.clearAllMocks();
  jest.resetAllMocks();
});

test('generates importer config content correctly ', () => {
  const response = generateImporterSCriptConfig('at', 'rt');
  expect(response).toMatchInlineSnapshot(`
    "client_id = \\"fhir-web\\"
    client_secret = \\"clientSecret\\"
    realm = \\"fhir\\"
    access_token = \\"at\\"
    refresh_token = \\"rt\\"
    keycloak_url = \\"http://localhost:8080/auth\\"
    fhir_base_url = \\"http://localhost:8081/fhir\\"
    "
  `);
});
