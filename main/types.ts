export interface ThunderConfig {
  initialized: boolean;
  createdAt: string;
  accounts: Record<string, Account>;
  currentAccountId?: string;
}

export interface Account {
  id64: string;
  username: string;
  sharedSecret?: string;
  identitySecret?: string;
  recoveryCode?: string;
  avatarUrl?: string;

  // Steam login stuff
  refreshToken?: string;
  cookies?: string[];

  meta: {
    setupComplete: boolean;
    createdAt: string;
  };
}

export type LimitedAccount = Pick<Account, 'id64' | 'username' | 'avatarUrl' | 'meta'>;
