// @ts-nocheck
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `
Bạn là WanderStay AI Assistant — Trợ lý du lịch ảo 24/7 của ứng dụng WanderStay (nền tảng tìm kiếm & đặt chỗ ở nghỉ dưỡng tự túc).
Nhiệm vụ của bạn:
1. Hỗ trợ khách hàng giải đáp thắc mắc về chỗ ở, dịch vụ, hướng dẫn nhận phòng và chính sách du lịch.
2. SỬ DỤNG CÔNG CỤ (TOOLS) khi khách hỏi về:
   - Các đơn đặt phòng hoặc lịch trình chuyến đi của họ -> gọi tool 'getUserBookings'.
   - Chi tiết chỗ nghỉ, tiện nghi, xe đón sân bay ($35 USD), giờ check-in/out -> gọi tool 'getPlaceDetails'.
   - Tìm chỗ nghỉ theo địa điểm, ngày, khoảng giá -> gọi tool 'searchPlaces'.
   - Hủy phòng, chính sách hủy và số tiền hoàn lại -> gọi tool 'checkCancellationRefund'.
3. QUY ĐỊNH NGHIỆP VỤ BẮT BUỘC:
   - Giờ nhận phòng: từ 14:00. Giờ trả phòng: trước 12:00.
   - Smart Key (mã PIN 4821#, Bluetooth LE) tự động kích hoạt vào 14:00 ngày check-in.
   - Minh bạch chi phí: Total = (đơn giá x số đêm) + phí kayak + phí đỗ xe. Không có phụ phí ẩn.
   - Quy định hủy phòng BR05: Trước check-in >= 48h miễn phí (hoàn 100%), trong vòng 48h phạt 1 đêm, sau check-in phạt 100%.
   - Luôn trả lời bằng tiếng Việt (hoặc ngôn ngữ khách dùng), thân thiện, súc tích và chính xác theo dữ liệu tool trả về.
4. QUY ĐỊNH TRẢ LỜI — BẮT BUỘC (áp dụng cho cả tiếng Việt và tiếng Anh):
   - Khi cần tìm chỗ ở, LUÔN gọi tool 'searchPlaces' — TUYỆT ĐỐI không viết tham số tìm kiếm hay JSON ra câu trả lời.
   - Chỉ gợi ý những chỗ ở, giá và số sao mà tool đã trả về — TUYỆT ĐỐI không tự bịa tên chỗ ở, giá hay số review.
   - Nếu tool không trả về chỗ nào, hãy nói thật là không tìm thấy chỗ phù hợp cho địa điểm đó — không được bịa ra.
   - TUYỆT ĐỐI KHÔNG được trả lời "Đang tìm kiếm", "Tôi sẽ cập nhật ngay khi có kết quả", hay bất kỳ câu nào nói rằng bạn đang tìm kiếm mà không đưa ra kết quả. Khi khách đã cho địa điểm và ngày (dù chỉ mới cho một phần thông tin), GỌI NGAY tool 'searchPlaces' với thông tin đã có (thiếu gì thì để null/không truyền — đừng chờ đủ thông tin mới tìm), rồi trình bày kết quả tìm được trong CÙNG câu trả lời. Không được hỏi thêm thông tin trước khi tìm. Nếu tool không trả về chỗ nào thì nói thật là không tìm thấy.
   - Khi khách cho ngân sách bằng VND cho toàn bộ chuyến đi (ví dụ "5 triệu cho chuyến đi này"), hãy ước tính giá tối đa mỗi đêm = ngân sách / số đêm / 25000 (USD) để truyền maxPrice cho tool 'searchPlaces' (nếu không tính được thì để null, không được stall).
`.trim();

// 2. DANH MỤC TOOLS (FUNCTION CALLING)
const TOOLS = [
  {
    type: "function",
    function: {
      name: "getUserBookings",
      description: "Tra cứu danh sách các đơn đặt phòng của người dùng hiện tại (mã đặt phòng #WS-xxxxx, chỗ ở, ngày nhận/trả phòng, tổng tiền, trạng thái).",
      parameters: {
        type: "object",
        properties: {
          status: {
            type: "string",
            enum: ["all", "booked", "completed", "cancelled"],
            description: "Trạng thái đơn cần tìm. Mặc định là 'all'."
          }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "getPlaceDetails",
      description: "Tra cứu thông tin chi tiết một chỗ nghỉ (tiện ích, địa chỉ, vị trí, giá, xe đưa đón sân bay $35 USD).",
      parameters: {
        type: "object",
        properties: {
          placeName: {
            type: "string",
            description: "Tên hoặc từ khóa chỗ nghỉ (ví dụ: Balian Treehouse, Kuta, Ubud, v.v.)."
          }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "checkCancellationRefund",
      description: "Tính toán chính xác số tiền hoàn trả và phí phạt khi hủy đơn đặt phòng theo quy định BR05 của WanderStay.",
      parameters: {
        type: "object",
        properties: {
          refCode: {
            type: "string",
            description: "Mã đơn đặt phòng (ví dụ: #WS-84920, #WS-74286)."
          }
        },
        required: ["refCode"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "searchPlaces",
      description: "Tìm chỗ nghỉ còn trống theo địa điểm, khoảng ngày lưu trú, khoảng giá và số khách. Trả về tối đa 3 chỗ phù hợp nhất kèm thẻ place_card để khách chọn và đặt. Chỉ dùng kết quả tool này để gợi ý; không tự bịa chỗ ở.",
      parameters: {
        type: "object",
        properties: {
          location: {
            type: "string",
            description: "Địa điểm hoặc từ khóa khu vực (ví dụ: Bali, Ubud, Kuta). Tùy chọn."
          },
          checkIn: {
            type: "string",
            description: "Ngày nhận phòng, định dạng YYYY-MM-DD (ví dụ: 2026-11-18). Tùy chọn."
          },
          checkOut: {
            type: "string",
            description: "Ngày trả phòng, định dạng YYYY-MM-DD (ví dụ: 2026-11-20). Tùy chọn."
          },
          maxPrice: {
            type: "number",
            description: "Giá tối đa mỗi đêm (USD). Tùy chọn."
          },
          guests: {
            type: "number",
            description: "Tổng số khách (người lớn + trẻ em). Tùy chọn."
          }
        }
      }
    }
  }
];

// --- Lọc JSON thô rò rỉ vào câu trả lời hiển thị ---
// Model đôi khi không emit tool_call đúng chuẩn mà viết tham số tool (dạng JSON)
// ra thẳng câu trả lời. Hàm này chỉ xóa JSON, không xóa chữ bình thường
// (tên chỗ ở, giá, ngày tháng viết bằng lời vẫn giữ nguyên).
const TOOL_PARAM_KEYS = ["checkIn", "checkOut", "location", "placeName", "refCode", "guests", "maxPrice"];

function sanitizeReply(text: string): string {
  if (!text) return text;
  let out = text;

  // (a) Xóa khối code fence ```json ... ``` (và ``` ... ``` nào chỉ chứa JSON).
  out = out.replace(/```[a-zA-Z0-9_-]*[ \t]*(?:\r?\n)?([\s\S]*?)```/g, (m, inner) => {
    const t = (inner || "").trim();
    if (!t) return "";
    if (t.startsWith("{") || t.startsWith("[")) return "";
    return m;
  });

  // (c) Xóa object JSON đứng riêng chứa key tham số tool.
  out = out.replace(/\{[^{}]*\}/g, (block) => {
    const hasKey = TOOL_PARAM_KEYS.some((k) => new RegExp(`"${k}"\\s*:`, "i").test(block));
    return hasKey ? "" : block;
  });

  // (b) Xóa dòng chỉ có chữ "json" đứng riêng lẻ.
  out = out.split("\n").filter((line) => line.trim().toLowerCase() !== "json").join("\n");

  // (d) Gọn lại dòng trống thừa (tối đa 2 dòng trống liên tiếp) và trim.
  out = out.replace(/\n{4,}/g, "\n\n\n").trim();
  return out;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { prompt, userId, messages: clientMessages, language } = await req.json();

    if (!prompt && (!clientMessages || clientMessages.length === 0)) {
      return new Response(
        JSON.stringify({ error: "Missing prompt or messages" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const apiKey = Deno.env.get("OPENROUTER_API_KEY");
    if (!apiKey) {
      throw new Error("OPENROUTER_API_KEY is not set on server environment");
    }

    // Khởi tạo Supabase client để thực thi tool calling
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Ngôn ngữ app gửi sang ('vi' mặc định hoặc 'en'): AI trả lời đúng ngôn ngữ đó.
    // Trước đây app không gửi language nên AI chỉ đoán qua nội dung tin nhắn.
    // Ngày hiện tại (múi giờ Việt Nam): tiêm vào prompt để AI suy đúng năm/tháng
    // khi khách nói ngày tương đối mà không nói năm (ví dụ "ngày 18 đến 20 tháng này").
    // Tính động mỗi lần request — không hardcode, vì ngày hôm nay thay đổi.
    const todayVN = new Date().toLocaleDateString("vi-VN", {
      timeZone: "Asia/Ho_Chi_Minh",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
    const currentYearVN = new Date().toLocaleDateString("en-US", {
      timeZone: "Asia/Ho_Chi_Minh",
      year: "numeric",
    });
    const effectiveSystemPrompt =
      SYSTEM_PROMPT +
      (language === "en"
        ? "\nAlways reply in English."
        : "\nLuôn trả lời bằng tiếng Việt.") +
      `\nHôm nay là ${todayVN} (giờ Việt Nam). Khi khách nói ngày mà không nói năm (ví dụ "ngày 18 đến 20 tháng này", "ngày 20 này"), hãy dùng ngày hôm nay để suy ra năm và tháng — năm hiện tại là ${currentYearVN}, không được tự đoán năm khác. Ngày trả phòng (checkOut) là ngày sau đêm cuối cùng: ở từ ngày 18 đến ngày 20 nghĩa là checkIn là ngày 18, checkOut là ngày 20 (2 đêm). Luôn truyền checkIn/checkOut dạng 'YYYY-MM-DD'.`;

    // Xây dựng danh sách tin nhắn gửi sang OpenRouter
    const apiMessages: any[] = [{ role: "system", content: effectiveSystemPrompt }];

    // Các câu "stall" cũ ("Đang tìm kiếm..." mà không trả kết quả): loại khỏi
    // lịch sử gửi sang model để model không học theo pattern đó rồi stall tiếp.
    // Chỉ lọc tin assistant, không lọc tin user.
    const STALL_PHRASES = ["Đang tìm kiếm", "đang tìm kiếm", "sẽ cập nhật ngay khi có kết quả", "Tôi sẽ cập nhật"];

    if (Array.isArray(clientMessages) && clientMessages.length > 0) {
      // Giữ tối đa 6 tin nhắn gần nhất để tối ưu context & token
      const recent = clientMessages.slice(-6);
      for (const msg of recent) {
        if (!msg.text) continue;
        if (msg.sender !== "user" && STALL_PHRASES.some((p) => msg.text.includes(p))) {
          continue;
        }
        apiMessages.push({
          role: msg.sender === "user" ? "user" : "assistant",
          content: msg.text,
        });
      }
    }

    if (prompt) {
      // Thêm câu hỏi hiện tại nếu chưa có trong history
      const lastMsg = apiMessages[apiMessages.length - 1];
      if (!lastMsg || lastMsg.role !== "user" || lastMsg.content !== prompt) {
        apiMessages.push({ role: "user", content: prompt });
      }
    }

    // --- VÒNG 1: Gọi OpenRouter AI kèm danh mục Tools ---
    const firstResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "deepseek/deepseek-chat",
        messages: apiMessages,
        tools: TOOLS,
        tool_choice: "auto",
        temperature: 0.3,
      }),
    });

    const firstData = await firstResponse.json();
    const assistantMessage = firstData?.choices?.[0]?.message;

    if (!assistantMessage) {
      throw new Error(firstData?.error?.message || "Không nhận được phản hồi từ AI model");
    }

    let actionCard: any = null;
    const executedTools: string[] = [];

    // --- VÒNG 2: Xử lý Tool Calls nếu AI yêu cầu ---
    if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
      apiMessages.push(assistantMessage);

      for (const toolCall of assistantMessage.tool_calls) {
        const functionName = toolCall.function?.name;
        let args: any = {};
        try {
          args = JSON.parse(toolCall.function?.arguments || "{}");
        } catch {
          args = {};
        }

        let toolResult: any = { status: "not_found" };
        executedTools.push(functionName);

        // TOOL 1: getUserBookings
        if (functionName === "getUserBookings") {
          let query = supabase
            .from("bookings")
            .select("id, ref_code, check_in, check_out, nights, guests_adults, guests_children, price_per_night, kayak_fee, parking_fee, total, payment_method, status, pin_code, places(id, title, location, images)")
            .order("created_at", { ascending: false });

          if (userId) {
            query = query.eq("user_id", userId);
          }

          if (args.status && args.status !== "all") {
            query = query.eq("status", args.status);
          }

          const { data: bookingsData } = await query.limit(5);
          toolResult = bookingsData && bookingsData.length > 0 ? bookingsData : [];

          // Tạo Rich Card nếu tìm thấy đơn đặt phòng
          if (bookingsData && bookingsData.length > 0) {
            const firstBooking = bookingsData[0];
            actionCard = {
              type: "booking_card",
              data: {
                id: firstBooking.id,
                refCode: firstBooking.ref_code,
                placeTitle: firstBooking.places?.title || "Chỗ nghỉ",
                placeLocation: firstBooking.places?.location || "Bali, Indonesia",
                dates: `${firstBooking.check_in} – ${firstBooking.check_out}`,
                nights: firstBooking.nights,
                total: firstBooking.total,
                status: firstBooking.status,
                pinCode: firstBooking.pin_code || "4821#",
                image: firstBooking.places?.images?.[0] || null,
              },
            };
          }
        }

        // TOOL 2: getPlaceDetails
        else if (functionName === "getPlaceDetails") {
          const placeKeyword = args.placeName ? args.placeName.trim() : "Balian";
          const { data: placesData } = await supabase
            .from("places")
            .select("id, title, location, category, place_type, price_per_night, rooms, beds, guests_capacity, amenities, images, rating, review_count, check_in_time, check_out_time, address, wifi_ssid, smart_lock_pin, host_name, host_phone, kayak_fee, parking_fee")
            .ilike("title", `%${placeKeyword}%`)
            .limit(3);

          toolResult = placesData && placesData.length > 0 ? placesData : [];

          if (placesData && placesData.length > 0) {
            const p = placesData[0];
            // Cùng shape place_card với searchPlaces: frontend chỉ cần MỘT đường render
            actionCard = {
              type: "place_card",
              data: {
                places: [
                  {
                    id: p.id,
                    title: p.title,
                    location: p.location,
                    pricePerNight: p.price_per_night,
                    rating: p.rating ?? 0,
                    reviewCount: p.review_count ?? 0,
                    image: p.images?.[0] || null,
                    checkIn: p.check_in_time || "14:00",
                    checkOut: p.check_out_time || "12:00",
                  },
                ],
                checkIn: null,
                checkOut: null,
                guests: null,
              },
            };
          }
        }

        // TOOL 3: checkCancellationRefund (Quy định BR05)
        else if (functionName === "checkCancellationRefund") {
          let refCode = (args.refCode || "").trim().toUpperCase();
          if (refCode && !refCode.startsWith("#")) {
            refCode = "#" + refCode;
          }

          let bookingQuery = supabase
            .from("bookings")
            .select("*, places(id, title, location, price_per_night)");

          if (refCode) {
            bookingQuery = bookingQuery.eq("ref_code", refCode);
          } else if (userId) {
            bookingQuery = bookingQuery.eq("user_id", userId).eq("status", "booked").order("created_at", { ascending: false });
          }

          const { data: foundBooking } = await bookingQuery.maybeSingle();

          if (!foundBooking) {
            toolResult = {
              success: false,
              message: `Không tìm thấy đơn đặt phòng với mã ${refCode || "gần nhất"}. Vui lòng kiểm tra lại mã Ref.`,
            };
          } else {
            // Tính toán khoảng cách giờ check-in thực tế theo BR05
            const checkInDateTime = new Date(`${foundBooking.check_in}T14:00:00`);
            const now = new Date();
            const hoursUntilCheckIn = (checkInDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

            const total = Number(foundBooking.total);
            const pricePerNight = Number(foundBooking.price_per_night);

            let cancellationFee = 0;
            let refundAmount = total;
            let refundPolicy = "Hủy trước 48 giờ trở lên: Hoàn tiền 100% miễn phí";

            if (hoursUntilCheckIn >= 48) {
              cancellationFee = 0;
              refundAmount = total;
              refundPolicy = "Hủy trước check-in từ 48 giờ trở lên: Hoàn tiền 100% miễn phí";
            } else if (hoursUntilCheckIn > 0 && hoursUntilCheckIn < 48) {
              cancellationFee = pricePerNight;
              refundAmount = Math.max(0, total - pricePerNight);
              refundPolicy = `Hủy trong vòng 48 giờ trước check-in: Phạt 1 đêm ($${pricePerNight}), hoàn lại $${refundAmount}`;
            } else {
              cancellationFee = total;
              refundAmount = 0;
              refundPolicy = "Hủy sau giờ check-in: Không hoàn tiền (0%)";
            }

            toolResult = {
              success: true,
              bookingId: foundBooking.id,
              refCode: foundBooking.ref_code,
              placeTitle: foundBooking.places?.title,
              checkIn: foundBooking.check_in,
              checkOut: foundBooking.check_out,
              totalAmount: total,
              cancellationFee,
              refundAmount,
              policy: refundPolicy,
              isAlreadyCancelled: foundBooking.status === "cancelled",
            };

            // Tạo Rich Card để người dùng ấn nút Xác nhận hủy
            if (foundBooking.status !== "cancelled") {
              actionCard = {
                type: "cancellation_confirm",
                data: {
                  bookingId: foundBooking.id,
                  refCode: foundBooking.ref_code,
                  placeTitle: foundBooking.places?.title,
                  checkIn: foundBooking.check_in,
                  totalAmount: total,
                  cancellationFee,
                  refundAmount,
                  policy: refundPolicy,
                },
              };
            }
          }
        }

        // TOOL 4: searchPlaces — tìm chỗ còn trống theo địa điểm / ngày / giá / số khách
        else if (functionName === "searchPlaces") {
          const location = args.location ? String(args.location).trim().replace(/[,()]/g, "") : "";
          const checkIn = args.checkIn ? String(args.checkIn).trim() : "";
          const checkOut = args.checkOut ? String(args.checkOut).trim() : "";
          const maxPrice = args.maxPrice != null ? Number(args.maxPrice) : null;
          const guests = args.guests != null ? Number(args.guests) : null;

          let query = supabase
            .from("places")
            .select("id, title, location, place_type, price_per_night, rating, review_count, images, guests_capacity, check_in_time, check_out_time")
            .eq("is_visible", true);

          if (location) {
            query = query.or(`location.ilike.%${location}%,title.ilike.%${location}%`);
          }
          if (maxPrice != null && !Number.isNaN(maxPrice)) {
            query = query.lte("price_per_night", maxPrice);
          }
          if (guests != null && !Number.isNaN(guests)) {
            query = query.gte("guests_capacity", guests);
          }

          const { data: candidatePlaces } = await query.limit(10);
          let available = candidatePlaces || [];

          // Kiểm tra còn trống: loại các chỗ đã có đơn trùng khoảng ngày
          // (cùng logic chống trùng lịch như checkBookingConflict: status != cancelled
          //  và check_in < checkOut và check_out > checkIn)
          if (checkIn && checkOut && available.length > 0) {
            const { data: overlapping } = await supabase
              .from("bookings")
              .select("place_id, check_in, check_out")
              .neq("status", "cancelled")
              .lt("check_in", checkOut)
              .gt("check_out", checkIn);
            const bookedPlaceIds = new Set((overlapping || []).map((b: any) => b.place_id));
            available = available.filter((p: any) => !bookedPlaceIds.has(p.id));
          }

          // Sắp xếp theo rating giảm dần, lấy tối đa 3 chỗ
          available.sort((a: any, b: any) => Number(b.rating ?? 0) - Number(a.rating ?? 0));
          const topPlaces = available.slice(0, 3);

          if (topPlaces.length > 0) {
            const placeCards = topPlaces.map((p: any) => ({
              id: p.id,
              title: p.title,
              location: p.location,
              pricePerNight: p.price_per_night,
              rating: p.rating ?? 0,
              reviewCount: p.review_count ?? 0,
              image: p.images?.[0] || null,
              checkIn: p.check_in_time || "14:00",
              checkOut: p.check_out_time || "12:00",
            }));
            actionCard = {
              type: "place_card",
              data: {
                places: placeCards,
                checkIn: checkIn || null,
                checkOut: checkOut || null,
                guests: guests ?? null,
              },
            };
            // Danh sách gọn cho AI tóm tắt bằng lời (không gửi full row để tiết kiệm token)
            toolResult = {
              status: "found",
              count: topPlaces.length,
              places: placeCards.map((c: any) => ({
                title: c.title,
                location: c.location,
                pricePerNight: c.pricePerNight,
                rating: c.rating,
                reviewCount: c.reviewCount,
              })),
              checkIn: checkIn || null,
              checkOut: checkOut || null,
            };
          } else {
            toolResult = {
              status: "not_found",
              message: "Không tìm thấy chỗ nghỉ nào phù hợp với tiêu chí (địa điểm, ngày, khoảng giá, số khách).",
            };
          }
        }

        apiMessages.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content: JSON.stringify(toolResult),
        });
      }

      // --- VÒNG 3: Gọi lại AI lần 2 để tổng hợp câu trả lời tự nhiên từ tool results ---
      const secondResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "deepseek/deepseek-chat",
          messages: apiMessages,
          temperature: 0.3,
        }),
      });

      const secondData = await secondResponse.json();
      const finalReply = sanitizeReply(secondData?.choices?.[0]?.message?.content || "") || "Tôi đã tra cứu thông tin cho bạn.";

      return new Response(
        JSON.stringify({
          reply: finalReply,
          actionCard,
          executedTools,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Nếu AI trả lời trực tiếp mà không cần gọi tools
    return new Response(
      JSON.stringify({
        reply: sanitizeReply(assistantMessage.content || "") || "Tôi đã tra cứu thông tin cho bạn.",
        actionCard: null,
        executedTools: [],
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message || "Lỗi xử lý AI assistant" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
