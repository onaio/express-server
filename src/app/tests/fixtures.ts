export const parsedApiResponse = {
  preferredName: 'Superset User',
  roles: ['Provider'],
  preferred_username: 'superset-user',
};

export const oauthState = {
  gatekeeper: {
    result: {
      email: null,
      oAuth2Data: {
        access_token: '64dc9918-fa1c-435d-9a97-ddb4aa1a8316',
        expires_in: 3221,
        refresh_expires_in: 2592000,
        refresh_token: '808f060c-be93-459e-bd56-3074d9b96229',
        scope: 'read write',
        token_type: 'bearer',
      },
      roles: [],
      username: 'superset-user',
    },
    success: true,
  },
  session: {
    authenticated: true,
    extraData: {
      email: null,
      oAuth2Data: {
        access_token: '64dc9918-fa1c-435d-9a97-ddb4aa1a8316',
        expires_in: 3221,
        refresh_expires_in: 2592000,
        refresh_token: '808f060c-be93-459e-bd56-3074d9b96229',
        scope: 'read write',
        token_type: 'bearer',
      },
      roles: [],
      username: 'superset-user',
    },
    user: { email: '', gravatar: '', name: '', username: 'superset-user' },
  },
  session_expires_at: '2020-01-01T01:00:00.000Z',
};

export const refreshOauthState2 = {
  gatekeeper: {
    result: {
      oAuth2Data: {
        access_token: '64dc9918-fa1c-435d-9a97-ddb4aa1a8316',
        expires_in: 3221,
        refresh_expires_in: 2592000,
        refresh_token: '808f060c-be93-459e-bd56-3074d9b96229',
        scope: 'read write',
        token_type: 'bearer',
      },
    },
    success: true,
  },
  session: {
    email: null,
    extraData: {
      oAuth2Data: {
        access_token: '64dc9918-fa1c-435d-9a97-ddb4aa1a8316',
        expires_in: 3221,
        refresh_expires_in: 2592000,
        refresh_token: '808f060c-be93-459e-bd56-3074d9b96229',
        scope: 'read write',
        token_type: 'bearer',
      },
    },
    oAuth2Data: {
      access_token: '64dc9918-fa1c-435d-9a97-ddb4aa1a8316',
      expires_in: 3221,
      refresh_expires_in: 2592000,
      refresh_token: '808f060c-be93-459e-bd56-3074d9b96229',
      scope: 'read write',
      token_type: 'bearer',
    },
    roles: [],
    username: 'superset-user',
  },
  session_expires_at: '2020-01-01T01:00:00.000Z',
};

export const unauthorized = {
  error: 'Not authorized',
};
