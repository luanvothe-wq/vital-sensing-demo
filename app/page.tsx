"use client";

import { useState, useRef, useEffect, useCallback, Fragment } from "react";
import { type ThemePalette, getThemeColors, type ThemeColors } from "./theme-palettes";
import { type TeamReport } from "../lib/reportService";


// Firebase未設定時のセッション内フォールバックストア
const sessionReports: import("../lib/reportService").TeamReport[] = [];

// チームレポートキャッシュ（新しい個人レポートが来るまで再利用）
let cachedTeamData: import("../lib/reportService").TeamReport[] | null = null;
let cachedSessionVersion = -1;
let cachedGeneratedAt: Date | null = null;

// FFmpegによるMP4変換を有効にするかどうか（falseの場合はWebMを直接送信）
// WebMで外部APIが正常に動作することが確認できたため暫定的に無効化
const ENABLE_FFMPEG = false;

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

    teamReportTitle: "チームバイタルレポート",
    teamReportSubtitle: "Team Vital Sensing Report",
    totalMeasurements: "測定人数",
    lastUpdated: "最終更新",
    avgHeartRate: "平均心拍数",
    avgSystolic: "平均収縮期血圧",
    avgDiastolic: "平均拡張期血圧",
    scoreDistTitle: "健康スコア分布",
    teamCommentTitle: "総合評価",
    teamCommentExcellent: "チーム全体の健康状態は非常に良好です。7割以上のメンバーが最良のコンディションにあり、心血管系の健康管理が組織全体に浸透していることを示しています。組織マネジメントの観点では、創造性・意思決定力・協調性がピークに達しやすい理想的な状態です。挑戦的なプロジェクトへのアサインや重要な意思決定の場面に積極的に活用してください。現在の職場環境・働き方・ウェルネス施策が機能している証拠として評価し、継続的なモニタリングで状態を維持しましょう。",
    teamCommentGood: "過半数のメンバーが良好な健康状態にあります。チームとして安定した基盤にありますが、一定数のメンバーへの個別サポートが全体パフォーマンスの向上につながります。定期的な1on1による状況把握、業務量の偏り解消、柔軟な休暇取得の促進が有効です。ウォーキングミーティングや短時間のストレッチタイムなど、職場でできる簡単なウェルネス習慣の導入もお勧めします。",
    teamCommentCaution: "注意が必要なメンバーが多い傾向にあります。組織管理の観点から早急な対応が求められる状態です。業務負荷の分散・再配分、強制的な休暇取得の奨励、メンタルヘルスサポートの強化を優先してください。この状態が継続すると、生産性の低下・欠勤率の上昇・離職リスクの増大につながります。マネジメント層は個別面談を実施し、EAP（従業員支援プログラム）の活用も視野に入れてください。",
    teamCommentBalanced: "チームメンバーの健康状態はバランスよく分布しています。大きな問題はないものの、個々のメンバーの状態変化を定期的にモニタリングすることが重要です。フレックスタイムの活用・適切な業務量の維持・定期的な休暇取得を継続することで、パフォーマンスの安定と持続的な成果につながります。",
    loadingTeamReport: "チームレポートを読み込んでいます...",
    noDataYet: "まだデータがありません",
    people: "人",
    avgBpmDesc: "身体的疲労・ストレス負荷の目安。業務の強度や職場の緊張レベルを反映します。チーム平均が90bpm超の場合は業務強度の見直しを推奨します。",
    avgSysDesc: "精神的プレッシャーや職場環境の緊張指標。継続的な高値（130mmHg超）は業務負荷の見直しシグナルです。",
    avgDiaDesc: "自律神経のバランスと休養の質を示します。高値が続く場合（85mmHg超）は十分な休息が確保できていない可能性があります。",
    managementTitle: "マネジメント指標",
    wellnessRateLabel: "チーム健康率",
    atRiskLabel: "要注意メンバー",
    stressLevelLabel: "推定ストレス負荷",
    stressLow: "低",
    stressMid: "中程度",
    stressHigh: "高",
    recommendedActionsLabel: "推奨アクション",
    analysisError: "バイタルサインの分析に失敗しました。しばらく時間をおいて再度お試しください。",
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

    teamReportTitle: "Team Vital Report",
    teamReportSubtitle: "Team Vital Sensing Report",
    totalMeasurements: "Total Measurements",
    lastUpdated: "Last Updated",
    avgHeartRate: "Avg Heart Rate",
    avgSystolic: "Avg Systolic BP",
    avgDiastolic: "Avg Diastolic BP",
    scoreDistTitle: "Health Score Distribution",
    teamCommentTitle: "Overall Assessment",
    teamCommentExcellent: "The team's overall health is excellent. Over 70% of members are in peak condition, reflecting strong cardiovascular health management across the organization. From an organizational perspective, this represents an ideal state for creativity, decision-making, and collaboration. Leverage this window for high-stakes projects and critical decisions. Acknowledge that current workplace culture and wellness initiatives are working — continue regular monitoring to sustain this level.",
    teamCommentGood: "More than half of the team is in good health, providing a stable organizational foundation. Individual support for at-risk members will elevate overall performance. Regular 1-on-1s, balanced workload distribution, and flexible leave-taking are effective levers. Consider simple workplace wellness habits such as walking meetings or short stretch breaks to further improve team condition.",
    teamCommentCaution: "A significant portion of members require attention — immediate action is recommended from an organizational standpoint. Prioritize workload redistribution, enforced leave-taking, and strengthened mental health support. Prolonged states like this lead to reduced productivity, increased absenteeism, and higher turnover risk. Managers should conduct individual check-ins and consider activating an Employee Assistance Program (EAP).",
    teamCommentBalanced: "The team's health is evenly distributed with no major concerns, but regular monitoring of individual changes is essential. Continuing flexible work arrangements, balanced workloads, and periodic leave will sustain performance stability and long-term organizational output.",
    loadingTeamReport: "Loading team report...",
    noDataYet: "No data yet",
    people: " people",
    avgBpmDesc: "Indicator of physical fatigue and stress load, reflecting work intensity and workplace tension. Average above 90 bpm warrants workload review.",
    avgSysDesc: "Indicator of mental pressure and workplace tension. Sustained high values (>130 mmHg) signal need for workload review.",
    avgDiaDesc: "Reflects autonomic nervous balance and sleep/recovery quality. Sustained high values (>85 mmHg) suggest insufficient rest.",
    managementTitle: "Management Insights",
    wellnessRateLabel: "Wellness Rate",
    atRiskLabel: "At-Risk Members",
    stressLevelLabel: "Est. Stress Level",
    stressLow: "Low",
    stressMid: "Moderate",
    stressHigh: "High",
    recommendedActionsLabel: "Recommended Actions",
    analysisError: "Vital sign analysis failed. Please wait a moment and try again.",
  },
};

// テーマカラーパレットは theme-palettes.ts で定義

// CSS custom propertiesをtheme変更時に:rootへ同期する
function syncThemeCSSVars(theme: ThemeColors, isDark: boolean) {
  const root = document.documentElement;
  root.style.setProperty('--theme-primary', theme.primary);
  root.style.setProperty('--theme-primary-light', theme.primaryLight);
  root.style.setProperty('--theme-background', theme.background);
  root.style.setProperty('--theme-accent', theme.accent);
  root.style.setProperty('--theme-text', theme.text);
  root.style.setProperty('--theme-text-secondary', theme.textSecondary);
  root.style.setProperty('--theme-text-tertiary', theme.textTertiary);
  root.style.setProperty('--theme-card-bg', theme.cardBg);
  root.style.setProperty('--theme-card-border', theme.cardBorder);
  root.style.setProperty('--theme-gradient', theme.gradient);
  // isDark-dependent helper vars
  root.style.setProperty('--theme-border-subtle', isDark ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.06)');
  root.style.setProperty('--theme-hover-bg', isDark ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.02)');
  root.style.setProperty('--theme-hover-bg-strong', isDark ? 'rgba(255,255,255,.1)' : 'rgba(0,0,0,.08)');
  root.style.setProperty('--theme-input-bg', isDark ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.04)');
  root.style.setProperty('--theme-input-border', isDark ? 'rgba(255,255,255,.1)' : 'rgba(0,0,0,.1)');
  root.style.setProperty('--theme-badge-bg', isDark ? 'rgba(60,140,220,.15)' : 'rgba(59,130,246,.15)');
  root.style.setProperty('--theme-btn-team-bg', isDark ? 'rgba(30,80,160,.25)' : 'rgba(30,80,160,.1)');
  root.style.setProperty('--theme-btn-team-border', isDark ? 'rgba(100,180,255,.25)' : 'rgba(30,80,160,.2)');
  root.style.setProperty('--theme-btn-team-hover', isDark ? 'rgba(30,80,160,.4)' : 'rgba(30,80,160,.18)');
  root.style.setProperty('--theme-notice-bg', isDark ? 'rgba(255,180,60,.08)' : 'rgba(0,0,0,.04)');
  root.style.setProperty('--theme-notice-border', isDark ? 'rgba(255,180,60,.15)' : theme.cardBorder);
  root.style.setProperty('--theme-reset-bg', isDark ? 'rgba(255,255,255,.08)' : 'rgba(0,0,0,.04)');
  root.style.setProperty('--theme-report-id-bg', isDark ? 'rgba(100,180,255,.06)' : 'rgba(59,130,246,.06)');
  root.style.setProperty('--theme-report-id-border', isDark ? 'rgba(100,180,255,.15)' : 'rgba(59,130,246,.15)');
  root.style.setProperty('--theme-bar-bg', isDark ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.06)');
}

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
  const [teamLoading, setTeamLoading] = useState(false);
  const [teamGeneratedAt, setTeamGeneratedAt] = useState<Date | null>(null);
  const [teamProgress, setTeamProgress] = useState(0);

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
  // languageRef: useCallback内から最新のlanguageを参照するためのref
  const languageRef = useRef<Language>("ja");

  // WASM版FFmpegをロード(ローカルnpmパッケージ使用)
  // ENABLE_FFMPEG=false の間はスキップ（CDNへの不要なリクエストを防ぐ）
  useEffect(() => {
    if (!ENABLE_FFMPEG) return;
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

  // CSS custom propertiesをテーマ変更時に同期
  useEffect(() => {
    const dark = themePalette === "clinical-blue";
    const theme = getThemeColors(themePalette, dark ? "dark" : "light");
    syncThemeCSSVars(theme, dark);
  }, [themePalette]);

  // テーマパレット、言語をLocalStorageに保存
  useEffect(() => {
    localStorage.setItem("themePalette", themePalette);
    localStorage.setItem("language", language);
  }, [themePalette, language]);

  // languageRefをlanguage stateと同期（useCallback内で最新言語を参照するため）
  useEffect(() => {
    languageRef.current = language;
  }, [language]);

  // WebM → MP4 変換（ブラウザ側）
  // NOTE: "-c:v copy" でストリームをコピー（再エンコードなし）→ libx264より大幅に高速
  const convertToMp4 = async (webmBlob: Blob): Promise<Blob> => {
    const ffmpeg = ffmpegRef.current;
    if (!ffmpeg || !ffmpegLoadedRef.current) {
      throw new Error("FFmpegがまだロードされていません");
    }
    const webmBuffer = new Uint8Array(await webmBlob.arrayBuffer());
    await ffmpeg.writeFile("input.webm", webmBuffer);
    await ffmpeg.exec([
      "-i", "input.webm",
      "-c:v", "copy",
      "-movflags", "+faststart",
      "-y", "output.mp4",
    ]);
    const mp4Data = await ffmpeg.readFile("output.mp4");
    const mp4Arr = mp4Data as Uint8Array;
    console.log("=== MP4変換完了:", mp4Arr.length, "bytes ===");
    // Blob コンストラクタの型チェックを回避
    // @ts-expect-error Blob expects different arguments in older ts lib
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
  // API送信（失敗時はエラー画面を表示。詳細ログはサーバー側route.tsで記録）
  // ------------------------------------------
  const sendToApi = useCallback(async (videoBlob: Blob) => {
    try {
      const fd = new FormData(); fd.append("file", videoBlob, "vital_scan.mp4");

      // 90秒のタイムアウトを設定（外部APIのログイン + アップロード + 分析に十分な時間を確保）
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 90000);

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

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const data = await res.json() as any;
        if (data.code === 200 && data.data) {
          const vr = { bpm: data.data.bpm, bpv1: data.data.bpv1, bpv0: data.data.bpv0, S2: data.data.S2, LTv: data.data.LTv };
          setResult(vr);
          setStep("result");
          const sc = computeScore(vr);
          // Sinh local short code 4 chữ số (VS-NNNN) làm fallback khi D1 chưa trả về
          const localCode = String(Math.floor(Math.random() * 10000)).padStart(4, "0");
          const localId = `VS-${localCode}`;
          const entry: TeamReport = { ...vr, id: localId, score: sc, statusKey: scoreToStatusKey(sc), createdAt: { toDate: () => new Date() } };
          sessionReports.unshift(entry);
          setPersonalReportId(localId);
          // D1経由で保存: fetch POST /api/reports
          fetch("/api/reports", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...vr, score: sc, statusKey: scoreToStatusKey(sc) }),
          })
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .then((r) => r.json() as Promise<any>)
            .then((json) => {
              if (json.shortId) {
                // D1 trả về short ID — ưu tiên dùng shortId để hiển thị VS-XXXX
                const displayId = `VS-${json.shortId}`;
                entry.id = json.id;
                setPersonalReportId(displayId);
              } else if (json.id) {
                entry.id = json.id;
                setPersonalReportId(json.id);
              }
            })
            .catch((e) => console.warn("D1保存エラー:", e));
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
      // 分析失敗: 現在の言語でユーザー向け汎用メッセージを表示
      // 詳細なエラー情報はサーバー側（route.ts）のconsole.errorで記録済み
      console.warn("[VitalSensing] Analysis failed:", err);
      setErrorMessage(translations[languageRef.current].analysisError);
      setStep("error");
    }
    // languageRef được sync với language state qua useEffect → không cần thêm dependency
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
        // ENABLE_FFMPEG=true の場合のみMP4変換を行う（falseの場合はWebMを直接送信）
        let blobToSend: Blob = webmBlob;
        if (ENABLE_FFMPEG) {
          try {
            const timeoutPromise = new Promise<never>((_, reject) =>
              setTimeout(() => reject(new Error("MP4変換タイムアウト")), 30000)
            );
            const mp4Blob = await Promise.race([convertToMp4(webmBlob), timeoutPromise]);
            blobToSend = mp4Blob;
            console.log("=== MP4変換成功 ===");
          } catch (convErr) {
            console.warn("MP4変換スキップ（WebMで送信）:", convErr);
          }
        } else {
          console.log("=== FFmpeg無効: WebMを直接送信 ===");
        }
        await sendToApi(blobToSend);
      } catch (fatalErr) {
        // 致命的エラー時: ユーザー向け汎用メッセージを表示（モックデータは使用しない）
        console.error("[VitalSensing] Fatal processing error:", fatalErr);
        setErrorMessage(translations[languageRef.current].analysisError);
        setStep("error");
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
    setPersonalReportId(null); setTeamReports([]); setTeamGeneratedAt(null); setTeamProgress(0);
    chunksRef.current = []; countdownRef.current = 6;
  }, [stopCamera]);

  useEffect(() => { return () => { stopCamera(); }; }, [stopCamera]);

  const goToTeamReport = useCallback(async () => {
    const currentVersion = sessionReports.length;
    // キャッシュが有効（新しい個人レポートなし）なら即座に表示
    if (cachedTeamData && cachedSessionVersion === currentVersion && cachedGeneratedAt) {
      setTeamReports(cachedTeamData);
      setTeamGeneratedAt(cachedGeneratedAt);
      setStep("team");
      return;
    }
    // キャッシュ無効 → プログレスアニメーション表示してフェッチ
    setTeamLoading(true);
    setTeamProgress(0);
    setStep("team");
    // 時間ベースの線形進捗（常に動き続ける）
    const startTime = Date.now();
    const progressInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      // 0-3秒で0→75%、3-8秒で75→93%（常に動き続ける）
      const target = elapsed < 3000
        ? (elapsed / 3000) * 75
        : 75 + Math.min(18, ((elapsed - 3000) / 5000) * 18);
      setTeamProgress(Math.min(93, Math.round(target)));
    }, 100);
    const now = new Date();
    let data: TeamReport[] = [...sessionReports];
    try {
      // 5秒でタイムアウト（D1未設定時の長時間待機を防ぐ）
      const fetchPromise: Promise<TeamReport[]> = fetch("/api/reports")
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .then((r) => r.json() as Promise<any>)
        .then((json) => json.reports ?? []);
      const timeoutPromise: Promise<never> = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("タイムアウト")), 5000)
      );
      const reports = await Promise.race([fetchPromise, timeoutPromise]);
      data = reports.length > 0 ? reports : [...sessionReports];
    } catch (e) {
      console.warn("D1取得エラー、セッションデータを使用:", e);
    }
    cachedTeamData = data;
    cachedSessionVersion = currentVersion;
    cachedGeneratedAt = now;
    clearInterval(progressInterval);
    setTeamProgress(100);
    await new Promise((r) => setTimeout(r, 500));
    setTeamReports(data);
    setTeamGeneratedAt(now);
    setTeamLoading(false);
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


      <div className="bg-gradient" />

      <header className="header">
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <button className="logo" onClick={() => { setStep("start"); setResult(null); setErrorMessage(""); setCountdown(6); setShowAlignAlert(false); setFaceStatus("no-face"); setPersonalReportId(null); setTeamReports([]); setTeamGeneratedAt(null); setTeamProgress(0); }}>Vital Sensing</button>
          <span className="badge">{translations[language].badge}</span>
        </div>
        <select
          className="palette-selector"
          value={themePalette}
          onChange={(e) => setThemePalette(e.target.value as ThemePalette)}
        >
          <option value="clinical-blue">Clinical Blue</option>
          <option value="clean-white">Clean White</option>
        </select>
        <div className="lang-badge-group">
          <button className="btn-header-team" onClick={goToTeamReport} disabled={teamLoading}>
            {language === "ja" ? "チームレポート" : "Team Report"}
          </button>
          <button className="lang-toggle" onClick={() => setLanguage(language === "ja" ? "en" : "ja")}>
            🌐 {language.toUpperCase()}
          </button>
        </div>
      </header>

      <main className={`main-content${(step === "result" || step === "team") ? " scroll-top" : ""}`}>
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
              <button className="btn-team" onClick={goToTeamReport} disabled={teamLoading} style={{ opacity: teamLoading ? 0.7 : 1 }}>
                {teamLoading ? "..." : translations[language].teamReportBtn}
              </button>
              <button className="btn-reset" onClick={handleReset}>{translations[language].backButton}</button>
            </div>
          );
        })()}

        {step === "team" && (() => {
          const t = translations[language];
          const lastDate = teamGeneratedAt
            ? teamGeneratedAt.toLocaleString(language === "ja" ? "ja-JP" : "en-US", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: false })
            : "—";

          // プログレスアニメーション：ヘッダーは即表示、その下に進捗UI
          if (teamLoading) {
            const circ = 2 * Math.PI * 50;
            const offset = circ * (1 - teamProgress / 100);
            const msgIdx = teamProgress < 30 ? 0 : teamProgress < 60 ? 1 : teamProgress < 90 ? 2 : 3;
            const msgs = language === "ja"
              ? ["データを収集しています...", "バイタルデータを集計中...", "チームレポートを生成中...", "分析を仕上げています..."]
              : ["Collecting data...", "Aggregating vital data...", "Generating team report...", "Finalizing analysis..."];
            const stepLabels = language === "ja"
              ? ["データ収集", "集計", "レポート生成", "仕上げ"]
              : ["Collection", "Aggregation", "Generation", "Finalize"];
            const stepThresholds = [0, 30, 60, 90];
            return (
              <div className="team-screen">
                <div className="team-header"><h2>{t.teamReportTitle}</h2><p>{t.teamReportSubtitle}</p></div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "48px 24px 32px", gap: "20px" }}>
                  {/* 円形プログレスリング */}
                  <div style={{ position: "relative", width: "120px", height: "120px" }}>
                    <svg width="120" height="120" viewBox="0 0 120 120" style={{ transform: "rotate(-90deg)" }}>
                      <circle cx="60" cy="60" r="50" fill="none" stroke={isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"} strokeWidth="8" />
                      <circle cx="60" cy="60" r="50" fill="none" stroke={currentTheme.accent} strokeWidth="8"
                        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
                        style={{ transition: "stroke-dashoffset 0.3s ease" }} />
                    </svg>
                    <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "26px", fontWeight: 700, color: currentTheme.text }}>
                      {teamProgress}%
                    </div>
                  </div>
                  {/* ステータスメッセージ */}
                  <div style={{ fontSize: "14px", fontWeight: 500, color: currentTheme.textSecondary, textAlign: "center", minHeight: "22px" }}>
                    {msgs[msgIdx]}
                  </div>
                  {/* ステップインジケーター */}
                  <div style={{ display: "flex", justifyContent: "space-between", width: "100%", maxWidth: "270px" }}>
                    {stepThresholds.map((threshold, i) => {
                      const active = teamProgress >= threshold;
                      return (
                        <Fragment key={i}>
                          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px", flexShrink: 0 }}>
                            <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: active ? currentTheme.accent : (isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.15)"), transition: "background 0.3s ease", boxShadow: active ? `0 0 6px ${currentTheme.accent}80` : "none" }} />
                            <div style={{ fontSize: "9px", color: active ? currentTheme.textSecondary : currentTheme.textTertiary, textAlign: "center", lineHeight: 1.3, width: "52px", transition: "color 0.3s ease" }}>
                              {stepLabels[i]}
                            </div>
                          </div>
                          {i < 3 && (
                            <div style={{ flex: 1, height: "2px", marginTop: "4px", background: teamProgress >= stepThresholds[i + 1] ? currentTheme.accent : (isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"), transition: "background 0.3s ease" }} />
                          )}
                        </Fragment>
                      );
                    })}
                  </div>
                  {/* ヒント */}
                  <div style={{ fontSize: "11px", color: currentTheme.textTertiary, textAlign: "center" }}>
                    {language === "ja" ? "通常10秒以内に完了します" : "Usually completes within 10 seconds"}
                  </div>
                </div>
              </div>
            );
          }

          const reports = teamReports;
          const total = reports.length;
          if (total === 0) return (
            <div className="team-screen">
              <div className="team-header"><h2>{t.teamReportTitle}</h2><p>{t.teamReportSubtitle}</p></div>
              <p style={{ textAlign: "center", color: currentTheme.textSecondary, fontSize: "14px" }}>{t.noDataYet}</p>

              <button className="btn-reset" onClick={handleReset}>{t.backButton}</button>
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
          const wellnessRate = Math.round((dist.excellent + dist.good) / total * 100);
          const atRiskCount = dist.caution + dist.check;
          const avgLtv = reports.reduce((s, r) => s + parseFloat(r.LTv || "1.5"), 0) / total;
          const stressKey = avgLtv < 1.55 ? "stressLow" : avgLtv < 1.75 ? "stressMid" : "stressHigh";
          const stressColor = avgLtv < 1.55 ? "#4ade80" : avgLtv < 1.75 ? "#fbbf24" : "#f87171";
          const actions: string[] = [];
          if (language === "ja") {
            if (dist.check > 0) actions.push(`要確認メンバーが${dist.check}名います。個別に医療機関への受診を促してください。`);
            if (cautionPct >= 0.3) actions.push("要注意メンバーに対し、1on1面談で業務量・睡眠・ストレスを把握してください。");
            if (avgBpm > 85) actions.push("チーム平均心拍数がやや高め。業務強度の見直しと休憩時間の確保を推奨します。");
            if (stressKey === "stressHigh") actions.push("心血管負荷が高い傾向。連続する高負荷プロジェクトを避け、休暇取得を優先してください。");
            if (goodPct >= 0.7 && dist.check === 0) actions.push("コンディションは良好。重要な意思決定・挑戦的なプロジェクト推進に適した時期です。");
            if (actions.length < 2) actions.push("継続的なモニタリングで状態変化を早期にキャッチしてください。");
          } else {
            if (dist.check > 0) actions.push(`${dist.check} member(s) need attention — encourage individual medical consultation.`);
            if (cautionPct >= 0.3) actions.push("Hold 1-on-1s with at-risk members to assess workload, sleep, and stress.");
            if (avgBpm > 85) actions.push("Average heart rate is elevated. Review work intensity and ensure adequate rest periods.");
            if (stressKey === "stressHigh") actions.push("High cardiovascular load — avoid stacking high-intensity projects and promote leave-taking.");
            if (goodPct >= 0.7 && dist.check === 0) actions.push("Team is in peak condition — ideal time for high-stakes decisions and challenging projects.");
            if (actions.length < 2) actions.push("Continue regular monitoring to detect changes early.");
          }
          const distRows = [
            { key: "excellent", label: t.statusExcellent, color: "#22d3ee" },
            { key: "good", label: t.statusGood, color: "#4ade80" },
            { key: "fair", label: t.statusFair, color: "#a3e635" },
            { key: "caution", label: t.statusCaution, color: "#fbbf24" },
            { key: "check", label: t.statusCheck, color: "#f87171" },
          ];
          const avgItems = [
            { label: t.avgHeartRate, sub: "Heart Rate", desc: t.avgBpmDesc, val: avgBpm, unit: "bpm" },
            { label: t.avgSystolic, sub: "Systolic BP", desc: t.avgSysDesc, val: avgSys, unit: "mmHg" },
            { label: t.avgDiastolic, sub: "Diastolic BP", desc: t.avgDiaDesc, val: avgDia, unit: "mmHg" },
          ];
          return (
            <div className="team-screen">
              <div className="team-header"><h2>{t.teamReportTitle}</h2><p>{t.teamReportSubtitle}</p></div>
              {/* 1. 総合評価（重複タイトル削除） */}
              <div className="team-comment-box">
                <div className="team-comment-title">{t.teamCommentTitle}</div>
                <div className="team-comment-text">{teamComment}</div>
              </div>
              {/* 2. 推奨アクション（総合評価の直下） */}
              <div className="team-comment-box" style={{ marginBottom: "20px" }}>
                <div className="team-comment-title">{t.recommendedActionsLabel}</div>
                {actions.map((action, i) => (
                  <div key={i} style={{ display: "flex", gap: "8px", marginTop: i === 0 ? 0 : "8px" }}>
                    <span style={{ color: currentTheme.accent, flexShrink: 0, fontWeight: 700 }}>•</span>
                    <span style={{ fontSize: "12px", color: currentTheme.textSecondary, lineHeight: 1.65 }}>{action}</span>
                  </div>
                ))}
              </div>
              {/* 3. 測定人数・最終更新 */}
              <div className="team-meta">
                <div className="team-meta-card">
                  <div className="team-meta-label">{t.totalMeasurements}</div>
                  <div className="team-meta-value">{total}<span className="team-meta-unit">{t.people}</span></div>
                </div>
                <div className="team-meta-card">
                  <div className="team-meta-label">{t.lastUpdated}</div>
                  <div style={{ fontSize: "11px", fontWeight: 600, color: currentTheme.text, marginTop: "4px", lineHeight: 1.4 }}>{lastDate}</div>
                </div>
              </div>
              {/* 4. 健康スコア分布 */}
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
              {/* 5. マネジメント指標 */}
              <p className="team-section-title">{t.managementTitle}</p>
              <div className="team-meta" style={{ marginBottom: "20px" }}>
                <div className="team-meta-card">
                  <div className="team-meta-label">{t.wellnessRateLabel}</div>
                  <div className="team-meta-value" style={{ color: wellnessRate >= 70 ? "#4ade80" : wellnessRate >= 50 ? "#fbbf24" : "#f87171" }}>{wellnessRate}<span className="team-meta-unit">%</span></div>
                </div>
                <div className="team-meta-card">
                  <div className="team-meta-label">{t.atRiskLabel}</div>
                  <div className="team-meta-value" style={{ color: atRiskCount === 0 ? currentTheme.text : atRiskCount / total >= 0.5 ? "#f87171" : "#fbbf24" }}>{atRiskCount}<span className="team-meta-unit">{language === "ja" ? "人" : " ppl"}</span></div>
                </div>
                <div className="team-meta-card">
                  <div className="team-meta-label">{t.stressLevelLabel}</div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "5px", marginTop: "6px" }}>
                    <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: stressColor, flexShrink: 0 }} />
                    <span style={{ fontSize: "13px", fontWeight: 700, color: stressColor }}>{t[stressKey as keyof typeof t]}</span>
                  </div>
                </div>
              </div>
              {/* 6. 平均値（説明文付き） */}
              <p className="team-section-title">{t.avgHeartRate} / {t.avgSystolic} / {t.avgDiastolic}</p>
              <div className="vital-cards" style={{ marginBottom: "20px" }}>
                {avgItems.map((item, i) => (
                  <div className="vital-card" key={i}>
                    <div className="vital-card-left" style={{ flex: 1, minWidth: 0 }}>
                      <div className="vital-card-label">{item.label}</div>
                      <div className="vital-card-sublabel">{item.sub}</div>
                      <div style={{ fontSize: "12px", color: currentTheme.textSecondary, lineHeight: 1.6, marginTop: "4px" }}>{item.desc}</div>
                    </div>
                    <div className="vital-card-right" style={{ flexShrink: 0, marginLeft: "12px" }}>
                      <div className="vital-card-value">{item.val}<span className="vital-card-unit"> {item.unit}</span></div>
                    </div>
                  </div>
                ))}
              </div>

              <button className="btn-reset" onClick={handleReset}>{t.backButton}</button>
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