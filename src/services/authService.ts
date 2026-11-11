import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

// Dismiss any pending in-app browser auth session when the app re-opens
// (iOS). Must run once at startup; authService is imported by AuthContext
// at the app root.
WebBrowser.maybeCompleteAuthSession();

// Deep link quay lại app sau khi đăng nhập Google/Facebook xong.
// Yêu cầu: app.json phải có "scheme": "wanderstay" (xem báo cáo).
const OAUTH_REDIRECT_URI = makeRedirectUri({
  scheme: 'wanderstay',
  path: 'auth/callback',
});

// Deep link quay lại app khi user bấm link đặt lại mật khẩu trong email.
export const PASSWORD_RESET_REDIRECT_URI = 'wanderstay://reset-password';

function parseTokensFromUrl(url: string): {
  code?: string;
  accessToken?: string;
  refreshToken?: string;
} {
  const query = url.split('?')[1]?.split('#')[0] ?? '';
  const hash = url.split('#')[1] ?? '';
  const q = new URLSearchParams(query);
  const h = new URLSearchParams(hash);
  return {
    code: q.get('code') ?? undefined,
    accessToken: h.get('access_token') ?? undefined,
    refreshToken: h.get('refresh_token') ?? undefined,
  };
}

// Đảm bảo tài khoản đăng nhập bằng mạng xã hội cũng có dòng trong
// public.users (các bảng favorites/bookings/... tham chiếu tới đó).
// Giống auto-heal đã có sẵn trong signIn().
async function ensureUserRow(user: User) {
  try {
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('id', user.id)
      .maybeSingle();

    if (!existing) {
      await supabase.from('users').upsert({
        id: user.id,
        email: user.email ?? null,
        name:
          user.user_metadata?.full_name ||
          user.user_metadata?.name ||
          (user.email ? user.email.split('@')[0] : 'User'),
        role: 'user',
      });
    }
  } catch {
    // Ignore if cannot insert
  }
}

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

// Đăng nhập bằng Google / Facebook qua trình duyệt trong app.
// Trả về true nếu đăng nhập thành công, false nếu user tự đóng trình duyệt.
// Yêu cầu trước khi chạy: bật provider trên Supabase Dashboard và cài
// `npx expo install expo-web-browser expo-auth-session` (xem báo cáo).
export async function signInWithOAuth(
  provider: 'google' | 'facebook',
): Promise<boolean> {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo: OAUTH_REDIRECT_URI, skipBrowserRedirect: true },
  });
  if (error) throw error;
  if (!data?.url) throw new Error('Could not start the sign-in flow.');

  const result = await WebBrowser.openAuthSessionAsync(
    data.url,
    OAUTH_REDIRECT_URI,
  );
  // User tự đóng trình duyệt (bấm Đóng/Hủy) thì coi như hủy đăng nhập.
  if (result.type !== 'success' || !result.url) return false;

  const { code, accessToken, refreshToken } = parseTokensFromUrl(result.url);
  let sessionUser: User | null = null;

  if (code) {
    // Luồng PKCE (mặc định của supabase-js v2): đổi code lấy session.
    const { data: exchanged, error: exchangeError } =
      await supabase.auth.exchangeCodeForSession(code);
    if (exchangeError) throw exchangeError;
    sessionUser = exchanged?.user ?? null;
  } else if (accessToken && refreshToken) {
    // Luồng implicit (cũ): token nằm trong phần hash của URL.
    const { data: sessionData, error: sessionError } =
      await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
    if (sessionError) throw sessionError;
    sessionUser = sessionData?.user ?? null;
  } else {
    throw new Error('Could not complete the sign-in flow.');
  }

  if (sessionUser) await ensureUserRow(sessionUser);
  return true;
}

// Gửi email chứa link đặt lại mật khẩu. Link trỏ về deep link
// wanderstay://reset-password để mở lại app (xem ResetPasswordScreen).
// Yêu cầu: thêm URL này vào Supabase Dashboard → Authentication →
// URL Configuration → Redirect URLs (xem báo cáo).
export async function resetPasswordForEmail(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: PASSWORD_RESET_REDIRECT_URI,
  });
  if (error) throw error;
}

// Xác minh mã xác nhận trong email đặt lại mật khẩu (luồng OTP, dùng cho
// Expo Go/demo — không cần deep link). verifyOtp tự thiết lập session
// recovery, sau đó màn ResetPassword đổi mật khẩu như bình thường.
export async function verifyRecoveryCode(email: string, code: string) {
  const { error } = await supabase.auth.verifyOtp({
    email,
    token: code.trim(),
    type: 'recovery',
  });
  if (error) throw error;
}

// Đổi mật khẩu cho phiên đăng nhập hiện tại (dùng sau khi mở link
// đặt lại mật khẩu, khi session recovery đã được thiết lập).
export async function updatePassword(newPassword: string) {
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw error;
}
