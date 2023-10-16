import { EXPRESS_CONTENT_SECURITY_POLICY_CONFIG } from './envs';

export type CspSettings = Record<string, null | Iterable<string>> & {
  useDefaults?: boolean;
  reportOnly?: boolean;
};

/** parse and return helmets' csp policy from an env string */
export const readCspOptionsConfig = () => {
  /** leave default behavior in place as the default, to disable env, dev needs to pass false as the value */
  if (EXPRESS_CONTENT_SECURITY_POLICY_CONFIG === undefined) {
    return {};
  }
  if (EXPRESS_CONTENT_SECURITY_POLICY_CONFIG === 'false') {
    return false;
  }
  const cspConfig = JSON.parse(EXPRESS_CONTENT_SECURITY_POLICY_CONFIG) as CspSettings;
  const { useDefaults, reportOnly, ...rest } = cspConfig;
  return { directives: rest, useDefaults, reportOnly };
};
