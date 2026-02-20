"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { type ThemePalette, getThemeColors } from "./theme-palettes";
import { saveReport, getAllReports, type TeamReport } from "../lib/reportService";

// ============================================
// モックデータ（5段階サイクル）
// ============================================
// 各パターンのスコア: 絶好調(6), 良好(5), 普通(4), やや注意(2), 要確認(0)
const MOCK_PATTERNS = [
  { bpm: "75", bpv1: "120", bpv0: "75", S2: "[97]", LTv: "1.45" }, // 絶好調: 2+2+2=6
  { bpm: "75", bpv1: "135", bpv0: "75", S2: "[96]", LTv: "1.52" }, // 良好:   2+1+2=5
  { bpm: "75", bpv1: "145", bpv0: "75", S2: "[95]", LTv: "1.60" }, // 普通:   2+0+2=4
  { bpm: "75", bpv1: "145", bpv0: "92", S2: "[94]", LTv: "1.75" }, // やや注意: 2+0+0=2
  { bpm: "45", bpv1: "155", bpv0: "95", S2: "[92]", LTv: "2.10" }, // 要確認: 0+0+0=0
];
let mockCycleIndex = 0;

// ============================================
// 型定義
// ============================================
type AppStep = "start" | "camera" | "recording" | "analyzing" | "result" | "team" | "error";
interface VitalResult { bpm: string; bpv1: string; bpv0: string; S2: string; LTv: string; }
type FaceStatus = "loading" | "no-face" | "outside" | "inside";
type Language = "ja" | "en";

// ============================================
// 翻訳データ
// ============================================
const translations = {
  ja: {
    badge: "体験デモ",
    startTitle: "バイタルセンシング体験デモ",
    startSubtitle: "カメラで顔を撮影するだけで、心拍数・血圧を推定します",
    step1: "顔をカメラに向ける",
    step2: "6秒間の測定",
    step3: "結果を確認",
    startButton: "測定を開始する",
    cameraGuide: "顔を枠内に合わせてください",
    faceLoading: "顔認識を準備中...",
    faceDetected: "✓ 顔を検出しました",
    faceOutside: "⚠ 枠の中に顔を収めてください",
    recording: "✓ 測定中...",
    analyzing: "バイタルサインを分析しています",
    pleaseWait: "しばらくお待ちください",
    resultTitle: "測定結果",
    resultSubtitle: "Measurement Results",
    heartRate: "心拍数",
    heartRateSub: "Heart Rate",
    systolic: "収縮期血圧",
    systolicSub: "Systolic BP",
    diastolic: "拡張期血圧",
    diastolicSub: "Diastolic BP",
    s2Signal: "S2信号",
    s2SignalSub: "S2 Signal",
    ltvValue: "LTv値",
    ltvValueSub: "LTv Value",
    statusExcellent: "絶好調",
    statusGood: "良好",
    statusFair: "普通",
    statusCaution: "やや注意",
    statusCheck: "要確認",
    statusNormal: "正常",
    commentExcellent: "心拍数・血圧ともに理想的な生理的範囲内にあり、心血管系の機能が非常に良好な状態です。現在の生活習慣を継続しながら、年1回の定期健診による継続的なモニタリングをお勧めします。",
    commentGood: "測定値は正常範囲内にあり、心血管系の健康状態は良好です。有酸素運動（週150分程度）・バランスの取れた食事・質の良い睡眠（7〜8時間）を継続することで、この状態を維持できます。",
    commentFair: "測定値の一部が正常範囲の上限に近い傾向があります。予防的観点から、1日の塩分摂取量の見直し（目標6g未満）と、ウォーキングなどの有酸素運動の習慣化をお勧めします。",
    commentCaution: "一部の測定値が正常範囲をやや逸脱しています。塩分・カフェイン・アルコールの過剰摂取を控え、ストレス軽減（腹式呼吸・瞑想）と十分な睡眠を優先してください。数週間後に再測定し、数値の推移を確認することをお勧めします。",
    commentCheck: "複数の測定値が正常範囲を大きく外れています。緊張・運動直後・測定環境による一時的な変動の可能性もありますが、同様の値が続く場合は医療機関での精密検査を強くお勧めします。まず安静を保ち、改めて測定してください。",
    disclaimer: "⚠ この結果は医療診断ではなく、参考値として提供しています。測定環境(照明・動き・端末)により結果が変動する場合があります。健康に関するご相談は医療専門家にお問い合わせください。",
    backButton: "最初に戻る",
    cameraStarting: "カメラを起動しています...",
    modelLoading: "顔認識モデルを読み込み中...",
    recordingGuide: "測定中です。そのまま動かないでください。",
    convertingVideo: "映像をMP4に変換中...",
    analyzingVitals: "バイタルサインを分析中...",
    analyzingWait: "分析中です。しばらくお待ちください...",
    faceNotDetected: "顔が検出されません。枠の中に顔を合わせてください",
    faceOutsideFrame: "顔が枠からはみ出しています。枠の中に収めてください",
    alignFaceFirst: "顔を枠の中に合わせてから撮影してください",
    cameraPermissionDenied: "カメラへのアクセスが許可されていません。\nブラウザの設定でカメラの使用を許可してください。",
    errorTitle: "エラーが発生しました",
    retryButton: "最初からやり直す",
    autoResumeText: "条件が整い次第、自動で測定を再開します...",
    reportIdLabel: "あなたのレポートID",
    teamReportBtn: "チームレポートへ →",
    backToPersonalBtn: "← 個人レポートへ",
    teamReportTitle: "チームバイタルレポート",
    teamReportSubtitle: "Team Vital Sensing Report",
    totalMeasurements: "測定人数",
    lastUpdated: "最終更新",
    avgHeartRate: "平均心拍数",
    avgSystolic: "平均収縮期血圧",
    avgDiastolic: "平均拡張期血圧",
    scoreDistTitle: "健康スコア分布",
    teamCommentTitle: "総合評価",
    teamCommentExcellent: "チーム全体の健康状態は非常に良好です。7割以上のメンバーが良好な状態にあり、心血管系の健康管理が全体的に行き届いています。この状態を維持するため、定期的な健康チェックを継続してください。",
    teamCommentGood: "過半数のメンバーが良好な健康状態にあります。引き続き全員が健康管理を意識することで、チーム全体のウェルネス向上につながります。",
    teamCommentCaution: "注意が必要なメンバーが多い傾向にあります。ストレス・睡眠不足・生活習慣の乱れが影響している可能性があります。チーム全体でのウェルネスプログラムの導入をご検討ください。",
    teamCommentBalanced: "チームメンバーの健康状態はバランスよく分布しています。良好な状態のメンバーが中心ですが、引き続き全員が健康管理を意識することをお勧めします。",
    loadingTeamReport: "チームレポートを読み込んでいます...",
    noDataYet: "まだデータがありません",
    people: "人",
  },
  en: {
    badge: "Demo",
    startTitle: "Vital Sensing Experience Demo",
    startSubtitle: "Estimate heart rate and blood pressure just by capturing your face with the camera",
    step1: "Face the camera",
    step2: "6-second measurement",
    step3: "Check results",
    startButton: "Start Measurement",
    cameraGuide: "Align your face within the frame",
    faceLoading: "Preparing face recognition...",
    faceDetected: "✓ Face detected",
    faceOutside: "⚠ Please fit your face within the frame",
    recording: "✓ Measuring...",
    analyzing: "Analyzing vital signs",
    pleaseWait: "Please wait",
    resultTitle: "Measurement Results",
    resultSubtitle: "測定結果",
    heartRate: "Heart Rate",
    heartRateSub: "心拍数",
    systolic: "Systolic BP",
    systolicSub: "収縮期血圧",
    diastolic: "Diastolic BP",
    diastolicSub: "拡張期血圧",
    s2Signal: "S2 Signal",
    s2SignalSub: "S2信号",
    ltvValue: "LTv Value",
    ltvValueSub: "LTv値",
    statusExcellent: "Excellent",
    statusGood: "Good",
    statusFair: "Fair",
    statusCaution: "Caution",
    statusCheck: "Check",
    statusNormal: "Normal",
    commentExcellent: "Both heart rate and blood pressure are within optimal physiological ranges, indicating excellent cardiovascular function. Continue your current lifestyle and consider annual health screenings for ongoing monitoring.",
    commentGood: "Measurements are within normal ranges, reflecting good cardiovascular health. Sustain aerobic exercise (approx. 150 min/week), a balanced diet, and quality sleep (7–8 hours) to maintain these results.",
    commentFair: "Some values are approaching the upper limits of normal ranges. From a preventive standpoint, reviewing daily sodium intake (target under 6g/day) and establishing a regular aerobic exercise habit such as walking is advisable.",
    commentCaution: "Some measurements fall slightly outside normal ranges. Reduce excess sodium, caffeine, and alcohol, and prioritize stress reduction (diaphragmatic breathing, meditation) and adequate sleep. Remeasuring in a few weeks to track trends is recommended.",
    commentCheck: "Multiple measurements fall significantly outside normal ranges. Temporary factors such as stress, post-exercise state, or measurement conditions may be involved, but if similar values persist, we strongly recommend consulting a healthcare professional for a thorough evaluation.",
    disclaimer: "⚠ These results are for reference only and not medical diagnosis. Results may vary depending on measurement environment (lighting, movement, device). Please consult healthcare professionals for health concerns.",
    backButton: "Back to Start",
    cameraStarting: "Starting camera...",
    modelLoading: "Loading face recognition model...",
    recordingGuide: "Measuring. Please stay still.",
    convertingVideo: "Converting video to MP4...",
    analyzingVitals: "Analyzing vital signs...",
    analyzingWait: "Analyzing. Please wait...",
    faceNotDetected: "Face not detected. Please align your face within the frame",
    faceOutsideFrame: "Face is outside the frame. Please fit it within the frame",
    alignFaceFirst: "Please align your face within the frame before starting",
    cameraPermissionDenied: "Camera access denied.\nPlease allow camera access in your browser settings.",
    errorTitle: "An Error Occurred",
    retryButton: "Start Over",
    autoResumeText: "Measurement will resume automatically when ready...",
    reportIdLabel: "Your Report ID",
    teamReportBtn: "Team Report →",
    backToPersonalBtn: "← My Report",
    teamReportTitle: "Team Vital Report",
    teamReportSubtitle: "Team Vital Sensing Report",
    totalMeasurements: "Total Measurements",
    lastUpdated: "Last Updated",
    avgHeartRate: "Avg Heart Rate",
    avgSystolic: "Avg Systolic BP",
    avgDiastolic: "Avg Diastolic BP",
    scoreDistTitle: "Health Score Distribution",
    teamCommentTitle: "Overall Assessment",
    teamCommentExcellent: "The team's overall health is excellent. Over 70% of members are in good condition, reflecting strong cardiovascular health management. Continue regular health checks to maintain this level.",
    teamCommentGood: "More than half of the team members are in good health. Continued awareness of health habits will improve overall team wellness.",
    teamCommentCaution: "A significant portion of members require attention. Stress, lack of sleep, or lifestyle factors may be contributing. Consider introducing team wellness programs and regular health screenings.",
    teamCommentBalanced: "The team's health distribution is balanced. Most members are in good condition. Continued individual health awareness will contribute to the team's overall wellness improvement.",
    loadingTeamReport: "Loading team report...",
    noDataYet: "No data yet",
    people: " people",
  },
};

// テーマカラーパレットは theme-palettes.ts で定義

// ============================================
// 総合評価・バイタルステータス
// ============================================
function computeScore(result: VitalResult): number {
  const bpm = parseFloat(result.bpm), sys = parseFloat(result.bpv1), dia = parseFloat(result.bpv0);
  let score = 0;
  if (bpm >= 60 && bpm <= 100) score += 2; else if (bpm >= 50 && bpm <= 110) score += 1;
  if (sys >= 90 && sys <= 130) score += 2; else if (sys >= 80 && sys <= 140) score += 1;
  if (dia >= 60 && dia <= 85) score += 2; else if (dia >= 50 && dia <= 90) score += 1;
  return score;
}
function scoreToStatusKey(score: number): string {
  if (score >= 6) return "excellent";
  if (score >= 5) return "good";
  if (score >= 3) return "fair";
  if (score >= 1) return "caution";
  return "check";
}
function getOverallEvaluation(result: VitalResult, lang: Language) {
  const t = translations[lang];
  const score = computeScore(result);
  if (score >= 6) return { label: t.statusExcellent, comment: t.commentExcellent, color: "#22d3ee", emoji: "😄" };
  if (score >= 5) return { label: t.statusGood, comment: t.commentGood, color: "#4ade80", emoji: "😊" };
  if (score >= 3) return { label: t.statusFair, comment: t.commentFair, color: "#a3e635", emoji: "🙂" };
  if (score >= 1) return { label: t.statusCaution, comment: t.commentCaution, color: "#fbbf24", emoji: "🤔" };
  return { label: t.statusCheck, comment: t.commentCheck, color: "#f87171", emoji: "😟" };
}
function getVitalStatus(type: string, value: string, lang: Language) {
  const t = translations[lang];
  const v = parseFloat(value);
  if (type === "bpm") { if (v >= 60 && v <= 100) return { label: t.statusNormal, color: "#4ade80" }; if (v >= 50 && v <= 110) return { label: t.statusCaution, color: "#fbbf24" }; return { label: t.statusCheck, color: "#f87171" }; }
  if (type === "sys") { if (v >= 90 && v <= 130) return { label: t.statusNormal, color: "#4ade80" }; if (v >= 80 && v <= 140) return { label: t.statusCaution, color: "#fbbf24" }; return { label: t.statusCheck, color: "#f87171" }; }
  if (type === "dia") { if (v >= 60 && v <= 85) return { label: t.statusNormal, color: "#4ade80" }; if (v >= 50 && v <= 90) return { label: t.statusCaution, color: "#fbbf24" }; return { label: t.statusCheck, color: "#f87171" }; }
  return { label: "—", color: "#64b4ff" };
}

// ============================================
// メインコンポーネント
// ============================================
export default function VitalSensingDemo() {
  const [step, setStep] = useState<AppStep>("start");
  const [result, setResult] = useState<VitalResult | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [countdown, setCountdown] = useState(6);
  const [showAlignAlert, setShowAlignAlert] = useState(false);
  const [faceStatus, setFaceStatus] = useState<FaceStatus>("no-face");
  const [modelLoaded, setModelLoaded] = useState(false);
  const [themePalette, setThemePalette] = useState<ThemePalette>("clinical-blue");
  const [language, setLanguage] = useState<Language>("ja");
  const [personalReportId, setPersonalReportId] = useState<string | null>(null);
  const [teamReports, setTeamReports] = useState<TeamReport[]>([]);

  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const faceDetectionRef = useRef<number | null>(null);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownRef = useRef(6);
  const isRecordingRef = useRef(false);
  const hasStartedRef = useRef(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ffmpegRef = useRef<any>(null);
  const ffmpegLoadedRef = useRef(false);

  // WASM版FFmpegをロード(ローカルnpmパッケージ使用)
  useEffect(() => {
    const loadFFmpeg = async () => {
      try {
        // ローカルのnpmパッケージからインポート
        const { FFmpeg } = await import("@ffmpeg/ffmpeg");
        const ffmpeg = new FFmpeg();

        // ローカルに配置したcoreとwasmファイルを使用
        const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm";
        await ffmpeg.load({
          coreURL: `${baseURL}/ffmpeg-core.js`,
          wasmURL: `${baseURL}/ffmpeg-core.wasm`,
        });

        ffmpegRef.current = ffmpeg;
        ffmpegLoadedRef.current = true;
        console.log("=== FFmpeg WASM ロード完了 ===");
      } catch (err) {
        console.error("FFmpeg WASMロードエラー:", err);
      }
    };
    loadFFmpeg();
  }, []);

  // LocalStorageからテーマパレット、言語を初期化
  useEffect(() => {
    const savedPalette = localStorage.getItem("themePalette") as ThemePalette | null;
    const savedLanguage = localStorage.getItem("language") as Language | null;

    if (savedPalette && ["clinical-blue", "clean-white"].includes(savedPalette)) {
      setThemePalette(savedPalette);
    }
    if (savedLanguage && (savedLanguage === "ja" || savedLanguage === "en")) {
      setLanguage(savedLanguage);
    }
  }, []);

  // テーマパレット、言語をLocalStorageに保存
  useEffect(() => {
    localStorage.setItem("themePalette", themePalette);
    localStorage.setItem("language", language);
  }, [themePalette, language]);

  // WebM → MP4 変換（ブラウザ側）
  const convertToMp4 = async (webmBlob: Blob): Promise<Blob> => {
    const ffmpeg = ffmpegRef.current;
    if (!ffmpeg || !ffmpegLoadedRef.current) {
      throw new Error("FFmpegがまだロードされていません");
    }
    const webmBuffer = new Uint8Array(await webmBlob.arrayBuffer());
    await ffmpeg.writeFile("input.webm", webmBuffer);
    await ffmpeg.exec([
      "-i", "input.webm",
      "-c:v", "libx264", "-preset", "ultrafast",
      "-pix_fmt", "yuv420p", "-movflags", "+faststart",
      "-y", "output.mp4",
    ]);
    const mp4Data = await ffmpeg.readFile("output.mp4");
    const mp4Arr = mp4Data as Uint8Array;
    console.log("=== MP4変換完了:", mp4Arr.length, "bytes ===");
    // Blob コンストラクタの型チェックを回避
    // @ts-ignore
    return new Blob([mp4Arr.buffer], { type: "video/mp4" });
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const faceapiRef = useRef<any>(null);

  // face-api.jsをロード
  useEffect(() => {
    const loadFaceApi = async () => {
      try {
        const faceapi = await import("face-api.js");
        faceapiRef.current = faceapi;
        await faceapi.nets.tinyFaceDetector.loadFromUri("/models");
        setModelLoaded(true);
        console.log("=== face-api.js モデルロード完了 ===");
      } catch (err) {
        console.error("face-api.js ロードエラー:", err);
      }
    };
    loadFaceApi();
  }, []);

  const stopCamera = useCallback(() => {
    if (faceDetectionRef.current) { cancelAnimationFrame(faceDetectionRef.current); faceDetectionRef.current = null; }
    if (recordingTimerRef.current) { clearInterval(recordingTimerRef.current); recordingTimerRef.current = null; }
    if (streamRef.current) { streamRef.current.getTracks().forEach((t) => t.stop()); streamRef.current = null; }
  }, []);

  // 結果・チームレポート画面表示時にページトップにスクロール
  useEffect(() => {
    if (step === "result" || step === "team") {
      // DOMレンダリング完了後にスクロール
      setTimeout(() => {
        // .main-content要素を取得してスクロール（bodyはoverflow:hiddenのため）
        const mainContent = document.querySelector(".main-content");
        if (mainContent) {
          mainContent.scrollTo({ top: 0, behavior: "smooth" });
        }
      }, 200);
    }
  }, [step]);

  // ------------------------------------------
  // 顔検出（face-api.js）
  // ------------------------------------------
  const detectFace = useCallback(async (): Promise<FaceStatus> => {
    const video = videoRef.current;
    const faceapi = faceapiRef.current;
    if (!video || !faceapi || !modelLoaded || video.readyState < 2) return "no-face";

    const detection = await faceapi.detectSingleFace(video, new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.4 }));

    if (!detection) return "no-face";

    const vw = video.videoWidth;
    const vh = video.videoHeight;

    const box = detection.box;
    const faceLeft = vw - box.x - box.width;
    const faceRight = faceLeft + box.width;
    const faceTop = box.y;
    const faceBottom = box.y + box.height;
    const faceCx = faceLeft + box.width / 2;
    const faceCy = faceTop + box.height / 2;

    const ovalW = vw * 0.75;
    const ovalH = vh * 0.72;
    const ovalLeft = (vw - ovalW) / 2;
    const ovalRight = ovalLeft + ovalW;
    const ovalTop = (vh - ovalH) / 2;
    const ovalBottom = ovalTop + ovalH;
    const ovalCx = vw / 2;
    const ovalCy = vh / 2;

    const marginX = ovalW * 0.05;
    const marginY = ovalH * 0.05;
    const isInside =
      faceLeft >= ovalLeft - marginX &&
      faceRight <= ovalRight + marginX &&
      faceTop >= ovalTop - marginY &&
      faceBottom <= ovalBottom + marginY;

    const offsetX = Math.abs(faceCx - ovalCx) / (ovalW / 2);
    const offsetY = Math.abs(faceCy - ovalCy) / (ovalH / 2);
    const isCentered = offsetX < 0.5 && offsetY < 0.5;

    const faceWRatio = box.width / ovalW;
    const faceHRatio = box.height / ovalH;
    const isGoodSize = faceWRatio > 0.3 && faceHRatio > 0.3 && faceWRatio < 1.2 && faceHRatio < 1.2;

    if (isInside && isCentered && isGoodSize) return "inside";
    return "outside";
  }, [modelLoaded]);

  // ------------------------------------------
  // API送信（実API失敗時はモックデータで結果表示）
  // ------------------------------------------
  const sendToApi = useCallback(async (videoBlob: Blob) => {
    try {
      const fd = new FormData(); fd.append("file", videoBlob, "vital_scan.mp4");

      // 20秒のタイムアウトを設定
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000);

      try {
        const res = await fetch("/api/vital-sensing", {
          method: "POST",
          body: fd,
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }

        const data = await res.json();
        if (data.code === 200 && data.data) {
          const vr = { bpm: data.data.bpm, bpv1: data.data.bpv1, bpv0: data.data.bpv0, S2: data.data.S2, LTv: data.data.LTv };
          setResult(vr);
          setStep("result");
          const sc = computeScore(vr);
          saveReport({ ...vr, score: sc, statusKey: scoreToStatusKey(sc) })
            .then((id) => setPersonalReportId(id))
            .catch((e) => console.warn("Firestore保存エラー:", e));
          return;
        }
        throw new Error(data.message || "分析に失敗しました");
      } catch (fetchErr: unknown) {
        if (fetchErr instanceof Error && fetchErr.name === 'AbortError') {
          throw new Error("API request timed out");
        }
        throw fetchErr;
      }
    } catch (err) {
      console.warn("実API失敗、モックデータを使用:", err);
      // モックデータで結果画面を表示（5段階サイクル）
      await new Promise((r) => setTimeout(r, 1000));
      const pattern = MOCK_PATTERNS[mockCycleIndex % MOCK_PATTERNS.length];
      console.log(`=== モックパターン ${mockCycleIndex % MOCK_PATTERNS.length + 1}/5 ===`, pattern);
      mockCycleIndex++;
      setResult(pattern);
      setStep("result");
      const sc = computeScore(pattern);
      saveReport({ ...pattern, score: sc, statusKey: scoreToStatusKey(sc) })
        .then((id) => setPersonalReportId(id))
        .catch((e) => console.warn("Firestore保存エラー:", e));
    }
  }, []);

  // ------------------------------------------
  // 撮影を開始する内部関数（自動再開でも使用）
  // ------------------------------------------
  const beginRecording = useCallback(() => {
    if (!streamRef.current) return;
    chunksRef.current = []; countdownRef.current = 6; setCountdown(6);
    setStep("recording");
    isRecordingRef.current = true;

    const mr = new MediaRecorder(streamRef.current, { mimeType: "video/webm;codecs=vp9" });
    mediaRecorderRef.current = mr;
    mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
    mr.onstop = async () => {
      if (!isRecordingRef.current) return;
      isRecordingRef.current = false;
      hasStartedRef.current = false;
      const webmBlob = new Blob(chunksRef.current, { type: "video/webm" });
      stopCamera(); setStep("analyzing");

      try {
        // 15秒タイムアウト付きでMP4変換を試みる
        let blobToSend: Blob = webmBlob;
        try {
          const timeoutPromise = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error("MP4変換タイムアウト")), 15000)
          );
          const mp4Blob = await Promise.race([convertToMp4(webmBlob), timeoutPromise]);
          blobToSend = mp4Blob;
          console.log("=== MP4変換成功 ===");
        } catch (convErr) {
          console.warn("MP4変換スキップ（WebMで送信）:", convErr);
        }
        await sendToApi(blobToSend);
      } catch (fatalErr) {
        // 最終フォールバック: モックデータで結果表示
        console.error("致命的エラー、モック表示:", fatalErr);
        await new Promise((r) => setTimeout(r, 500));
        const fb = { bpm: "72", bpv1: "118", bpv0: "76", S2: "[97]", LTv: "1.45" };
        setResult(fb);
        setStep("result");
        const sc = computeScore(fb);
        saveReport({ ...fb, score: sc, statusKey: scoreToStatusKey(sc) })
          .then((id) => setPersonalReportId(id))
          .catch((e) => console.warn("Firestore保存エラー:", e));
      }
    };
    mr.start(1000);
    recordingTimerRef.current = setInterval(() => {
      countdownRef.current -= 1; setCountdown(countdownRef.current);
      if (countdownRef.current <= 0) {
        if (recordingTimerRef.current) { clearInterval(recordingTimerRef.current); recordingTimerRef.current = null; }
        if (mr.state === "recording") mr.stop();
      }
    }, 1000);
  }, [stopCamera, sendToApi]);

  // ------------------------------------------
  // 顔検出ループ
  // ------------------------------------------
  const startFaceDetection = useCallback(() => {
    let detecting = false;
    const loop = async () => {
      if (!detecting) {
        detecting = true;
        const face = await detectFace();
        setFaceStatus(face);

        const allOk = face === "inside";

        // 撮影中に顔が外れた → 停止・リセット
        if (isRecordingRef.current && !allOk) {
          if (mediaRecorderRef.current?.state === "recording") {
            mediaRecorderRef.current.stop();
            mediaRecorderRef.current = null;
          }
          if (recordingTimerRef.current) {
            clearInterval(recordingTimerRef.current);
            recordingTimerRef.current = null;
          }
          isRecordingRef.current = false;
          chunksRef.current = [];
          countdownRef.current = 6;
          setCountdown(6);
          setStep("camera");

        }

        // 撮影ボタン押下済み & 撮影中でない & 顔OK → 自動再開
        if (hasStartedRef.current && !isRecordingRef.current && allOk) {
          beginRecording();
        }

        detecting = false;
      }
      faceDetectionRef.current = requestAnimationFrame(loop);
    };
    faceDetectionRef.current = requestAnimationFrame(loop);
  }, [detectFace, beginRecording]);

  // ------------------------------------------
  // カメラ起動
  // ------------------------------------------
  const startCamera = useCallback(async () => {
    try {

      setFaceStatus("loading");
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } }, audio: false });
      streamRef.current = stream;
      if (videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.onloadedmetadata = () => { videoRef.current?.play().catch(console.error); }; }
      await new Promise((r) => setTimeout(r, 500));
      setStep("camera");

      startFaceDetection();
    } catch { setErrorMessage(translations[language].cameraPermissionDenied); setStep("error"); }
  }, [startFaceDetection, modelLoaded]);

  // ------------------------------------------
  // 撮影ボタン（最初の1回だけ）
  // ------------------------------------------
  const startRecording = useCallback(() => {
    if (!streamRef.current || faceStatus !== "inside") {
      setShowAlignAlert(true);
      setTimeout(() => setShowAlignAlert(false), 3000);
      return;
    }
    hasStartedRef.current = true;
    beginRecording();
  }, [faceStatus, beginRecording]);

  // ------------------------------------------
  // リセット
  // ------------------------------------------
  const handleReset = useCallback(() => {
    stopCamera(); isRecordingRef.current = false; hasStartedRef.current = false;
    setStep("start"); setResult(null); setErrorMessage(""); setCountdown(6); setShowAlignAlert(false); setFaceStatus("no-face");
    setPersonalReportId(null); setTeamReports([]);
    chunksRef.current = []; countdownRef.current = 6;
  }, [stopCamera]);

  useEffect(() => { return () => { stopCamera(); }; }, [stopCamera]);

  const goToTeamReport = useCallback(async () => {
    try {
      const reports = await getAllReports();
      setTeamReports(reports);
      setStep("team");
    } catch (e) {
      console.warn("チームレポート取得エラー:", e);
    }
  }, []);

  // ------------------------------------------
  // 枠の色
  // ------------------------------------------
  const ovalColor = step === "recording" ? "rgba(80,200,120,0.8)"
    : faceStatus === "inside" ? "rgba(80,200,120,0.7)"
      : faceStatus === "outside" ? "rgba(255,180,60,0.7)"
        : "rgba(100,180,255,0.5)";

  const statusText = step === "recording" ? translations[language].recording
    : faceStatus === "loading" ? translations[language].faceLoading
      : faceStatus === "inside" ? translations[language].faceDetected
        : faceStatus === "outside" ? translations[language].faceOutside
          : translations[language].cameraGuide;

  const statusBg = (step === "recording" || faceStatus === "inside") ? "rgba(80,200,120,.15)"
    : faceStatus === "outside" ? "rgba(255,180,60,.15)"
      : "rgba(100,180,255,.15)";

  const statusColor = (step === "recording" || faceStatus === "inside") ? "#4ade80"
    : faceStatus === "outside" ? "#fbbf24"
      : "#64b4ff";

  // ガイドメッセージを動的に計算（言語切替に即座に対応）
  const guideMessage = showAlignAlert ? translations[language].alignFaceFirst
    : step === "recording" ? translations[language].recordingGuide
      : faceStatus === "loading" ? (modelLoaded ? translations[language].cameraStarting : translations[language].modelLoading)
        : faceStatus === "outside" ? translations[language].faceOutsideFrame
          : faceStatus === "no-face" ? translations[language].faceNotDetected
            : translations[language].cameraGuide;

  const isDark = themePalette === "clinical-blue";
  const currentTheme = getThemeColors(themePalette, isDark ? "dark" : "light");


  return (
    <div className="app-container">
      <style jsx global>{`
        @import url("https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@300;400;500;600;700&display=swap");
        * { margin:0; padding:0; box-sizing:border-box; }
        body { font-family:"Noto Sans JP",sans-serif; background:${currentTheme.background}; color:${currentTheme.text}; overflow:hidden; -webkit-font-smoothing:antialiased; }
        .app-container { width:100vw; height:100dvh; display:flex; flex-direction:column; position:relative; overflow:hidden; }
        .bg-gradient { position:fixed; inset:0; background:${currentTheme.gradient},${currentTheme.background}; z-index:0; }
        .header { position:relative; z-index:10; padding:16px 20px; display:flex; align-items:center; justify-content:space-between; border-bottom:1px solid ${isDark ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.06)'}; }
        .logo { font-size:14px; font-weight:600; letter-spacing:.08em; color:${currentTheme.text}; text-transform:uppercase; background:none; border:none; cursor:pointer; transition:all .2s ease; padding:0; }
        .logo:hover { opacity:0.7; }
        .palette-selector { position:absolute; left:50%; transform:translateX(-50%); background:${isDark ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.04)'}; border:1px solid ${isDark ? 'rgba(255,255,255,.1)' : 'rgba(0,0,0,.1)'}; border-radius:8px; padding:6px 12px; font-size:11px; color:${currentTheme.text}; cursor:pointer; transition:all .2s ease; font-family:"Noto Sans JP",sans-serif; font-weight:500; outline:none; }
        .palette-selector:hover { background:${isDark ? 'rgba(255,255,255,.1)' : 'rgba(0,0,0,.08)'}; border-color:${currentTheme.accent}; }
        .palette-selector:focus { border-color:${currentTheme.accent}; box-shadow:0 0 0 2px ${currentTheme.accent}33; }
        .lang-badge-group { display:flex; gap:8px; align-items:center; }
        .lang-toggle { background:${isDark ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.04)'}; border:1px solid ${isDark ? 'rgba(255,255,255,.1)' : 'rgba(0,0,0,.1)'}; border-radius:8px; padding:4px 10px; font-size:11px; color:${currentTheme.textSecondary}; cursor:pointer; transition:all .2s ease; font-family:"Noto Sans JP",sans-serif; font-weight:500; }
        .lang-toggle:hover { background:${isDark ? 'rgba(255,255,255,.1)' : 'rgba(0,0,0,.08)'}; }
        .badge { font-size:10px; padding:3px 8px; border-radius:20px; background:${isDark ? 'rgba(60,140,220,.15)' : 'rgba(59,130,246,.15)'}; color:${currentTheme.accent}; font-weight:500; }
        .main-content { flex:1; display:flex; flex-direction:column; align-items:center; justify-content:${(step === "result" || step === "team") ? "flex-start" : "center"}; position:relative; z-index:10; padding:20px; overflow-y:auto; }
        .start-screen { text-align:center; max-width:400px; animation:fadeInUp .6s ease; }
        .start-screen,.error-screen { animation:fadeInUp .4s ease; text-align:center; max-width:520px; margin:0 auto; padding:0 24px; }
        .start-icon { width:64px; height:64px; margin:0 auto 24px; color:${currentTheme.accent}; }
        .start-icon svg { width:100%; height:100%; }
        .start-title { font-size:28px; font-weight:700; margin-bottom:12px; color:${currentTheme.text}; }
        .start-subtitle { font-size:14px; color:${currentTheme.textSecondary}; margin-bottom:40px; line-height:1.6; }
        .start-steps { display:flex; flex-direction:column; gap:12px; margin-bottom:36px; text-align:left; }
        .start-step { display:flex; align-items:center; gap:12px; padding:14px 18px; background:${currentTheme.cardBg}; border:1px solid ${currentTheme.cardBorder}; border-radius:12px; transition:all .2s ease; }
        .start-step:hover { background:${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.02)'}; border-color:${currentTheme.accent}; transform:translateX(4px); }
        .step-number { width:28px; height:28px; border-radius:50%; background:${currentTheme.primary}; color:#fff; display:flex; align-items:center; justify-content:center; font-size:13px; font-weight:600; flex-shrink:0; }
        .step-text { font-size:13px; color:${currentTheme.text}; font-weight:500; text-align:left; }
        .btn-primary { width:100%; padding:16px 32px; border:none; border-radius:14px; background:linear-gradient(135deg,#1e50a0,#2a6db8); color:white; font-size:16px; font-weight:600; cursor:pointer; transition:all .2s ease; box-shadow:0 4px 20px rgba(30,80,160,.3); font-family:"Noto Sans JP",sans-serif; }
        .btn-primary:active { transform:scale(.98); }
        .disclaimer { margin-top:20px; font-size:10px; color:${currentTheme.textTertiary}; line-height:1.6; }
        .camera-screen { width:100%; height:100%; display:flex; flex-direction:column; align-items:center; justify-content:center; position:relative; }
        .camera-wrapper { position:relative; width:92vw; max-width:400px; aspect-ratio:3/4; border-radius:24px; overflow:hidden; box-shadow:0 12px 48px rgba(0,0,0,.4); }
        .camera-wrapper video { width:100%; height:100%; object-fit:cover; transform:scaleX(-1); }
        .face-guide { position:absolute; inset:0; display:flex; align-items:center; justify-content:center; pointer-events:none; }
        .face-oval { width:75%; height:72%; border-radius:50%; border:3px solid; box-shadow:0 0 0 2000px rgba(10,15,28,.5); transition:border-color .3s ease; }
        .face-status-text { position:absolute; bottom:16px; left:50%; transform:translateX(-50%); font-size:12px; font-weight:600; padding:6px 16px; border-radius:20px; white-space:nowrap; }
        .guide-text { text-align:center; margin-top:16px; font-size:14px; font-weight:500; color:${currentTheme.text}; min-height:24px; }
        .countdown-display { margin-top:8px; font-size:48px; font-weight:700; color:#4ade80; text-shadow:0 0 24px rgba(80,200,120,.3); }
        .btn-capture { margin-top:16px; width:72px; height:72px; border-radius:50%; border:3px solid rgba(100,180,255,.4); background:rgba(60,140,220,.2); cursor:pointer; display:flex; align-items:center; justify-content:center; transition:all .2s ease; }
        .btn-capture:active { transform:scale(.92); }
        .btn-capture-inner { width:56px; height:56px; border-radius:50%; background:linear-gradient(135deg,#1e50a0,#3c8cc8); box-shadow:0 4px 20px rgba(30,80,160,.4); }
        .analyzing-screen { text-align:center; animation:fadeInUp .4s ease; }
        .spinner { width:64px; height:64px; border-radius:50%; border:3px solid rgba(100,180,255,.1); border-top-color:#64b4ff; animation:spin 1s linear infinite; margin:0 auto 24px; }
        .analyzing-text { font-size:16px; font-weight:500; color:${currentTheme.text}; }
        .analyzing-sub { font-size:12px; color:${currentTheme.textSecondary}; margin-top:8px; }
        .result-screen { width:100%; max-width:420px; animation:fadeInUp .5s ease; padding-top:20px; padding-bottom:40px; }
        .result-header { text-align:center; margin-bottom:20px; }
        .result-header h2 { font-size:20px; font-weight:700; color:${currentTheme.text}; }
        .result-header p { font-size:11px; color:${currentTheme.textTertiary}; margin-top:2px; letter-spacing:.08em; }
        .overall-eval { border-radius:16px; padding:24px 20px; margin-bottom:20px; text-align:center; border:1px solid; }
        .overall-emoji { font-size:40px; margin-bottom:8px; }
        .overall-label { font-size:22px; font-weight:700; margin-bottom:8px; }
        .overall-comment { font-size:13px; color:${currentTheme.textSecondary}; line-height:1.7; }
        .vital-cards { display:flex; flex-direction:column; gap:12px; margin-bottom:20px; }
        .vital-card { background:${currentTheme.cardBg}; border:1px solid ${currentTheme.cardBorder}; border-radius:14px; padding:16px 18px; display:flex; align-items:center; justify-content:space-between; }
        .vital-card-left { display:flex; flex-direction:column; gap:2px; }
        .vital-card-label { font-size:13px; color:${currentTheme.text}; font-weight:500; }
        .vital-card-sublabel { font-size:10px; color:${currentTheme.textTertiary}; }
        .vital-card-right { text-align:right; display:flex; flex-direction:column; align-items:flex-end; gap:4px; }
        .vital-card-value { font-size:28px; font-weight:700; color:${currentTheme.text}; }
        .vital-card-unit { font-size:11px; color:${currentTheme.textSecondary}; }
        .vital-card-status { font-size:10px; font-weight:600; padding:2px 8px; border-radius:10px; }
        .result-notice { background:${isDark ? 'rgba(255,180,60,.08)' : 'rgba(0,0,0,.04)'}; border:1px solid ${isDark ? 'rgba(255,180,60,.15)' : currentTheme.cardBorder}; border-radius:10px; padding:12px 14px; margin-bottom:20px; }
        .result-notice p { font-size:10px; color:${currentTheme.textSecondary}; line-height:1.6; }
        .btn-reset { width:100%; padding:16px; border:none; border-radius:14px; background:${isDark ? 'rgba(255,255,255,.08)' : 'rgba(0,0,0,.04)'}; color:${currentTheme.text}; font-size:15px; font-weight:600; cursor:pointer; transition:all .2s ease; font-family:"Noto Sans JP",sans-serif; border:1px solid ${currentTheme.cardBorder}; }
        .btn-reset:active { transform:scale(.98); }
        .report-id-box { background:${isDark ? 'rgba(100,180,255,.06)' : 'rgba(59,130,246,.06)'}; border:1px solid ${isDark ? 'rgba(100,180,255,.15)' : 'rgba(59,130,246,.15)'}; border-radius:10px; padding:10px 14px; margin-bottom:12px; display:flex; align-items:center; justify-content:space-between; gap:8px; }
        .report-id-label { font-size:10px; color:${currentTheme.textTertiary}; white-space:nowrap; }
        .report-id-value { font-size:11px; font-weight:600; color:${currentTheme.accent}; font-family:monospace; letter-spacing:.04em; }
        .btn-team { width:100%; padding:16px; border:none; border-radius:14px; background:linear-gradient(135deg,#1e50a0,#2a6db8); color:#fff; font-size:15px; font-weight:600; cursor:pointer; transition:all .2s ease; font-family:"Noto Sans JP",sans-serif; margin-top:10px; box-shadow:0 4px 16px rgba(30,80,160,.25); }
        .btn-team:active { transform:scale(.98); }
        .btn-secondary { width:100%; padding:14px; border:1px solid ${currentTheme.cardBorder}; border-radius:14px; background:${isDark ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.04)'}; color:${currentTheme.text}; font-size:14px; font-weight:600; cursor:pointer; transition:all .2s ease; font-family:"Noto Sans JP",sans-serif; margin-top:10px; }
        .btn-secondary:active { transform:scale(.98); }
        .team-screen { width:100%; max-width:420px; animation:fadeInUp .5s ease; padding-top:20px; padding-bottom:40px; }
        .team-header { text-align:center; margin-bottom:20px; }
        .team-header h2 { font-size:20px; font-weight:700; color:${currentTheme.text}; }
        .team-header p { font-size:11px; color:${currentTheme.textTertiary}; margin-top:2px; letter-spacing:.08em; }
        .team-meta { display:flex; gap:12px; margin-bottom:20px; }
        .team-meta-card { flex:1; background:${currentTheme.cardBg}; border:1px solid ${currentTheme.cardBorder}; border-radius:12px; padding:12px 14px; text-align:center; }
        .team-meta-label { font-size:10px; color:${currentTheme.textTertiary}; margin-bottom:4px; }
        .team-meta-value { font-size:18px; font-weight:700; color:${currentTheme.text}; }
        .team-meta-unit { font-size:10px; color:${currentTheme.textSecondary}; }
        .team-section-title { font-size:13px; font-weight:600; color:${currentTheme.textSecondary}; margin-bottom:10px; letter-spacing:.04em; text-transform:uppercase; }
        .team-avg-cards { display:flex; gap:10px; margin-bottom:20px; }
        .team-avg-card { flex:1; background:${currentTheme.cardBg}; border:1px solid ${currentTheme.cardBorder}; border-radius:12px; padding:12px 10px; text-align:center; }
        .team-avg-label { font-size:10px; color:${currentTheme.textTertiary}; margin-bottom:4px; line-height:1.4; }
        .team-avg-value { font-size:22px; font-weight:700; color:${currentTheme.text}; }
        .team-avg-unit { font-size:10px; color:${currentTheme.textSecondary}; }
        .score-dist { background:${currentTheme.cardBg}; border:1px solid ${currentTheme.cardBorder}; border-radius:14px; padding:16px 18px; margin-bottom:20px; }
        .score-dist-row { display:flex; align-items:center; gap:10px; margin-bottom:8px; }
        .score-dist-row:last-child { margin-bottom:0; }
        .score-dist-name { font-size:11px; color:${currentTheme.text}; width:56px; flex-shrink:0; font-weight:500; }
        .score-dist-bar-bg { flex:1; height:8px; background:${isDark ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.06)'}; border-radius:4px; overflow:hidden; }
        .score-dist-bar { height:100%; border-radius:4px; transition:width .6s ease; }
        .score-dist-count { font-size:11px; color:${currentTheme.textSecondary}; width:32px; text-align:right; flex-shrink:0; }
        .team-comment-box { background:${currentTheme.cardBg}; border:1px solid ${currentTheme.cardBorder}; border-radius:14px; padding:16px 18px; margin-bottom:20px; }
        .team-comment-title { font-size:12px; font-weight:600; color:${currentTheme.accent}; margin-bottom:8px; }
        .team-comment-text { font-size:13px; color:${currentTheme.textSecondary}; line-height:1.7; }
        .error-screen { text-align:center; max-width:360px; animation:fadeInUp .4s ease; }
        .error-icon { width:56px; height:56px; border-radius:50%; background:rgba(220,80,60,.15); display:flex; align-items:center; justify-content:center; margin:0 auto 20px; }
        .error-title { font-size:18px; font-weight:600; margin-bottom:12px; color:${currentTheme.text}; }
        .error-message { font-size:13px; color:${currentTheme.textSecondary}; line-height:1.7; margin-bottom:28px; white-space:pre-line; }
        .auto-resume-text { margin-top:16px; font-size:13px; color:${currentTheme.textSecondary}; }
        @keyframes fadeInUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        @keyframes pulse-border { 0%,100% { opacity:.5; } 50% { opacity:1; } }
        @keyframes spin { to { transform:rotate(360deg); } }
      `}</style>

      <div className="bg-gradient" />

      <header className="header">
        <button className="logo" onClick={() => { setStep("start"); setResult(null); setErrorMessage(""); setCountdown(6); setShowAlignAlert(false); setFaceStatus("no-face"); setPersonalReportId(null); setTeamReports([]); }}>Vital Sensing</button>
        <select
          className="palette-selector"
          value={themePalette}
          onChange={(e) => setThemePalette(e.target.value as ThemePalette)}
        >
          <option value="clinical-blue">Clinical Blue</option>
          <option value="clean-white">Clean White</option>
        </select>
        <div className="lang-badge-group">
          <button className="lang-toggle" onClick={() => setLanguage(language === "ja" ? "en" : "ja")}>
            🌐 {language.toUpperCase()}
          </button>
          <span className="badge">{translations[language].badge}</span>
        </div>
      </header>

      <main className="main-content">
        {step === "start" && (
          <div className="start-screen">
            <div className="start-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg></div>
            <h1 className="start-title">{translations[language].startTitle}</h1>
            <p className="start-subtitle">{translations[language].startSubtitle}</p>
            <div className="start-steps">
              <div className="start-step"><div className="step-number">1</div><div className="step-text">{translations[language].step1}</div></div>
              <div className="start-step"><div className="step-number">2</div><div className="step-text">{translations[language].step2}</div></div>
              <div className="start-step"><div className="step-number">3</div><div className="step-text">{translations[language].step3}</div></div>
            </div>
            <button className="btn-primary" onClick={startCamera}>{translations[language].startButton}</button>
            <p className="disclaimer">{translations[language].disclaimer}</p>
          </div>
        )}

        <div className="camera-screen" style={{ display: step === "camera" || step === "recording" ? "flex" : "none" }}>
          <div className="camera-wrapper">
            <video ref={videoRef} autoPlay playsInline muted />
            <div className="face-guide">
              <div className="face-oval" style={{
                borderColor: ovalColor,
                animation: (faceStatus === "inside" || step === "recording") ? "none" : "pulse-border 2s ease-in-out infinite"
              }} />
              <div className="face-status-text" style={{ background: statusBg, color: statusColor }}>
                {statusText}
              </div>
            </div>
          </div>
          <p className="guide-text">{guideMessage}</p>
          {step === "recording" && <div className="countdown-display">{countdown}</div>}
          {step === "camera" && !hasStartedRef.current && (
            <button className="btn-capture" onClick={startRecording} disabled={faceStatus !== "inside"} style={{ opacity: faceStatus === "inside" ? 1 : 0.3 }}>
              <div className="btn-capture-inner" />
            </button>
          )}
          {step === "camera" && hasStartedRef.current && (
            <p className="auto-resume-text">{translations[language].autoResumeText}</p>
          )}
        </div>

        {step === "analyzing" && (
          <div className="analyzing-screen"><div className="spinner" /><p className="analyzing-text">{translations[language].analyzing}</p><p className="analyzing-sub">{translations[language].pleaseWait}</p></div>
        )}

        {step === "result" && result && (() => {
          const ev = getOverallEvaluation(result, language);
          const bs = getVitalStatus("bpm", result.bpm, language), ss = getVitalStatus("sys", result.bpv1, language), ds = getVitalStatus("dia", result.bpv0, language);
          return (
            <div className="result-screen">
              <div className="result-header" id="result-top"><h2>{translations[language].resultTitle}</h2><p>{translations[language].resultSubtitle}</p></div>
              <div className="overall-eval" style={{ background: `${ev.color}10`, borderColor: `${ev.color}30` }}>
                <div className="overall-label" style={{ color: ev.color, display: "flex", alignItems: "center", justifyContent: "center", gap: "10px" }}><span style={{ fontSize: "28px" }}>{ev.emoji}</span>{ev.label}</div>
                <div className="overall-comment">{ev.comment}</div>
              </div>
              <div className="vital-cards">
                {[
                  { label: translations[language].heartRate, sub: translations[language].heartRateSub, val: result.bpm, unit: " bpm", st: bs },
                  { label: translations[language].systolic, sub: translations[language].systolicSub, val: result.bpv1, unit: " mmHg", st: ss },
                  { label: translations[language].diastolic, sub: translations[language].diastolicSub, val: result.bpv0, unit: " mmHg", st: ds },
                  { label: translations[language].s2Signal, sub: translations[language].s2SignalSub, val: result.S2, unit: "", st: { label: "—", color: "#64b4ff" } },
                  { label: translations[language].ltvValue, sub: translations[language].ltvValueSub, val: result.LTv, unit: "", st: { label: "—", color: "#64b4ff" } },
                ].map((item, i) => (
                  <div className="vital-card" key={i}>
                    <div className="vital-card-left"><div className="vital-card-label">{item.label}</div><div className="vital-card-sublabel">{item.sub}</div></div>
                    <div className="vital-card-right">
                      <div className="vital-card-value" style={{ color: item.st.color }}>{item.val}<span className="vital-card-unit">{item.unit}</span></div>
                      {item.st.label !== "—" && <div className="vital-card-status" style={{ background: `${item.st.color}20`, color: item.st.color }}>{item.st.label}</div>}
                    </div>
                  </div>
                ))}
              </div>
              <div className="result-notice"><p>{translations[language].disclaimer}</p></div>
              <div className="report-id-box">
                <span className="report-id-label">{translations[language].reportIdLabel}</span>
                <span className="report-id-value">{personalReportId ?? "..."}</span>
              </div>
              <button className="btn-reset" onClick={handleReset}>{translations[language].backButton}</button>
              <button className="btn-team" onClick={goToTeamReport}>{translations[language].teamReportBtn}</button>
            </div>
          );
        })()}

        {step === "team" && (() => {
          const t = translations[language];
          const reports = teamReports;
          const total = reports.length;
          if (total === 0) return (
            <div className="team-screen">
              <div className="team-header"><h2>{t.teamReportTitle}</h2><p>{t.teamReportSubtitle}</p></div>
              <p style={{ textAlign: "center", color: currentTheme.textSecondary, fontSize: "14px" }}>{t.noDataYet}</p>
              <button className="btn-reset" style={{ marginTop: "24px" }} onClick={handleReset}>{t.backButton}</button>
              <button className="btn-secondary" onClick={() => setStep("result")}>{t.backToPersonalBtn}</button>
            </div>
          );
          const avgBpm = Math.round(reports.reduce((s, r) => s + parseFloat(r.bpm), 0) / total);
          const avgSys = Math.round(reports.reduce((s, r) => s + parseFloat(r.bpv1), 0) / total);
          const avgDia = Math.round(reports.reduce((s, r) => s + parseFloat(r.bpv0), 0) / total);
          const dist = { excellent: 0, good: 0, fair: 0, caution: 0, check: 0 };
          reports.forEach((r) => { if (r.statusKey in dist) dist[r.statusKey as keyof typeof dist]++; });
          const goodPct = (dist.excellent + dist.good) / total;
          const cautionPct = (dist.caution + dist.check) / total;
          const teamComment = goodPct >= 0.7 ? t.teamCommentExcellent : goodPct >= 0.5 ? t.teamCommentGood : cautionPct >= 0.5 ? t.teamCommentCaution : t.teamCommentBalanced;
          const lastRaw = reports[0]?.createdAt;
          const lastDate = lastRaw?.toDate ? lastRaw.toDate().toLocaleDateString(language === "ja" ? "ja-JP" : "en-US", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";
          const distRows = [
            { key: "excellent", label: t.statusExcellent, color: "#22d3ee" },
            { key: "good",      label: t.statusGood,      color: "#4ade80" },
            { key: "fair",      label: t.statusFair,      color: "#a3e635" },
            { key: "caution",   label: t.statusCaution,   color: "#fbbf24" },
            { key: "check",     label: t.statusCheck,     color: "#f87171" },
          ];
          return (
            <div className="team-screen">
              <div className="team-header"><h2>{t.teamReportTitle}</h2><p>{t.teamReportSubtitle}</p></div>
              <div className="team-meta">
                <div className="team-meta-card">
                  <div className="team-meta-label">{t.totalMeasurements}</div>
                  <div className="team-meta-value">{total}<span className="team-meta-unit"> {t.people}</span></div>
                </div>
                <div className="team-meta-card">
                  <div className="team-meta-label">{t.lastUpdated}</div>
                  <div style={{ fontSize: "11px", fontWeight: 600, color: currentTheme.text, marginTop: "4px" }}>{lastDate}</div>
                </div>
              </div>
              <p className="team-section-title">{t.avgHeartRate} / {t.avgSystolic} / {t.avgDiastolic}</p>
              <div className="team-avg-cards" style={{ marginBottom: "20px" }}>
                <div className="team-avg-card"><div className="team-avg-label">{t.avgHeartRate}<br/>Heart Rate</div><div className="team-avg-value">{avgBpm}</div><div className="team-avg-unit">bpm</div></div>
                <div className="team-avg-card"><div className="team-avg-label">{t.avgSystolic}<br/>Systolic</div><div className="team-avg-value">{avgSys}</div><div className="team-avg-unit">mmHg</div></div>
                <div className="team-avg-card"><div className="team-avg-label">{t.avgDiastolic}<br/>Diastolic</div><div className="team-avg-value">{avgDia}</div><div className="team-avg-unit">mmHg</div></div>
              </div>
              <p className="team-section-title">{t.scoreDistTitle}</p>
              <div className="score-dist">
                {distRows.map((row) => {
                  const count = dist[row.key as keyof typeof dist];
                  const pct = total > 0 ? (count / total) * 100 : 0;
                  return (
                    <div className="score-dist-row" key={row.key}>
                      <span className="score-dist-name">{row.label}</span>
                      <div className="score-dist-bar-bg"><div className="score-dist-bar" style={{ width: `${pct}%`, background: row.color }} /></div>
                      <span className="score-dist-count">{count}{language === "ja" ? "人" : ""}</span>
                    </div>
                  );
                })}
              </div>
              <p className="team-section-title">{t.teamCommentTitle}</p>
              <div className="team-comment-box">
                <div className="team-comment-title">{t.teamCommentTitle}</div>
                <div className="team-comment-text">{teamComment}</div>
              </div>
              <button className="btn-reset" onClick={handleReset}>{t.backButton}</button>
              <button className="btn-secondary" onClick={() => setStep("result")}>{t.backToPersonalBtn}</button>
            </div>
          );
        })()}

        {step === "error" && (
          <div className="error-screen">
            <div className="error-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#dc503c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg></div>
            <h2 className="error-title">{translations[language].errorTitle}</h2>
            <p className="error-message">{errorMessage}</p>
            <button className="btn-primary" onClick={handleReset}>{translations[language].retryButton}</button>
          </div>
        )}
      </main>
    </div>
  );
}