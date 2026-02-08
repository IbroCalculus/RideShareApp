import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { supabase } from "../../lib/supabase";
import { useRouter } from "expo-router";
import MapView, { PROVIDER_GOOGLE, Marker, Polyline } from "react-native-maps";
import { useEffect, useState } from "react";
import * as Location from "expo-location";
import RiderView from "../../components/RiderView";
import DriverView from "../../components/DriverView";
import { useBiddingStore } from "../../stores/useBiddingStore";
import { useDriverStore } from "../../stores/useDriverStore";

export default function Home() {
  const router = useRouter();
  const [location, setLocation] = useState<Location.LocationObject | null>(
    null,
  );
  const [role, setRole] = useState<"rider" | "driver" | null>(null);
  const [loading, setLoading] = useState(true);
  const { activeRide } = useBiddingStore();
  // Driver store also has rideRequests, but DriverView displays them as list using same logic
  // If we want to show ALL requested rides on map for driver:
  const { rideRequests } = useDriverStore();

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        console.log("Permission to access location was denied");
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      setLocation(location);
    })();

    fetchProfile();
  }, []);

  async function fetchProfile() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();
      if (data) setRole(data.role as "rider" | "driver");
    }
    setLoading(false);
  }

  async function signOut() {
    await supabase.auth.signOut();
    router.replace("/(auth)/login");
  }

  if (loading)
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator />
      </View>
    );

  // Helper to parse POINT(lng lat) to coordinate object
  const parsePoint = (pointStr: string) => {
    if (!pointStr) return null;
    // Format: POINT(-122.4324 37.78825)
    const matches = pointStr.match(/\(([^ ]+) ([^ ]+)\)/);
    if (matches) {
      return {
        longitude: parseFloat(matches[1]),
        latitude: parseFloat(matches[2]),
      };
    }
    return null;
  };

  return (
    <View className="flex-1 relative">
      <MapView
        style={{ flex: 1 }}
        provider={PROVIDER_GOOGLE}
        showsUserLocation
        initialRegion={{
          latitude: location?.coords.latitude || 37.78825,
          longitude: location?.coords.longitude || -122.4324,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }}
      >
        {/* Rider's Active Ride Markers */}
        {role === "rider" && activeRide && (
          <>
            {parsePoint(activeRide.pickup_location) && (
              <Marker
                coordinate={parsePoint(activeRide.pickup_location)!}
                title="Pickup"
                pinColor="green"
              />
            )}
            {parsePoint(activeRide.dropoff_location) && (
              <Marker
                coordinate={parsePoint(activeRide.dropoff_location)!}
                title="Dropoff"
                pinColor="red"
              />
            )}
            {/* Could add Polyline here if we had route coordinates */}
          </>
        )}

        {/* Driver's View of Requests */}
        {role === "driver" &&
          rideRequests.map((req) => {
            const pickup = parsePoint(req.pickup_location);
            if (pickup) {
              return (
                <Marker
                  key={req.id}
                  coordinate={pickup}
                  title="New Request"
                  pinColor="blue"
                />
              );
            }
            return null;
          })}
      </MapView>

      <TouchableOpacity
        onPress={signOut}
        className="absolute top-12 left-4 bg-white p-2 rounded-full shadow-md z-50"
      >
        <Text className="font-bold text-xs">Sign Out</Text>
      </TouchableOpacity>

      {role === "rider" ? <RiderView /> : <DriverView />}
    </View>
  );
}
