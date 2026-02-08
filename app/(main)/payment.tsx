import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useStripe } from "@stripe/stripe-react-native";
import { useState } from "react";
import { supabase } from "../../lib/supabase";

export default function PaymentScreen() {
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const [loading, setLoading] = useState(false);

  const fetchPaymentSheetParams = async () => {
    const { data, error } = await supabase.functions.invoke("payment-sheet", {
      body: { amount: 2000 }, // $20.00 hardcoded for demo
    });

    if (!data || error) {
      Alert.alert("Error", error?.message || "Something went wrong");
      console.error(error);
      return null;
    }
    return {
      paymentIntent: data.paymentIntent,
      customer: data.customer,
      ephemeralKey: data.ephemeralKey,
    };
  };

  const initializePaymentSheet = async () => {
    setLoading(true);
    const params = await fetchPaymentSheetParams();

    if (!params) {
      setLoading(false);
      return;
    }

    const { error } = await initPaymentSheet({
      merchantDisplayName: "RideShare App",
      paymentIntentClientSecret: params.paymentIntent,
      // customerId: params.customer,
      // customerEphemeralKeySecret: params.ephemeralKey,
      defaultBillingDetails: {
        name: "Jane Doe",
      },
    });

    if (error) {
      Alert.alert("Error", error.message);
    } else {
      openPaymentSheet();
    }
    setLoading(false);
  };

  const openPaymentSheet = async () => {
    const { error } = await presentPaymentSheet();

    if (error) {
      Alert.alert(`Error code: ${error.code}`, error.message);
    } else {
      Alert.alert("Success", "Payment confirmed!");
    }
  };

  return (
    <View className="flex-1 justify-center items-center bg-white p-4">
      <Text className="text-2xl font-bold mb-8">Ride Completed</Text>
      <Text className="text-4xl font-bold mb-8">$20.00</Text>

      <TouchableOpacity
        className="bg-black w-full p-4 rounded-xl items-center"
        onPress={initializePaymentSheet}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text className="text-white font-bold text-lg">Pay Now</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}
