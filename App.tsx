import { useFonts } from 'expo-font';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Quicksand_500Medium } from '@expo-google-fonts/quicksand/500Medium';
import { Quicksand_600SemiBold } from '@expo-google-fonts/quicksand/600SemiBold';
import { Quicksand_700Bold } from '@expo-google-fonts/quicksand/700Bold';
import { Nunito_400Regular } from '@expo-google-fonts/nunito/400Regular';
import { Nunito_500Medium } from '@expo-google-fonts/nunito/500Medium';
import { Nunito_600SemiBold } from '@expo-google-fonts/nunito/600SemiBold';
import { Nunito_700Bold } from '@expo-google-fonts/nunito/700Bold';
import { Nunito_800ExtraBold } from '@expo-google-fonts/nunito/800ExtraBold';
import { Nunito_400Regular_Italic } from '@expo-google-fonts/nunito/400Regular_Italic';
import { Nunito_600SemiBold_Italic } from '@expo-google-fonts/nunito/600SemiBold_Italic';
import { DesignPreview } from './src/screens/DesignPreview';
import { colors } from './src/theme/tokens';

export default function App() {
  const [loaded, error] = useFonts({
    Quicksand_500Medium,
    Quicksand_600SemiBold,
    Quicksand_700Bold,
    Nunito_400Regular,
    Nunito_500Medium,
    Nunito_600SemiBold,
    Nunito_700Bold,
    Nunito_800ExtraBold,
    Nunito_400Regular_Italic,
    Nunito_600SemiBold_Italic,
  });
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      {error ? (
        <View style={styles.center}>
          <Text accessibilityRole="alert">
            Unable to load Poopable’s fonts. Please restart the app.
          </Text>
        </View>
      ) : loaded ? (
        <DesignPreview />
      ) : (
        <View style={styles.center}>
          <ActivityIndicator
            accessibilityLabel="Loading Poopable fonts"
            color={colors.primary}
          />
        </View>
      )}
    </SafeAreaProvider>
  );
}
const styles = StyleSheet.create({
  center: {
    flex: 1,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.page,
  },
});
