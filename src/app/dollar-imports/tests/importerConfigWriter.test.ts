import { generateImporterSCriptConfig } from '../importerConfigWriter';

jest.mock('../../../configs/envs');

afterEach(() => {
  jest.clearAllMocks();
  jest.resetAllMocks();
});

test('generates importer config content correctly ', () => {
  const response = generateImporterSCriptConfig('at', 'rt');
  expect(response).toMatchInlineSnapshot(`
    "access_token = \\"at\\"
    refresh_token = \\"rt\\"
    keycloak_url = \\"http://reveal-stage.smartregister.org/auth\\"
    "
  `);
});
