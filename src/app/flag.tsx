import { router, useLocalSearchParams } from 'expo-router';
import { FlagScreen } from '../features/restrooms/contributions';
export default function FlagRoute() {
  const p = useLocalSearchParams<{
    restroomId: string;
    kind: string;
    contributionId: string;
  }>();
  const valid =
    typeof p.restroomId === 'string' &&
    typeof p.contributionId === 'string' &&
    (p.kind === 'review' || p.kind === 'report');
  const detail = () =>
    valid
      ? router.replace({
          pathname: '/restroom/[id]',
          params: { id: p.restroomId },
        })
      : router.replace('/');
  return (
    <FlagScreen
      kind={p.kind === 'report' ? 'report' : 'review'}
      contributionId={valid ? p.contributionId : ''}
      onBack={detail}
      onSuccess={detail}
      onAuthenticate={() =>
        router.replace({
          pathname: '/account',
          params: { ...p, action: 'flag' },
        })
      }
    />
  );
}
