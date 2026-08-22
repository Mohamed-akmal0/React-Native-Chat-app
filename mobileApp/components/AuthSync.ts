import { useAuth, useUser } from "@clerk/expo";
import { useEffect, useRef } from "react";
import { useAuthLogin } from "../hooks/useAuthentication";
import { useSocketStore } from "../lib/socketStore";
import { queryClient } from "../lib/queryClient"

export const AuthSync = () => {
  const { isSignedIn, getToken } = useAuth();
  const user = useUser();
  const { mutate: addUserInDB } = useAuthLogin();
  const hasSyncked: any = useRef(false);

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
    if (isSignedIn && user && !hasSyncked.current) {
      hasSyncked.current = true;
      addUserInDB();
    }

    if (!isSignedIn) {
      hasSyncked.current = false;
    }


  }, [isSignedIn, user, addUserInDB]);
  return null;
};
