import SteamUser from 'steam-user';

export const loginAgain = async (details: SteamUser.LogOnDetailsNamePass | SteamUser.LogOnDetailsRefresh) => {
  return new Promise<{ cookies: string[]; newRefreshToken: string }>((resolve, reject) => {
    let loggedOn = false;
    let cookies = [];
    let newRefreshToken = '';

    const user = new SteamUser({ renewRefreshTokens: true });
    user.logOn(details);

    user.on('error', (err) => {
      // TODO: Figure out specific EResult for invalid/expired refresh token?
      console.error('Error re-authenticating with refresh token:', err);
      reject(new Error('login-required'));
    });

    user.on('loggedOn', async () => {
      console.log('Re-authenticated successfully with refresh token');
      loggedOn = true;
      if (cookies.length > 0 && newRefreshToken) {
        resolve({ cookies, newRefreshToken });
      }
    });

    user.on('webSession', (_sessionID, webSession) => {
      cookies = webSession;
      if (loggedOn && newRefreshToken) {
        resolve({ cookies, newRefreshToken });
      }
    });

    user.on('refreshToken', (token) => {
      newRefreshToken = token;
      if (loggedOn && cookies.length > 0) {
        resolve({ cookies, newRefreshToken });
      }
    });
  });
};