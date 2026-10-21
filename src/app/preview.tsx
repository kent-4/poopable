import { Redirect } from 'expo-router';
import { DesignPreview } from '../screens/DesignPreview';
export default function PreviewRoute() {
  return __DEV__ ? <DesignPreview /> : <Redirect href="/" />;
}
