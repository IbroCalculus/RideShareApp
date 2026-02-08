import { View, Text, TouchableOpacity, Alert } from "react-native";
import { useRouter } from "expo-router";
import { useState } from "react";
import { supabase } from "../../../lib/supabase";

export default function RoleSelection() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function selectRole(role: "rider" | "driver") {
    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      Alert.alert("Error", "No user found");
      setLoading(false);
      return;
    }

    // We creating the profile row here with just the role for now
    // Or we can pass it to the next screen.
    // Let's create it here to "lock in" the role.
    const { error } = await supabase.from("profiles").insert({
      id: user.id,
      role: role,
      phone: user.phone,
    });

    if (error) {
      // If profile already exists, maybe update it? Or just proceed if error is "duplicate key"
      if (error.code === "23505") {
        // unique_violation
        // Update?
        await supabase.from("profiles").update({ role }).eq("id", user.id);
      } else {
        Alert.alert("Error", error.message);
        setLoading(false);
        return;
      }
    }

    setLoading(false);
    router.replace(
      role === "driver"
        ? "/(main)/onboarding/driver-profile"
        : "/(main)/onboarding/rider-profile",
    );
  }

  return (
    <View className="flex-1 bg-white p-6 justify-center">
      <Text className="text-3xl font-bold mb-10 text-center">
        Choose your role
      </Text>

      <TouchableOpacity
        className="bg-gray-100 p-8 rounded-2xl mb-6 items-center border-2 border-transparent active:border-yellow-400"
        onPress={() => selectRole("rider")}
        disabled={loading}
      >
        <Text className="text-2xl font-bold mb-2">PASSENGER</Text>
        <Text className="text-gray-500 text-center">
          I want to request rides
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        className="bg-gray-100 p-8 rounded-2xl items-center border-2 border-transparent active:border-yellow-400"
        onPress={() => selectRole("driver")}
        disabled={loading}
      >
        <Text className="text-2xl font-bold mb-2">DRIVER</Text>
        <Text className="text-gray-500 text-center">I want to offer rides</Text>
      </TouchableOpacity>
    </View>
  );
}
