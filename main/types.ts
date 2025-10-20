export interface ThunderConfig {
  initialized: boolean;
  createdAt: string;
  accounts: Record<string, Account>;
  currentAccountId?: string;
}

export interface Account {
  id: string;
  id64: string;
  username: string;
  sharedSecret?: string;
  identitySecret?: string;
  avatarUrl?: string;
  meta: {
    createdAt: string;
  };
}

// Todo: Prevent exporting full Account in contexts where not needed
export type LimitedAccountInfo = Pick<Account, 'id' | 'id64' | 'username' | 'avatarUrl' | 'meta'>;
