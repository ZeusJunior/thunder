import SteamUser from 'steam-user';

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
