// @ts-nocheck
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // SePay sends webhook data in JSON format
    const body = await req.json();
    console.log("SePay Webhook Received Payload:", JSON.stringify(body));

    const {
      gateway,
      accountNumber,
      transferType,
      transferAmount,
      content,
      referenceCode,
    } = body;

    // Chỉ xử lý giao dịch nhận tiền (transferType = "in")
    if (transferType && transferType !== "in") {
      return new Response(
        JSON.stringify({ success: true, message: "Bỏ qua giao dịch chuyển đi (transferType != in)" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    const contentStr = String(content || "").toUpperCase();
    console.log("Nội dung chuyển khoản SePay:", contentStr);

    // Tìm mã booking dạng WS-51088 hoặc WS51088 hoặc WSxxxxx
    const match = contentStr.match(/WS[-_]?\d+/);

    if (!match) {
      console.log("Không tìm thấy mã booking WS... trong nội dung:", contentStr);
      return new Response(
        JSON.stringify({ success: true, message: "Không tìm thấy mã booking trong nội dung chuyển khoản" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    const rawMatch = match[0]; // e.g. "WS-51088" or "WS51088"
    const digitsOnly = rawMatch.replace(/\D/g, ""); // e.g. "51088"

    console.log(`Đang tìm booking với mã: ${rawMatch} (số: ${digitsOnly})`);

    // Tìm kiếm booking trong bảng bookings
    const { data: bookings, error: findError } = await supabase
      .from("bookings")
      .select("id, ref_code, total, deposit_amount, payment_status, status")
      .or(`ref_code.ilike.%${digitsOnly}%,ref_code.ilike.%${rawMatch}%`)
      .limit(1);

    if (findError || !bookings || bookings.length === 0) {
      console.log("Không tìm thấy booking phù hợp trong database");
      return new Response(
        JSON.stringify({ success: true, message: "Không tìm thấy booking tương ứng" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    const booking = bookings[0];
    console.log("Đã tìm thấy booking:", booking);

    // Cập nhật trạng thái booking thành đã thanh toán (paid)
    const { error: updateError } = await supabase
      .from("bookings")
      .update({
        payment_status: "paid",
        status: "booked", // Trạng thái đặt phòng thành công
      })
      .eq("id", booking.id);

    if (updateError) {
      console.error("Lỗi cập nhật booking:", updateError);
      return new Response(
        JSON.stringify({ success: false, error: updateError.message }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    console.log(`Đã cập nhật thành công booking ${booking.ref_code} sang payment_status = 'paid'`);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Xác nhận thanh toán SePay thành công!",
        bookingId: booking.id,
        refCode: booking.ref_code,
        transferAmount,
        gateway,
        accountNumber,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (err) {
    console.error("Lỗi xử lý webhook SePay:", err);
    return new Response(
      JSON.stringify({ success: false, error: String(err) }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
