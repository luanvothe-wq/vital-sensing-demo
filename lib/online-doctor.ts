/**
 * lib/online-doctor.ts
 * 
 * Library to wrap the external "Online Doctor" Vital Sensing API integration.
 * It manages getting an access token using fallback credentials and submitting video blobs for analysis.
 */

// Environment Variables - credentials MUST be set via env vars, no hardcode fallbacks.
const API_BASE_URL = process.env.API_BASE_URL ?? "https://jvit-demo.ishachoku.com"; // non-sensitive default OK
const LOGIN_EMAIL = process.env.LOGIN_EMAIL; // Required: set in Vercel / .env.local
const LOGIN_PASSWORD = process.env.LOGIN_PASSWORD; // Required: set in Vercel / .env.local

export interface VitalData {
    bpm: string;
    bpv1: string;
    bpv0: string;
    S2: string;
    LTv: string;
}

export interface VitalAnalysisResponse {
    code: number;
    message?: string;
    data?: VitalData;
}

/**
 * Fetches the Access Token using the configured Email/Password combination
 * via the y-api user-login endpoint.
 */
export async function getAccessToken(): Promise<string> {
    if (!LOGIN_EMAIL || !LOGIN_PASSWORD) {
        throw new Error("LOGIN_EMAIL / LOGIN_PASSWORD が設定されていません");
    }

    const formData = new FormData();
    formData.append("mailaddress", LOGIN_EMAIL);
    formData.append("password", LOGIN_PASSWORD);

    const loginUrl = `${API_BASE_URL}/y-api/v1/user/user-login`;
    console.log(`\n============== API LOG: getAccessToken ==============`);
    console.log(`[REQ] POST ${loginUrl}`);
    console.log(`[REQ] Payload: mailaddress=${LOGIN_EMAIL}, password=***`);

    const res = await fetch(loginUrl, {
        method: "POST",
        body: formData,
    });

    const text = await res.text();
    console.log(`[RES] Status: ${res.status}`);
    console.log(`[RES] Body: ${text.substring(0, 500)}`); // Log up to 500 chars

    let data;
    try {
        data = JSON.parse(text);
    } catch {
        throw new Error("ログインAPIがJSONを返しませんでした: " + text.substring(0, 100));
    }

    if (data.code !== 200) {
        throw new Error(`認証失敗: ${data.message || "Unknown error"}`);
    }

    console.log("=== OnlineDoctor: トークン取得成功 ===");
    console.log(`=====================================================\n`);
    return data.data.access_token;
}

/**
 * Analyzes the given video (mp4 encoded) file using the external Vital Sensing API.
 * Features strict error handling without silent fallbacks.
 *
 * @param file The mp4 Blob/File object recorded from the user's camera.
 */
export async function analyzeVitalSignal(file: Blob | File): Promise<VitalData> {
    console.log(`[OnlineDoctor] Bắt đầu phân tích video: size=${file.size} type=${file.type}`);

    // Get token rigorously without fallback
    const token = await getAccessToken();

    const vitalUrl = `${API_BASE_URL}/y-api/v1/user/vital-sensing/get-signal`;

    // Convert Blob to File if it's just a Blob
    // Không truyền filename lần 2 vào append() để tránh conflict trong Node.js multipart
    const uploadFile = file instanceof File
        ? file
        : new File([file], "vital_scan.mp4", { type: file.type || "video/mp4" });

    const apiFormData = new FormData();
    // Chỉ truyền file object, KHÔNG truyền filename riêng (File đã có .name)
    // Tránh behavior khác nhau giữa Bun và Node.js khi set filename 2 lần
    apiFormData.append("file", uploadFile);
    apiFormData.append("patientId", "3134_0");

    console.log(`\n============== API LOG: analyzeVitalSignal ==============`);
    console.log(`[REQ] POST ${vitalUrl}`);
    console.log(`[REQ] Headers: Authorization: Bearer ${token.substring(0, 10)}...`);
    console.log(`[REQ] FormData keys:`, Array.from((apiFormData as any).keys() || []));
    console.log(`[REQ] Attached File: name=${uploadFile.name}, size=${uploadFile.size}, type=${uploadFile.type}`);

    // QUAN TRỌNG: Không set Content-Type thủ công khi gửi FormData.
    // Node.js/fetch sẽ tự động thêm `Content-Type: multipart/form-data; boundary=...`
    // Nếu set thủ công sẽ mất boundary và API sẽ không parse được file.
    const res = await fetch(vitalUrl, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: apiFormData,
    });

    const text = await res.text();
    console.log(`[RES] Status: ${res.status}`);
    console.log(`[RES] Body: ${text.substring(0, 1000)}`); // Log up to 1000 chars
    console.log(`=========================================================\n`);

    let responseData;
    try {
        responseData = JSON.parse(text);
    } catch {
        throw new Error(`API không trả về định dạng JSON (Status: ${res.status}): ${text.substring(0, 100)}`);
    }

    // Kiểm tra lỗi: cả HTTP status lẫn business error trong body
    const businessCode = typeof responseData.code === "number" ? responseData.code : 0;
    if (res.status >= 400 || businessCode >= 400 || responseData.error === true) {
        console.error(`[OnlineDoctor] Lỗi từ API:`, responseData);
        const msg = Array.isArray(responseData.message)
            ? responseData.message.join(" | ")
            : responseData.message || "Lỗi phân tích Vital Signal (Không có message cụ thể)";
        throw new Error(msg);
    }

    console.log("[OnlineDoctor] === Phân tích thành công! ===");
    const payload = responseData.data || {};
    const vital = payload.enhance_response?.data ?? payload;

    return vital as VitalData;
}
