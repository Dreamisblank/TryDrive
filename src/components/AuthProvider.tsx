"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { User } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { isAuthConfigured } from "@/lib/supabase/config";
import AuthModal from "./AuthModal";

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  /** False until the Supabase env vars are set; callers should not gate on auth. */
  configured: boolean;
  /** Opens the sign-in modal. `onSuccess` fires once the user is signed in. */
  openSignIn: (onSuccess?: () => void) => void;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const configured = isAuthConfigured();
  // Resolved on the client so that pages using this provider stay statically
  // prerenderable; the Supabase browser client reads the session from cookies.
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(configured);
  const [modalOpen, setModalOpen] = useState(false);

  // Held in a ref so that resuming the pending action (e.g. "finish booking")
  // doesn't re-render the whole tree while the modal is open.
  const onSuccessRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    let active = true;
    supabase.auth
      .getUser()
      .then(({ data }) => {
        if (!active) return;
        setUser(data.user ?? null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const openSignIn = useCallback((onSuccess?: () => void) => {
    onSuccessRef.current = onSuccess ?? null;
    setModalOpen(true);
  }, []);

  const handleSignedIn = useCallback(() => {
    setModalOpen(false);
    const cb = onSuccessRef.current;
    onSuccessRef.current = null;
    cb?.();
  }, []);

  const handleClose = useCallback(() => {
    onSuccessRef.current = null;
    setModalOpen(false);
  }, []);

  const signOut = useCallback(async () => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    setLoading(true);
    await supabase.auth.signOut();
    setUser(null);
    setLoading(false);
  }, []);

  const value = useMemo(
    () => ({ user, loading, configured, openSignIn, signOut }),
    [user, loading, configured, openSignIn, signOut],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
      {modalOpen && (
        <AuthModal onClose={handleClose} onSignedIn={handleSignedIn} />
      )}
    </AuthContext.Provider>
  );
}
