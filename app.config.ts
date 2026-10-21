import type { ConfigContext, ExpoConfig } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => {
  const androidKey = process.env.MAPS_ANDROID_API_KEY?.trim();
  return {
    ...config,
    name: config.name ?? 'poopable-app',
    slug: config.slug ?? 'poopable-app',
    android: { ...config.android, package: 'com.anonymous.poopableapp' },
    plugins: [
      ...(config.plugins ?? []),
      ...(androidKey
        ? [
            ['react-native-maps', { androidGoogleMapsApiKey: androidKey }] as [
              string,
              Record<string, string>,
            ],
          ]
        : []),
    ],
    extra: { ...config.extra, androidMapsConfigured: Boolean(androidKey) },
  };
};
