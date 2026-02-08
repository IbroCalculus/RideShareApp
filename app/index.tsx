import { Redirect } from "expo-router";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { View, ActivityIndicator } from "react-native";

export default function Index() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) checkProfile(session.user.id);
      else setLoading(false);
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) checkProfile(session.user.id);
      else setLoading(false);
    });
  }, []);

  async function checkProfile(userId: string) {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();
    if (error || !data) {
      // No profile, redirect to onboarding via a state or router (but component is Redirect based)
      // We'll set a state 'needsOnboarding'
      setNeedsOnboarding(true);
    } else {
      setNeedsOnboarding(false);
    }
    setLoading(false);
  }

  if (loading)
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#facc15" />
      </View>
    );

  if (session) {
    if (needsOnboarding) return <Redirect href="/(main)/onboarding/role" />;
    return <Redirect href="/(main)/home" />;
  } else {
    return <Redirect href="/(auth)/login" />;
  }
}
