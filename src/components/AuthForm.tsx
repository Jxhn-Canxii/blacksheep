"use client";

import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { useSupabase } from "@/hooks/useSupabase";
import { useUser } from "@/hooks/useUser";

interface AuthFormProps {
  view?: "sign_in" | "sign_up";
}

const AuthForm: React.FC<AuthFormProps> = ({ view = "sign_in" }) => {
  const { supabase, session } = useSupabase();
  const { setIsLoggingIn } = useUser();
  const router = useRouter();
  const redirectTo = `${typeof window !== "undefined" ? window.location.origin : ""}/`;

  useEffect(() => {
    if (session) {
      setIsLoggingIn(true);
      router.push('/');
    }
  }, [session, router, setIsLoggingIn]);

  return (
    <Auth
      supabaseClient={supabase}
      view={view}
      providers={['github', 'google', 'discord']}
        redirectTo={redirectTo}
      magicLink={false}
      appearance={{
        theme: ThemeSupa,
        variables: {
          default: {
            colors: {
              brand: '#404040',
              brandAccent: '#22c55e'
            }
          }
        }
      }}
      theme="dark"
    />
  );
}

export default AuthForm;
