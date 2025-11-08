import SteamUser from 'steam-user';
import SteamCommunity from 'steamcommunity';

export interface ThunderConfig {
  initialized: boolean;
  createdAt: string;
  accounts: Record<string, Account>;
  currentAccountId?: string;
}

export interface Account {
  id64: string;
  personaName: string;
  accountName: string;
  sharedSecret?: string;
  identitySecret?: string;
  recoveryCode?: string;
  avatarUrl: string;

  // Steam login stuff
  refreshToken?: string;
  cookies?: string[];
  // The entire steam two factor response, we're supposed to store it but we only
  // really use sharedSecret and identitySecret from it
  twoFactorResponse?: SteamTwoFactorResponse;

  meta: {
    setupComplete: boolean;
    createdAt: string;
  };
}

export type LimitedAccount = Pick<Account, 'id64' | 'accountName' | 'personaName' | 'avatarUrl' | 'meta'>;

export interface SteamTwoFactorResponse extends SteamUser.TwoFactorResponse {
  serial_number?: string;
  secret_1?: string;
  confirm_type?: number;
}

export interface DebugInfo {
  userDataPath: string;
  isProd: boolean;
  store: ThunderConfig;
}
interface AddAuthenticatorCode {
  codeRequired: true;
  message: string;
}
interface AddAuthenticatorSuccess {
  steamId: string;
  recoveryCode: string;
}


export interface IpcHandlers {
  'debug-info': () => Promise<DebugInfo | null>;
  'config-exists': () => Promise<boolean>;
  'config-create': (password: string) => Promise<{ success: boolean; error?: string }>;
  'config-initialize': (password: string) => Promise<{ success: boolean; error?: string }>;
  'get-all-accounts': () => Promise<Record<string, LimitedAccount>>;
  'get-current-account': () => Promise<LimitedAccount | null>;
  'set-current-account': (accountId: string) => Promise<boolean>;
  'refresh-profile': (accountId: string) => Promise<boolean>;
  'add-authenticator': (options: Pick<SteamCommunity.LoginOptions, 'accountName' | 'password' | 'authCode'>) => Promise<AddAuthenticatorCode | AddAuthenticatorSuccess>;
  'finalize-authenticator': (steamId: string, activationCode: string) => Promise<true>;
  'login-again': (password: string) => Promise<void>;
  'get-auth-code': () => Promise<string>;
}
