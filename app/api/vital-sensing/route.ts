import { NextRequest, NextResponse } from "next/server";
import { analyzeVitalSignal } from "@/lib/online-doctor";

// 指定: Node.js ランタイム（サーバーレス関数として動作させるため）
export const runtime = "nodejs";

// POST: バイタルセンシング分析
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    if (!file) {
      return NextResponse.json(
        { error: true, message: "動画ファイルが見つかりません" },
        { status: 400 }
      );
    }

    console.log(`=== 動画受信: ${file.size} bytes, type: ${file.type} ===`);

    try {
      // 外部APIロジックをラップしたライブラリ関数を呼び出す
      const vitalData = await analyzeVitalSignal(file);

      // 成功レスポンスを返す
      return NextResponse.json({ code: 200, data: vitalData });
    } catch (apiError: unknown) {
      // サーバー側に詳細エラーを記録（クライアントには公開しない）
      console.error("[VitalSensing] External API error:", apiError);

      // クライアントには汎用メッセージのみを返す（技術的詳細を隠蔽）
      return NextResponse.json(
        { error: true, message: "バイタルサインの分析に失敗しました" },
        { status: 502 }  // 502 Bad Gateway: 上流サービスのエラー
      );
    }
  } catch (err) {
    console.error("[VitalSensing] Proxy unexpected error:", err);
    return NextResponse.json(
      { error: true, message: "サーバーエラーが発生しました" },
      { status: 500 }
    );
  }
}