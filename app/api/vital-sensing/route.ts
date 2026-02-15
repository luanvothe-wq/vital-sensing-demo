import { NextRequest, NextResponse } from "next/server";

// 指定: Node.js ランタイム（サーバーレス関数として動作させるため）
export const runtime = "nodejs";

// 環境変数から設定を読み込みます。デフォルト値は開発用です。
const API_BASE_URL = process.env.API_BASE_URL ?? "https://jvit-demo.ishachoku.com";
const LOGIN_EMAIL = process.env.LOGIN_EMAIL ?? "";
const LOGIN_PASSWORD = process.env.LOGIN_PASSWORD ?? "";
const BASIC_AUTH_ID = process.env.BASIC_AUTH_ID ?? "";
const BASIC_AUTH_PW = process.env.BASIC_AUTH_PW ?? "";

function getBasicAuthHeader(): string | null {
  if (!BASIC_AUTH_ID || !BASIC_AUTH_PW) return null;
  return "Basic " + Buffer.from(`${BASIC_AUTH_ID}:${BASIC_AUTH_PW}`).toString("base64");
}

// アクセストークン取得
async function getAccessToken(): Promise<string> {
  if (!LOGIN_EMAIL || !LOGIN_PASSWORD) throw new Error("LOGIN_EMAIL / LOGIN_PASSWORD が設定されていません");

  const formData = new FormData();
  formData.append("mailaddress", LOGIN_EMAIL);
  formData.append("password", LOGIN_PASSWORD);

  const basicHeader = getBasicAuthHeader();

  const res = await fetch(`${API_BASE_URL}/y-api/v1/user/user-login`, {
    method: "POST",
    headers: basicHeader ? { Authorization: basicHeader } : undefined,
    body: formData,
  });

  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { throw new Error("ログインAPIがJSONを返しませんでした"); }
  if (data.code !== 200) throw new Error(`認証失敗: ${data.message}`);
  console.log("=== トークン取得成功 ===");
  return data.data.access_token;
}

// POST: バイタルセンシング分析
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    if (!file) {
      return NextResponse.json({ error: true, message: "動画ファイルが見つかりません" }, { status: 400 });
    }

    console.log(`=== 動画受信: ${file.size} bytes, type: ${file.type} ===`);

    // アクセストークン取得（環境変数が未設定の場合は警告ログ）
    let token = "";
    try { token = await getAccessToken(); } catch (err) { console.warn("アクセストークン取得に失敗しました。環境変数を確認してください。", err); }

    // 外部APIへ転送
    const vitalUrl = `${API_BASE_URL}/y-api/v1/user/vital-sensing/get-signal`;
    const apiFormData = new FormData();
    apiFormData.append("file", file, "vital_scan.mp4");

    console.log("=== バイタルAPI送信 ===");
    const headers: Record<string, string> = {};
    if (token) headers.Authorization = `Bearer ${token}`;

    const res = await fetch(vitalUrl, {
      method: "POST",
      headers: Object.keys(headers).length ? headers : undefined,
      body: apiFormData,
    });

    const text = await res.text();
    console.log("API status:", res.status, "body:", text.substring(0, 300));

    let data;
    try { data = JSON.parse(text); } catch { throw new Error("APIがJSONを返しませんでした"); }

    if (data.code === 200 && data.data) {
      console.log("=== 分析成功！ ===");
      return NextResponse.json({ code: 200, data: data.data });
    }

    return NextResponse.json(
      { error: true, message: data.message || "分析に失敗しました" },
      { status: 400 }
    );
  } catch (err) {
    console.error("Vital Sensing Error:", err);
    return NextResponse.json(
      { error: true, message: err instanceof Error ? err.message : "サーバーエラー" },
      { status: 500 }
    );
  }
}