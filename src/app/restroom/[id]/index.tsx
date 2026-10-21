import { router, useLocalSearchParams } from 'expo-router';
import { RestroomMap } from '../../../features/restrooms/native/RestroomMap';
import { DetailScreen } from '../../../features/restrooms/screens';
export default function DetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <DetailScreen
      MapComponent={RestroomMap}
      restroomId={typeof id === 'string' ? id : ''}
      onBack={() => (router.canGoBack() ? router.back() : router.replace('/'))}
      onContribute={(target) =>
        router.push({
          pathname:
            target.action === 'review'
              ? '/restroom/[id]/review'
              : '/restroom/[id]/report',
          params: { id: target.restroomId },
        })
      }
    />
  );
}
