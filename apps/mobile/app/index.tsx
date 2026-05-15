import { useAuthSession } from '@/hooks/use-auth-session';
import { Redirect, type Href } from 'expo-router';

export default function IndexRedirect() {
  const { isAuthenticated } = useAuthSession();
  return <Redirect href={(isAuthenticated ? '/(tabs)' : '/welcome') as Href} />;
}
