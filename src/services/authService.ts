import { supabase } from '../lib/supabase';

export async function signUp(
  email: string,
  password: string,
  name: string,
  phone?: string,
) {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  if (!data.user) throw new Error('Could not create the account.');

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

  // Auto-heal: Ensure public.users row exists for this account so foreign keys never fail
  if (data?.user) {
    try {
      const { data: existing } = await supabase
        .from('users')
        .select('id')
        .eq('id', data.user.id)
        .maybeSingle();

      if (!existing) {
        await supabase.from('users').upsert({
          id: data.user.id,
          email: data.user.email || email,
          name: data.user.user_metadata?.name || email.split('@')[0],
          role: 'user',
        });
      }
    } catch {
      // Ignore if cannot insert
    }
  }

  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}
