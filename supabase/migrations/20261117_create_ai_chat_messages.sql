-- WanderStay — Lịch sử chat Trợ lý ảo (AI chat)
-- Chạy file này 1 lần trong Supabase SQL Editor để tạo bảng lưu lịch sử chat AI.
-- Vì sao cần bảng mới: bảng messages hiện có KHÔNG dùng được cho chat AI vì cột
-- booking_id của nó là NOT NULL, mà chat AI không gắn với booking nào.
-- RLS đang TẮT trên project này (giống các bảng khác) nên không cần tạo policy.
-- App lưu mỗi tin nhắn (user/assistant) kèm action_card (jsonb) để mở lại vẫn thấy
-- được cả card chỗ ở / card đơn đã đặt; mỗi lần gọi AI vẫn chỉ gửi 6 tin gần nhất
-- nên không tốn thêm token.

CREATE TABLE public.ai_chat_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role text NOT NULL CHECK (role = ANY (ARRAY['user'::text, 'assistant'::text])),
  content text NOT NULL,
  action_card jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT ai_chat_messages_pkey PRIMARY KEY (id),
  CONSTRAINT ai_chat_messages_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
