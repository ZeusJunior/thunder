import SteamUser from 'steam-user';
import SteamCommunity from 'steamcommunity';
import CConfirmation from 'steamcommunity/classes/CConfirmation';

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
  sharedSecret: string;
  identitySecret: string;
  recoveryCode: string;
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

export interface MaFileData {
  shared_secret: string;
  serial_number: string;
  revocation_code: string;
  uri: `otpauth://totp/Steam:${string}?secret=${string}&issuer=Steam`;
  server_time: number;
  account_name: string;
  token_gid: string;
  identity_secret: string;
  secret_1: string;
  status: number;
  device_id: string;
  fully_enrolled: true;
  Session: {
    SessionID: string;
    SteamLogin: string;
    SteamLoginSecure: string;
    WebCookie: string;
    OAuthToken: string;
    SteamID: string;
  } | {
    SteamID: string;
    AccessToken: string;
    RefreshToken: string;
  }
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

export type Confirmation = Omit<CConfirmation, 'getOfferID' | 'respond'> & {
  sending: string;
};

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
  'show-mafile-dialog': () => Promise<string | null>;
  'import-mafile': (filePath: string) => Promise<string>;
  'get-confirmations': () => Promise<Confirmation[]>;
  'respond-to-confirmation': (id: number, key: string, accept: boolean) => Promise<void>;
  'accept-all-confirmations': () => Promise<void>;
}
