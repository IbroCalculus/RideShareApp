import { create } from "zustand";
// Verify modules are resolved
import { supabase } from "../lib/supabase";
import { Alert } from "react-native";

interface Bid {
  id: string;
  ride_id: string;
  driver_id: string;
  amount: number;
  status: "pending" | "accepted" | "rejected";
  created_at: string;
  driver?: {
    full_name: string;
    car_model: string;
    car_plate: string;
    rating: number;
    avatar_url: string;
  };
}

interface BiddingState {
  activeRideId: string | null;
  activeRide: any | null; // Full ride object
  bids: Bid[];
  isLoading: boolean;
  setActiveRideId: (id: string | null) => void;
  fetchActiveRide: (rideId: string) => Promise<void>;
  fetchBids: (rideId: string) => Promise<void>;
  placeBid: (rideId: string, amount: number) => Promise<void>;
  acceptBid: (bidId: string) => Promise<void>;
  subscribeToBids: (rideId: string) => void;
  unsubscribeFromBids: () => void;
  subscribeToDriverLocation: (driverId: string) => void;
}

export const useBiddingStore = create<BiddingState>((set, get) => {
  let channel: any = null;

  return {
    activeRideId: null,
    activeRide: null,
    bids: [],
    isLoading: false,

    setActiveRideId: (id: string | null) => {
      set({ activeRideId: id });
      if (id) get().fetchActiveRide(id);
      else set({ activeRide: null, bids: [] });
    },

    fetchActiveRide: async (rideId: string) => {
      const { data, error } = await supabase
        .from("rides")
        .select("*, driver:profiles(*)")
        .eq("id", rideId)
        .single();

      if (!error && data) {
        set({ activeRide: data });

        // Subscribe to driver location if driver is assigned
        if (data.driver_id) {
          get().subscribeToDriverLocation(data.driver_id);
        }
      }
    },

    subscribeToDriverLocation: (driverId: string) => {
      // This assumes we have a subscription to active ride set up separately?
      // Active ride subscription handles ride status changes.
      // We need a separate channel or same channel for profile?
      // Profiles table needs to be in publication. It is not by default in my migration.
      // I should check if profiles is in publication.
      // schema.sql: "alter publication supabase_realtime add table public.rides, public.bids;"
      // Profiles is NOT in realtime publication yet.
      // I need to add it.

      // For now, I'll add the code, but I need to update the publication.
      supabase
        .channel(`driver_loc:${driverId}`)
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "profiles",
            filter: `id=eq.${driverId}`,
          },
          (payload: any) => {
            const { new: newDriver } = payload;
            set((state) => ({
              activeRide: state.activeRide
                ? {
                    ...state.activeRide,
                    driver: { ...state.activeRide.driver, ...newDriver },
                  }
                : null,
            }));
          },
        )
        .subscribe();
    },

    fetchBids: async (rideId: string) => {
      set({ isLoading: true });
      const { data, error } = await supabase
        .from("bids")
        .select(
          `
                    *,
                    driver:profiles(*)
                `,
        )
        .eq("ride_id", rideId)
        .order("amount", { ascending: true });

      if (error) {
        console.error("Error fetching bids:", error);
        Alert.alert("Error fetching bids", error.message);
      } else {
        set({ bids: data as any });
      }
      set({ isLoading: false });
    },

    placeBid: async (rideId: string, amount: number) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.from("bids").insert({
        ride_id: rideId,
        driver_id: user.id,
        amount: amount,
      });

      if (error) Alert.alert("Error placing bid", error.message);
    },

    acceptBid: async (bidId: string) => {
      const { error } = await supabase
        .from("bids")
        .update({ status: "accepted" })
        .eq("id", bidId);

      if (error) Alert.alert("Error accepting bid", error.message);
      // Logic to reject other bids or update ride status can be handled by DB triggers or here
    },

    subscribeToBids: (rideId: string) => {
      if (channel) channel.unsubscribe();

      channel = supabase
        .channel(`bids:${rideId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "bids",
            filter: `ride_id=eq.${rideId}`,
          },
          (payload: any) => {
            console.log("New bid received!", payload);
            // Fetch fresh data to get driver details
            get().fetchBids(rideId);
          },
        )
        .subscribe();
    },

    unsubscribeFromBids: () => {
      if (channel) {
        channel.unsubscribe();
        channel = null;
      }
    },
  };
});
