import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useBiddingStore } from "../stores/useBiddingStore";
import { useRouter } from "expo-router";

export default function RiderView() {
  const router = useRouter();
  const [pickup, setPickup] = useState("");
  const [destination, setDestination] = useState("");
  const {
    activeRideId,
    setActiveRideId,
    bids,
    subscribeToBids,
    unsubscribeFromBids,
    acceptBid,
  } = useBiddingStore();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (activeRideId) {
      subscribeToBids(activeRideId);
    }
    return () => unsubscribeFromBids();
  }, [activeRideId]);

  async function requestRide() {
    if (!pickup || !destination)
      return Alert.alert("Error", "Please enter locations");

    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    // Demo: using static coordinates for now (SF)
    const startLat = 37.78825;
    const startLng = -122.4324;
    const endLat = 37.75825;
    const endLng = -122.4624;

    const { data, error } = await supabase
      .from("rides")
      .insert({
        rider_id: user.id,
        pickup_address: pickup,
        dropoff_address: destination,
        pickup_location: `POINT(${startLng} ${startLat})`,
        dropoff_location: `POINT(${endLng} ${endLat})`,
        status: "requested",
      })
      .select()
      .single();

    if (error) {
      Alert.alert("Error", error.message);
    } else {
      Alert.alert("Success", "Ride requested! Waiting for drivers...");
      setActiveRideId(data.id);
    }
    setLoading(false);
  }

  async function handleAcceptBid(bidId: string) {
    await acceptBid(bidId);
    Alert.alert("Success", "Ride booked! Driver is on the way.");
    // Update ride status logic would go here or be handled by subscription/trigger
  }

  if (activeRideId) {
    return (
      <View className="absolute bottom-10 left-4 right-4 bg-white p-6 rounded-xl shadow-lg h-1/2">
        <Text className="text-xl font-bold mb-4">Looking for drivers...</Text>
        <Text className="mb-2">Ride ID: {activeRideId.slice(0, 8)}...</Text>

        {bids.length === 0 ? (
          <ActivityIndicator />
        ) : (
          <View className="flex-1">
            <Text className="font-bold mb-2">{bids.length} Offers:</Text>
            <FlatList
              data={bids}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <View className="flex-row justify-between items-center border-b border-gray-100 py-3">
                  <View>
                    <Text className="font-bold text-lg">${item.amount}</Text>
                    <Text className="text-gray-500">
                      {item.driver?.full_name || "Driver"}
                    </Text>
                  </View>
                  <TouchableOpacity
                    className="bg-black px-4 py-2 rounded-lg"
                    onPress={() => handleAcceptBid(item.id)}
                  >
                    <Text className="text-white font-bold">Accept</Text>
                  </TouchableOpacity>
                </View>
              )}
            />
          </View>
        )}
        <TouchableOpacity
          className="mt-4 bg-green-500 p-3 rounded-lg items-center mb-2"
          onPress={() => router.push("/(main)/payment")}
        >
          <Text className="text-white font-bold">Test Payment</Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="mt-4 bg-gray-200 p-3 rounded-lg items-center"
          onPress={() => setActiveRideId(null)}
        >
          <Text className="text-gray-700 font-bold">Cancel Request</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="absolute bottom-10 left-4 right-4 bg-white p-6 rounded-xl shadow-lg">
      <Text className="text-xl font-bold mb-4">Where to?</Text>

      <TextInput
        className="w-full border border-gray-300 rounded-lg p-3 mb-3"
        placeholder="Pickup Location"
        value={pickup}
        onChangeText={setPickup}
      />

      <TextInput
        className="w-full border border-gray-300 rounded-lg p-3 mb-4"
        placeholder="Destination"
        value={destination}
        onChangeText={setDestination}
      />

      <TouchableOpacity
        className="w-full bg-black rounded-lg p-4 items-center"
        onPress={requestRide}
        disabled={loading}
      >
        <Text className="text-white font-bold text-lg">Request Ride</Text>
      </TouchableOpacity>
    </View>
  );
}
