import { useRouter } from 'next/router';
import AccountSelector from '../components/AccountSelector/AccountSelector';

export default function ChangeAccount() {
  const router = useRouter();
  return (
    <AccountSelector onAccountSelected={() => { router.push('/'); }} />
  );
}
