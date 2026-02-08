import { Stack } from "expo-router";
import { StripeProvider } from "@stripe/stripe-react-native";

export default function RootLayout() {
  return (
    <StripeProvider
      publishableKey="pk_test_12345" // TODO: Replace with your actual publishable key
      merchantIdentifier="merchant.com.rideshare"
    >
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(main)" />
      </Stack>
    </StripeProvider>
  );
}
