import { supabase } from '../lib/supabase';

export async function signUp(
  email: string,
  password: string,
  name: string,
  phone?: string,
) {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  if (!data.user) throw new Error('Could not create account.');

  const { error: profileError } = await supabase.from('users').insert({
    id: data.user.id,
    email,
    name,
    phone: phone ?? null,
    role: 'user',
  });
  if (profileError) throw profileError;
  return data;
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}
