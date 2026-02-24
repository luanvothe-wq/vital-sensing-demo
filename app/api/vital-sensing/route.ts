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
      // ライブラリ内で発生した分析エラーを扱う
      const errorMessage = apiError instanceof Error ? apiError.message : "分析に失敗しました";
      return NextResponse.json(
        { error: true, message: errorMessage },
        { status: 400 }
      );
    }
  } catch (err) {
    console.error("Vital Sensing API Proxy Error:", err);
    return NextResponse.json(
      { error: true, message: err instanceof Error ? err.message : "サーバーエラー" },
      { status: 500 }
    );
  }
}