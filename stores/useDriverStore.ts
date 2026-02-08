import { create } from "zustand";
import { supabase } from "../lib/supabase";
import { Alert } from "react-native";

interface RideRequest {
  id: string;
  pickup_address: string;
  dropoff_address: string;
  pickup_location: any; // PostGIS point
  dropoff_location: any; // PostGIS point
  distance_meters: number;
  estimated_duration_seconds: number;
  price?: number;
  rider_id: string;
  status:
    | "requested"
    | "bidding"
    | "booked"
    | "in_progress"
    | "completed"
    | "cancelled";
}

interface DriverState {
  isOnline: boolean;
  currentLocation: { latitude: number; longitude: number } | null;
  rideRequests: RideRequest[];
  toggleOnline: () => Promise<void>;
  updateLocation: (lat: number, lng: number) => Promise<void>;
  subscribeToRideRequests: () => void;
  unsubscribeFromRideRequests: () => void;
}

export const useDriverStore = create<DriverState>((set, get) => {
  let channel: any = null;

  return {
    isOnline: false,
    currentLocation: null,
    rideRequests: [],

    toggleOnline: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const newStatus = !get().isOnline;
      set({ isOnline: newStatus });

      const { error } = await supabase
        .from("profiles")
        .update({ is_online: newStatus })
        .eq("id", user.id);

      if (error) {
        Alert.alert("Error updating status", error.message);
        set({ isOnline: !newStatus }); // Revert
      }
    },

    updateLocation: async (lat: number, lng: number) => {
      set({ currentLocation: { latitude: lat, longitude: lng } });

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user || !get().isOnline) return;

      // Update location in DB periodically (or via Edge Function for efficiency)
      // Here we just update the profile
      const point = `POINT(${lng} ${lat})`;
      await supabase
        .from("profiles")
        .update({
          current_location: point,
        })
        .eq("id", user.id);
    },

    subscribeToRideRequests: () => {
      if (channel) channel.unsubscribe();

      // In a real app, we'd use a PostGIS filter here or Edge Function to only get nearby rides.
      // For now, we subscribe to all 'requested' rides and filter client-side or assume RLS handles it.
      // RLS policy: "Drivers can see requested rides within 5km." -> So simple subscription works!

      channel = supabase
        .channel("active_rides")
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "rides",
            filter: "status=eq.requested",
          },
          (payload: any) => {
            console.log("New ride request!", payload);
            // Check if it's already in the list
            const exists = get().rideRequests.find(
              (r) => r.id === payload.new.id,
            );
            if (!exists) {
              set((state) => ({
                rideRequests: [
                  payload.new as RideRequest,
                  ...state.rideRequests,
                ],
              }));
            }
          },
        )
        .subscribe();
    },

    unsubscribeFromRideRequests: () => {
      if (channel) {
        channel.unsubscribe();
        channel = null;
        set({ rideRequests: [] });
      }
    },
  };
});
