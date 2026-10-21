import { router } from 'expo-router';
import { DiscoveryScreen } from '../features/restrooms/screens';
import { RestroomMap } from '../features/restrooms/native/RestroomMap';
export default function HomeRoute() {
  return (
    <DiscoveryScreen
      MapComponent={RestroomMap}
      onOpen={(id) =>
        router.push({ pathname: '/restroom/[id]', params: { id } })
      }
      onAccount={() => router.push('/account')}
    />
  );
}
