// src/hooks/useFirebaseNotifications.ts
import { useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { useUser } from "@clerk/clerk-react";
import { api } from "../../convex/_generated/api";
import { messaging, getToken, onMessage } from "../../firebaseConfig";
import toast from "react-hot-toast";

export function useFirebaseNotifications() {
  const { user: clerkUser } = useUser();
  const saveFcmToken = useMutation(api.fcmTokens.saveFcmToken);

  // Get Convex user ID from Clerk ID
  const convexUser = useQuery(
    api.userQueries.getUserByClerkId,
    clerkUser?.id ? { clerkId: clerkUser.id } : "skip"
  );

  useEffect(() => {
    // Don't run if no Convex user
    if (!convexUser) return;

    let isSubscribed = true;

    const requestPermissionAndSaveToken = async () => {
      try {
        // Request notification permission
        const permission = await Notification.requestPermission();
        if (permission !== "granted") {
          console.log("Notification permission denied");
          return;
        }

        // Get FCM token
        const token = await getToken(messaging, {
          vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
        });

        if (token && isSubscribed) {
          // Save token to Convex database using Convex user ID
          const convexUserId = convexUser._id;
          await saveFcmToken({ token, userId: convexUserId });
          console.log(`✅ FCM token saved successfully for user ${convexUserId}`);
        }
      } catch (error) {
        console.error("❌ Error getting FCM token:", error);
      }
    };

    // Request permission and save token on mount
    requestPermissionAndSaveToken();

    // Handle incoming foreground messages
    const unsubscribe = onMessage(messaging, (payload) => {
      console.log("📬 Foreground message received:", payload);

      const { notification } = payload;

      if (notification) {
        // Show toast notification only (browser notification is handled by service worker)
        toast.success(`${notification.title}: ${notification.body}`, {
          duration: 5000,
          icon: "🔔",
        });

        // Note: Browser notification is already handled by the service worker (firebase-messaging-sw.js)
        // Do NOT create a duplicate notification here to avoid showing the same notification twice
      }
    });

    return () => {
      isSubscribed = false;
      unsubscribe();
    };
  }, [convexUser, saveFcmToken]);
}
