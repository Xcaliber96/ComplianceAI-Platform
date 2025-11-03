import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebaseConfig";

export const listenForUser = () => {
  onAuthStateChanged(auth, async (user) => {
    if (user && user.email) {
      try {
        const email = user.email;

        const response = await fetch("http://127.0.0.1:8000/add_user_to_gcs", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email }), 
        });

        const data = await response.json();
        console.log("✅ Synced user with backend:", data);
      } catch (err) {
        console.error("❌ Failed to sync user:", err);
      }
    } else {
      console.log("👤 No user signed in");
    }
  });
};