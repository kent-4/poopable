import { router, useLocalSearchParams } from 'expo-router';
import { ReviewScreen } from '../../../features/restrooms/contributions';
export default function ContributionRoute() {
  const params = useLocalSearchParams<{ id: string }>();
  const id = typeof params.id === 'string' ? params.id : '';
  const detail = () =>
    router.replace({ pathname: '/restroom/[id]', params: { id } });
  return (
    <ReviewScreen
      restroomId={id}
      onBack={detail}
      onSuccess={detail}
      onAuthenticate={() =>
        router.replace({
          pathname: '/account',
          params: { restroomId: id, action: 'review' },
        })
      }
    />
  );
}
