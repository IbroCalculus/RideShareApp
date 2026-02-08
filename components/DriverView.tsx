import { View, Text, TouchableOpacity, FlatList, Alert } from "react-native";
import { useDriverStore } from "../stores/useDriverStore";
import { useEffect } from "react";
import { supabase } from "../lib/supabase";
import * as Location from "expo-location";

export default function DriverView() {
  const {
    isOnline,
    toggleOnline,
    rideRequests,
    subscribeToRideRequests,
    unsubscribeFromRideRequests,
    updateLocation,
  } = useDriverStore();

  useEffect(() => {
    let locationSubscription: any = null;

    if (isOnline) {
      subscribeToRideRequests();
      (async () => {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          Alert.alert("Permission to access location was denied");
          return;
        }

        locationSubscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            timeInterval: 5000, // Update every 5 seconds
            distanceInterval: 10,
          },
          (loc) => {
            updateLocation(loc.coords.latitude, loc.coords.longitude);
          },
        );
      })();
    } else {
      unsubscribeFromRideRequests();
    }

    return () => {
      unsubscribeFromRideRequests();
      if (locationSubscription) locationSubscription.remove();
    };
  }, [isOnline]);

  async function placeBid(rideId: string) {
    // Demo bid amount
    const amount = 25.0;

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from("bids").insert({
      ride_id: rideId,
      driver_id: user.id,
      amount: amount,
      status: "pending",
    });

    if (error) Alert.alert("Error", error.message);
    else Alert.alert("Success", "Bid placed!");
  }

  return (
    <View className="absolute top-12 left-4 right-4 bottom-10 pointer-events-none">
      {/* Top Bar */}
      <View className="flex-row justify-between items-center pointer-events-auto">
        <View className="bg-white p-2 rounded-full shadow-md">
          <Text className="font-bold">Driver Mode</Text>
        </View>
        <TouchableOpacity
          onPress={toggleOnline}
          className={`p-3 rounded-full shadow-md ${isOnline ? "bg-green-500" : "bg-gray-500"}`}
        >
          <Text className="font-bold text-white">
            {isOnline ? "GO ONLINE" : "GO ONLINE"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Requests List */}
      {isOnline && (
        <View className="mt-4 bg-white/90 p-4 rounded-xl flex-1 pointer-events-auto">
          <Text className="font-bold text-lg mb-2">
            Nearby Requests ({rideRequests.length})
          </Text>
          <FlatList
            data={rideRequests}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View className="border-b border-gray-200 py-3">
                <Text className="font-bold">
                  {item.pickup_address} {"->"} {item.dropoff_address}
                </Text>
                <Text className="text-gray-500">
                  Est. Price: ${item.price || "Negotiable"}
                </Text>
                <TouchableOpacity
                  className="bg-yellow-400 p-2 rounded mt-2 items-center"
                  onPress={() => placeBid(item.id)}
                >
                  <Text className="font-bold">Bid $25</Text>
                </TouchableOpacity>
              </View>
            )}
          />
        </View>
      )}
    </View>
  );
}
