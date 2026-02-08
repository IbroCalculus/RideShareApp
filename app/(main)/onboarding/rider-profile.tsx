import { View, Text, TextInput, TouchableOpacity, Alert } from "react-native";
import { useRouter } from "expo-router";
import { useState } from "react";
import { supabase } from "../../../lib/supabase";

export default function RiderProfile() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);

  async function saveProfile() {
    if (!fullName) return Alert.alert("Error", "Please enter your name");

    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { error } = await supabase
        .from("profiles")
        .update({ full_name: fullName })
        .eq("id", user.id);

      if (error) Alert.alert("Error", error.message);
      else router.replace("/(main)/home");
    }
    setLoading(false);
  }

  return (
    <View className="flex-1 bg-white p-6 justify-center">
      <Text className="text-2xl font-bold mb-6">Complete your profile</Text>

      <TextInput
        className="w-full border border-gray-300 rounded-lg p-4 mb-6 text-lg"
        placeholder="Full Name"
        value={fullName}
        onChangeText={setFullName}
      />

      <TouchableOpacity
        className="w-full bg-yellow-400 rounded-lg p-4 items-center"
        onPress={saveProfile}
        disabled={loading}
      >
        <Text className="text-black font-bold text-lg">Start Riding</Text>
      </TouchableOpacity>
    </View>
  );
}
