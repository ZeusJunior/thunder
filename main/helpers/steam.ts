import SteamUser from 'steam-user';
import SteamTOTP from 'steam-totp';
import SteamCommunity from 'steamcommunity';
import { accountExists, addAccount, getAccount, updateAccount } from './store';
import SteamID from 'steamid';
import { getStore } from '../store';
import { SteamTwoFactorResponse } from '../types';

export function loginAgain(details: SteamUser.LogOnDetailsNamePass | SteamUser.LogOnDetailsRefresh) {
  return new Promise<void>((resolve, reject) => {
    let loggedOn = false;
    let cookies: string[] = [];
    let newRefreshToken = '';
    let hasResolved = false;

    const user = new SteamUser({ renewRefreshTokens: true });
    user.logOn(details);

    const saveAndResolve = () => {
      if (hasResolved) return;
      hasResolved = true;

      const steamId = user.steamID!.getSteamID64();
      updateAccount(steamId, {
        cookies,
        ...(newRefreshToken ? { refreshToken: newRefreshToken } : {}),
      });
      return resolve();
    };

    const checkReadyAndSetTimeout = () => {
      if (loggedOn && cookies.length > 0) {
        // Wait up to 1 extra second for refreshToken, then proceed anyway
        // It doesn't always fire or possibly after loggedOn and webSession events fire.
        // Do still want to try and save the new one as the old one is expired if we get it. 
        setTimeout(() => {
          if (!hasResolved) {
            console.log('Proceeding without new refresh token after timeout');
            saveAndResolve();
          }
        }, 1000);
      }
    };

    user.on('error', (err) => {
      // TODO: Handle any errors here better in the UI
      console.error('Error re-authenticating:', err);
      return reject(new Error(err.message));
    });

    user.on('loggedOn', () => {
      console.log('Re-authenticated successfully for', user.steamID!.getSteamID64());
      loggedOn = true;
      checkReadyAndSetTimeout();
    });

    user.on('webSession', (_sessionID, webSession) => {
      console.log('Obtained new web session for', user.steamID!.getSteamID64());
      cookies = webSession;
      checkReadyAndSetTimeout();
    });

    user.on('refreshToken', (token) => {
      console.log('Obtained new refresh token for', user.steamID!.getSteamID64());
      newRefreshToken = token;
      if (loggedOn && cookies.length > 0) {
        return saveAndResolve();
      }
    });
  });
};

export function getAuthCode(sharedSecret: string): string {
  return SteamTOTP.generateAuthCode(sharedSecret);
};

export function refreshProfile(accountId: string): Promise<true> {
  const account = getAccount(accountId, false);
  if (!account) {
    // Crash
    throw new Error('Account not found');
  }

  const community = new SteamCommunity();
  community.setCookies(account.cookies || []);

  return new Promise((resolve, reject) => {
    community.getSteamUser(new SteamID(accountId), (err, communityUser) => {
      if (err) {
        console.error('Error fetching profile info:', err);
        return reject(new Error('Failed to fetch profile info'));
      }

      updateAccount(
        accountId,
        {
          personaName: communityUser.name,
          avatarUrl: `https://avatars.fastly.steamstatic.com/${communityUser.avatarHash}_full.jpg`,
        }
      );

      return resolve(true);
    });
  });
}

export async function addAuthenticator({
  accountName,
  password,
  authCode,
}: Pick<SteamCommunity.LoginOptions, 'accountName' | 'password' | 'authCode'>): Promise<{
  codeRequired: true;
  message: string;
} | {
  steamId: string;
  recoveryCode: string;
}> {
  // Check if store is initialized but don't assign to variable
  // To not accidentally not use the helper functions
  if (!getStore()) {
    throw new Error('Not authenticated');
  }

  const details = { accountName, password, authCode, disableMobile: false };

  const community = new SteamCommunity();

  return new Promise((resolve, reject) => {
    community.login(details, (err, _sessionID, cookies) => {
      if (err) {
        if (err.message === 'SteamGuard') {
          return resolve({
            message: `Please input the Steam Guard code sent to your email ending with ${err.emaildomain}`,
            codeRequired: true,
          });
        }
        if (err.message === 'InvalidPassword') {
          return reject(new Error('Your password is invalid, please double check your login information.'));
        }
        if (err.message === 'SteamGuardMobile') {
          return reject(new Error('This account is protected by Steam Guard Mobile Authenticator. You must disable it if you want to use Thunder as your authenticator.'));
        }

        return reject(new Error(err.message));
      }

      const steamId = community.steamID.getSteamID64();
      const account = accountExists(steamId);
      console.log('Steam login successful for', steamId);
      if (account) {
        return reject(new Error('This account has already been added.'));
      }

      community.getSteamUser(new SteamID(steamId), (err, communityUser) => {
        if (err) {
          // It's possible the profile couldn't be found if the account hasn't been set up yet
          // That's fine, ignore that error
          if (err.message && !err.message.includes('profile could not be found')) {
            console.error('Error fetching profile info:', err);
          }
        }

        // 3 callbacks, yay
        community.enableTwoFactor(
          (err, response) => {
            if (err || response?.status !== 1) {
              console.error(
                'Error enabling 2FA with status:',
                response?.status,
                'and error:',
                err
              );

              return reject(new Error(err?.message || `Status ${response?.status}`));
            }

            addAccount(steamId, {
              id64: steamId,
              personaName: communityUser?.name || accountName,
              accountName,
              sharedSecret: response.shared_secret,
              identitySecret: response.identity_secret,
              recoveryCode: response.revocation_code,
              avatarUrl: `https://avatars.fastly.steamstatic.com/${communityUser?.avatarHash || 'fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb'}_full.jpg`,
              meta: {
                setupComplete: false,
                createdAt: new Date().toISOString(),
              },
              cookies,
              twoFactorResponse: response as SteamTwoFactorResponse,
              mobileAccessToken: community.mobileAccessToken,
            });

            return resolve({
              steamId,
              recoveryCode: response.revocation_code,
            });
          }
        );
      });
    });
  });
}

export async function finalizeAuthenticator(
  steamId: string,
  activationCode: string
): Promise<true> {
  // Check if store is initialized but don't assign to variable
  // To not accidentally not use the helper functions
  if (!getStore()) {
    throw new Error('Not authenticated');
  }

  const account = getAccount(steamId, false);
  if (!account) {
    throw new Error('Account not found');
  }
  if (!account.sharedSecret) {
    throw new Error('This account has not started the 2FA setup process, you can\'t finalize it.');
  }
  if (!account.mobileAccessToken) {
    throw new Error('This account is not logged in via mobile, please create an issue on GitHub.');
  }

  const community = new SteamCommunity();
  community.setCookies(account.cookies || []);
  community.setMobileAppAccessToken(account.mobileAccessToken);

  // Finalize the 2FA setup
  return new Promise((resolve, reject) => {
    community.finalizeTwoFactor(
      account.sharedSecret!,
      activationCode,
      (err) => {
        if (err) {
          console.error('Error finalizing 2FA:', err);
          return reject(new Error(err.message));
        }

        console.log('2FA setup finalized successfully for ', steamId);

        updateAccount(steamId, { meta: { ...account.meta, setupComplete: true }, mobileAccessToken: undefined });

        return resolve(true);
      }
    );
  });
}
