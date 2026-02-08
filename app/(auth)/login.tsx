import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert } from "react-native";
import { supabase } from "../../lib/supabase";
import { useRouter } from "expo-router";

export default function Login() {
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function signInWithPhone() {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      phone: phone,
    });

    if (error) Alert.alert("Error", error.message);
    else setStep("otp");
    setLoading(false);
  }

  async function verifyOtp() {
    setLoading(true);
    const {
      data: { session },
      error,
    } = await supabase.auth.verifyOtp({
      phone: phone,
      token: otp,
      type: "sms",
    });

    if (error) Alert.alert("Error", error.message);
    else {
      if (session) router.replace("/(main)/home");
    }
    setLoading(false);
  }

  return (
    <View className="flex-1 justify-center items-center bg-white p-4">
      <Text className="text-2xl font-bold mb-8 text-black">
        RideShare Login
      </Text>

      {step === "phone" ? (
        <>
          <TextInput
            className="w-full border border-gray-300 rounded-lg p-4 mb-4 text-lg"
            placeholder="Phone Number (e.g. +1234567890)"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            autoCapitalize="none"
          />
          <TouchableOpacity
            className="w-full bg-yellow-400 rounded-lg p-4 items-center"
            onPress={signInWithPhone}
            disabled={loading}
          >
            <Text className="text-black font-bold text-lg">Send OTP</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <TextInput
            className="w-full border border-gray-300 rounded-lg p-4 mb-4 text-lg"
            placeholder="Enter OTP"
            value={otp}
            onChangeText={setOtp}
            keyboardType="number-pad"
          />
          <TouchableOpacity
            className="w-full bg-yellow-400 rounded-lg p-4 items-center"
            onPress={verifyOtp}
            disabled={loading}
          >
            <Text className="text-black font-bold text-lg">Verify & Login</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}
