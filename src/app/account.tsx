import { router, useLocalSearchParams } from 'expo-router';
import { AccountScreen } from '../features/restrooms/contributions';
export default function AccountRoute() {
  const params = useLocalSearchParams<{
    restroomId?: string;
    action?: string;
    kind?: string;
    contributionId?: string;
  }>();
  const detail = () =>
    typeof params.restroomId === 'string'
      ? router.replace({
          pathname: '/restroom/[id]',
          params: { id: params.restroomId },
        })
      : router.replace('/');
  return (
    <AccountScreen
      onBack={detail}
      onAuthenticated={() => {
        if (typeof params.restroomId !== 'string') {
          router.replace('/');
          return;
        }
        if (params.action === 'review' || params.action === 'report')
          router.replace({
            pathname:
              params.action === 'review'
                ? '/restroom/[id]/review'
                : '/restroom/[id]/report',
            params: { id: params.restroomId },
          });
        else if (
          params.action === 'flag' &&
          (params.kind === 'review' || params.kind === 'report') &&
          typeof params.contributionId === 'string'
        )
          router.replace({
            pathname: '/flag',
            params: {
              restroomId: params.restroomId,
              kind: params.kind,
              contributionId: params.contributionId,
            },
          });
        else detail();
      }}
    />
  );
}
