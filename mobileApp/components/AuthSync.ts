import { useAuth, useUser } from "@clerk/expo";
import { useEffect, useRef } from "react";
import { useAuthLogin } from "../hooks/useAuthentication";
import { useSocketStore } from "../lib/socketStore";
import { queryClient } from "../lib/queryClient";
import { clearPrivateKeyCache, ensureKeyPair } from "../lib/encrypt";

export const AuthSync = () => {
  const { isSignedIn, getToken } = useAuth();
  const { user } = useUser();
  const { mutate: addUserInDB } = useAuthLogin();
  const hasSyncked = useRef(false);

  const connect = useSocketStore((s) => s.connect);
  const disconnect = useSocketStore((s) => s.disconnect);

  useEffect(() => {
    if (!isSignedIn) {
      disconnect();
      return;
    }

    const start = async () => {
      const token = await getToken();
      if (token) connect(token, queryClient);
    };
    start();
  }, [isSignedIn]); // not getToken

  useEffect(() => {
    return () => disconnect();
  }, []);

  useEffect(() => {
    if (!isSignedIn || !user?.id || hasSyncked.current) {
      if (!isSignedIn) {
        hasSyncked.current = false;
        clearPrivateKeyCache();
      }
      return;
    }

    hasSyncked.current = true;

    const run = async () => {
      try {
        const keys = await ensureKeyPair(user.id);
        addUserInDB(keys.publicKey);
      } catch (error) {
        console.log("ensureKeyPair failed", error);
        hasSyncked.current = false;
      }
    };
    run();
  }, [isSignedIn, user?.id, addUserInDB]);

  return null;
};
