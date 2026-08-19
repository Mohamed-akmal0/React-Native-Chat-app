import { useAuth, useUser } from "@clerk/expo";
import { useEffect, useRef } from "react";
import { useAuthLogin } from "../hooks/useAuthentication";

export const AuthSync = () => {
  const { isSignedIn } = useAuth();
  const user = useUser();
  const { mutate: addUserInDB } = useAuthLogin();
  const hasSyncked: any = useRef(false);

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
