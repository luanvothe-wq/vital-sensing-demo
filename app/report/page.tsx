"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { type ThemePalette, getThemeColors } from "../theme-palettes";
import { type TeamReport } from "../../lib/reportService";

// ============================================
// 型定義
// ============================================
type LookupStep = "search" | "loading" | "found" | "not-found" | "error";
type Language = "ja" | "en";

// ============================================
// 翻訳データ
// ============================================
const t = {
    ja: {
        pageTitle: "レポート照会",
        pageSubtitle: "Report Lookup",
        inputLabel: "レポートID（4桁）を入力してください",
        inputHint: "測定後に表示された VS-XXXX の数字部分を入力します",
        searchButton: "検索する",
        searching: "検索中...",
        notFoundTitle: "レポートが見つかりません",
        notFoundMsg: "入力されたIDに対応するレポートが見つかりませんでした。IDをご確認の上、再度お試しください。",
        errorTitle: "エラーが発生しました",
        errorMsg: "レポートの取得に失敗しました。しばらく時間をおいて再度お試しください。",
        backToMain: "← トップに戻る",
        tryAgain: "再検索する",
        foundTitle: "測定結果",
        foundSubtitle: "Measurement Results",
        measuredAt: "測定日時",
        reportIdLabel: "レポートID",
        disclaimer: "⚠ この結果は医療診断ではなく、参考値として提供しています。測定環境(照明・動き・端末)により結果が変動する場合があります。",
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
        statusNormal: "正常",
        statusCaution: "やや注意",
        statusCheck: "要確認",
        statusExcellent: "絶好調",
        statusGood: "良好",
        statusFair: "普通",
        commentExcellent: "心拍数・血圧ともに理想的な生理的範囲内にあり、心血管系の機能が非常に良好な状態です。現在の生活習慣を継続しながら、年1回の定期健診による継続的なモニタリングをお勧めします。",
        commentGood: "測定値は正常範囲内にあり、心血管系の健康状態は良好です。有酸素運動（週150分程度）・バランスの取れた食事・質の良い睡眠（7〜8時間）を継続することで、この状態を維持できます。",
        commentFair: "測定値の一部が正常範囲の上限に近い傾向があります。予防的観点から、1日の塩分摂取量の見直し（目標6g未満）と、ウォーキングなどの有酸素運動の習慣化をお勧めします。",
        commentCaution: "一部の測定値が正常範囲をやや逸脱しています。塩分・カフェイン・アルコールの過剰摂取を控え、ストレス軽減と十分な睡眠を優先してください。数週間後に再測定し、数値の推移を確認することをお勧めします。",
        commentCheck: "複数の測定値が正常範囲を大きく外れています。同様の値が続く場合は医療機関での精密検査を強くお勧めします。まず安静を保ち、改めて測定してください。",
        badge: "体験デモ",
    },
    en: {
        pageTitle: "Report Lookup",
        pageSubtitle: "レポート照会",
        inputLabel: "Enter your 4-digit Report ID",
        inputHint: "Enter the 4-digit number shown as VS-XXXX after your measurement",
        searchButton: "Search",
        searching: "Searching...",
        notFoundTitle: "Report Not Found",
        notFoundMsg: "No report was found for the entered ID. Please check the ID and try again.",
        errorTitle: "An Error Occurred",
        errorMsg: "Failed to retrieve the report. Please wait a moment and try again.",
        backToMain: "← Back to Main",
        tryAgain: "Search Again",
        foundTitle: "Measurement Results",
        foundSubtitle: "測定結果",
        measuredAt: "Measured At",
        reportIdLabel: "Report ID",
        disclaimer: "⚠ These results are for reference only and not medical diagnosis. Results may vary depending on measurement environment (lighting, movement, device).",
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
        statusNormal: "Normal",
        statusCaution: "Caution",
        statusCheck: "Check",
        statusExcellent: "Excellent",
        statusGood: "Good",
        statusFair: "Fair",
        commentExcellent: "Both heart rate and blood pressure are within optimal physiological ranges, indicating excellent cardiovascular function. Continue your current lifestyle and consider annual health screenings for ongoing monitoring.",
        commentGood: "Measurements are within normal ranges, reflecting good cardiovascular health. Sustain aerobic exercise (approx. 150 min/week), a balanced diet, and quality sleep (7–8 hours) to maintain these results.",
        commentFair: "Some values are approaching the upper limits of normal ranges. Reviewing daily sodium intake (target under 6g/day) and establishing a regular aerobic exercise habit such as walking is advisable.",
        commentCaution: "Some measurements fall slightly outside normal ranges. Reduce excess sodium, caffeine, and alcohol, and prioritize stress reduction and adequate sleep. Remeasuring in a few weeks to track trends is recommended.",
        commentCheck: "Multiple measurements fall significantly outside normal ranges. If similar values persist, we strongly recommend consulting a healthcare professional for a thorough evaluation.",
        badge: "Demo",
    },
};

// ============================================
// スコア計算（page.tsx と同じロジック）
// ============================================
function computeScore(report: TeamReport): number {
    const bpm = parseFloat(report.bpm);
    const sys = parseFloat(report.bpv1);
    const dia = parseFloat(report.bpv0);
    let score = 0;
    if (bpm >= 60 && bpm <= 100) score += 2; else if (bpm >= 50 && bpm <= 110) score += 1;
    if (sys >= 90 && sys <= 130) score += 2; else if (sys >= 80 && sys <= 140) score += 1;
    if (dia >= 60 && dia <= 85) score += 2; else if (dia >= 50 && dia <= 90) score += 1;
    return score;
}

function getOverallEvaluation(report: TeamReport, lang: Language) {
    const tr = t[lang];
    const score = report.score ?? computeScore(report);
    if (score >= 6) return { label: tr.statusExcellent, comment: tr.commentExcellent, color: "#22d3ee", emoji: "😄" };
    if (score >= 5) return { label: tr.statusGood, comment: tr.commentGood, color: "#4ade80", emoji: "😊" };
    if (score >= 3) return { label: tr.statusFair, comment: tr.commentFair, color: "#a3e635", emoji: "🙂" };
    if (score >= 1) return { label: tr.statusCaution, comment: tr.commentCaution, color: "#fbbf24", emoji: "🤔" };
    return { label: tr.statusCheck, comment: tr.commentCheck, color: "#f87171", emoji: "😟" };
}

function getVitalStatus(type: string, value: string, lang: Language) {
    const tr = t[lang];
    const v = parseFloat(value);
    if (type === "bpm") {
        if (v >= 60 && v <= 100) return { label: tr.statusNormal, color: "#4ade80" };
        if (v >= 50 && v <= 110) return { label: tr.statusCaution, color: "#fbbf24" };
        return { label: tr.statusCheck, color: "#f87171" };
    }
    if (type === "sys") {
        if (v >= 90 && v <= 130) return { label: tr.statusNormal, color: "#4ade80" };
        if (v >= 80 && v <= 140) return { label: tr.statusCaution, color: "#fbbf24" };
        return { label: tr.statusCheck, color: "#f87171" };
    }
    if (type === "dia") {
        if (v >= 60 && v <= 85) return { label: tr.statusNormal, color: "#4ade80" };
        if (v >= 50 && v <= 90) return { label: tr.statusCaution, color: "#fbbf24" };
        return { label: tr.statusCheck, color: "#f87171" };
    }
    return { label: "—", color: "#64b4ff" };
}

// ============================================
// Inner Component (uses useSearchParams → Suspense required)
// ============================================
function ReportLookupInner() {
    const searchParams = useSearchParams();
    const router = useRouter();

    const [step, setStep] = useState<LookupStep>("search");
    const [inputId, setInputId] = useState("");
    const [report, setReport] = useState<TeamReport | null>(null);
    const [errorMsg, setErrorMsg] = useState("");
    const [language, setLanguage] = useState<Language>("ja");
    const [themePalette, setThemePalette] = useState<ThemePalette>("clinical-blue");

    const isDark = themePalette === "clinical-blue";
    const currentTheme = getThemeColors(themePalette, isDark ? "dark" : "light");
    const tr = t[language];

    // LocalStorageからtheme・languageを初期化
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

    // テーマ・言語変更をLocalStorageに保存
    useEffect(() => {
        localStorage.setItem("themePalette", themePalette);
        localStorage.setItem("language", language);
    }, [themePalette, language]);

    // URLクエリ ?id=XXXX → auto-fill & auto search
    const initialId = searchParams.get("id") ?? "";
    useEffect(() => {
        if (/^\d{4}$/.test(initialId)) {
            setInputId(initialId);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initialId]);

    // autoSearch: inputId が4桁になったとき（URLから来た場合）自動検索
    useEffect(() => {
        if (/^\d{4}$/.test(inputId) && initialId === inputId && step === "search") {
            handleSearch(inputId);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [inputId]);

    const handleSearch = useCallback(async (id: string) => {
        const searchId = id.trim();
        if (!/^\d{4}$/.test(searchId)) return;

        setStep("loading");
        setReport(null);
        setErrorMsg("");

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);
            const res = await fetch(`/api/reports/${searchId}`, {
                signal: controller.signal,
            });
            clearTimeout(timeoutId);

            if (res.status === 404) {
                setStep("not-found");
                return;
            }
            if (!res.ok) {
                throw new Error(`HTTP ${res.status}`);
            }

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const data = await res.json() as any;
            if (data.report) {
                setReport(data.report as TeamReport);
                setStep("found");
                // URLをクリーンに更新（ブラウザ履歴に残さない）
                router.replace(`/report?id=${searchId}`, { scroll: false });
            } else {
                setStep("not-found");
            }
        } catch (err: unknown) {
            if (err instanceof Error && err.name === "AbortError") {
                setErrorMsg(tr.errorMsg);
            } else {
                setErrorMsg(tr.errorMsg);
            }
            setStep("error");
        }
    }, [router, tr.errorMsg]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        // 数字のみ、4桁まで
        const val = e.target.value.replace(/\D/g, "").slice(0, 4);
        setInputId(val);
        // 入力変更時はsearch状態に戻す（結果/エラー表示をクリア）
        if (step !== "search" && step !== "loading") {
            setStep("search");
            setReport(null);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        handleSearch(inputId);
    };

    const handleReset = () => {
        setStep("search");
        setInputId("");
        setReport(null);
        setErrorMsg("");
        router.replace("/report", { scroll: false });
    };

    return (
        <div className="app-container">
            <style jsx global>{`
        @import url("https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@300;400;500;600;700&display=swap");
        * { margin:0; padding:0; box-sizing:border-box; }
        body { font-family:"Noto Sans JP",sans-serif; background:${currentTheme.background}; color:${currentTheme.text}; -webkit-font-smoothing:antialiased; }
        .app-container { width:100vw; min-height:100dvh; display:flex; flex-direction:column; position:relative; }
        .bg-gradient { position:fixed; inset:0; background:${currentTheme.gradient},${currentTheme.background}; z-index:0; }

        /* ─── Header ─── */
        .header { position:relative; z-index:10; padding:16px 20px; display:flex; align-items:center; justify-content:space-between; border-bottom:1px solid ${isDark ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.06)'}; background:${isDark ? 'rgba(0,0,0,.2)' : 'rgba(255,255,255,.7)'}; backdrop-filter:blur(12px); }
        .logo { font-size:14px; font-weight:600; letter-spacing:.08em; color:${currentTheme.text}; text-transform:uppercase; background:none; border:none; cursor:pointer; transition:all .2s ease; padding:0; text-decoration:none; display:inline-flex; align-items:center; gap:6px; }
        .logo:hover { opacity:0.7; }
        .badge { font-size:10px; padding:3px 8px; border-radius:20px; background:${isDark ? 'rgba(60,140,220,.15)' : 'rgba(59,130,246,.15)'}; color:${currentTheme.accent}; font-weight:500; }
        .header-right { display:flex; gap:8px; align-items:center; }
        .palette-selector { background:${isDark ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.04)'}; border:1px solid ${isDark ? 'rgba(255,255,255,.1)' : 'rgba(0,0,0,.1)'}; border-radius:8px; padding:5px 10px; font-size:11px; color:${currentTheme.text}; cursor:pointer; transition:all .2s ease; font-family:"Noto Sans JP",sans-serif; font-weight:500; outline:none; }
        .palette-selector:focus { border-color:${currentTheme.accent}; box-shadow:0 0 0 2px ${currentTheme.accent}33; }
        .lang-toggle { background:${isDark ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.04)'}; border:1px solid ${isDark ? 'rgba(255,255,255,.1)' : 'rgba(0,0,0,.1)'}; border-radius:8px; padding:5px 10px; font-size:11px; color:${currentTheme.textSecondary}; cursor:pointer; transition:all .2s ease; font-family:"Noto Sans JP",sans-serif; font-weight:500; }
        .lang-toggle:hover { background:${isDark ? 'rgba(255,255,255,.1)' : 'rgba(0,0,0,.08)'}; }

        /* ─── Main ─── */
        .main-content { flex:1; display:flex; flex-direction:column; align-items:center; justify-content:flex-start; position:relative; z-index:10; padding:32px 20px 60px; }

        /* ─── Search Card ─── */
        .lookup-card { width:100%; max-width:440px; animation:fadeInUp .5s ease; }
        .lookup-title { text-align:center; margin-bottom:32px; }
        .lookup-title h1 { font-size:24px; font-weight:700; color:${currentTheme.text}; margin-bottom:4px; }
        .lookup-title p { font-size:12px; color:${currentTheme.textTertiary}; letter-spacing:.06em; }
        .search-form { background:${currentTheme.cardBg}; border:1px solid ${currentTheme.cardBorder}; border-radius:20px; padding:28px 24px; margin-bottom:16px; }
        .input-label { display:block; font-size:13px; font-weight:500; color:${currentTheme.textSecondary}; margin-bottom:8px; }
        .id-prefix { font-size:22px; font-weight:700; color:${currentTheme.textTertiary}; letter-spacing:.06em; line-height:1; }
        .id-input-wrapper { display:flex; align-items:center; gap:10px; background:${isDark ? 'rgba(255,255,255,.04)' : 'rgba(0,0,0,.03)'}; border:2px solid ${isDark ? 'rgba(255,255,255,.1)' : 'rgba(0,0,0,.1)'}; border-radius:14px; padding:14px 18px; transition:border-color .2s ease; margin-bottom:8px; }
        .id-input-wrapper:focus-within { border-color:${currentTheme.accent}; box-shadow:0 0 0 3px ${currentTheme.accent}22; }
        .id-input { background:none; border:none; outline:none; font-size:36px; font-weight:700; color:${currentTheme.text}; font-family:"Noto Sans JP",sans-serif; letter-spacing:.18em; width:100%; text-align:center; caret-color:${currentTheme.accent}; }
        .id-input::placeholder { color:${isDark ? 'rgba(255,255,255,.18)' : 'rgba(0,0,0,.18)'}; letter-spacing:.18em; }
        .input-hint { font-size:11px; color:${currentTheme.textTertiary}; text-align:center; margin-bottom:20px; line-height:1.5; }
        .btn-search { width:100%; padding:15px 24px; border:none; border-radius:12px; background:linear-gradient(135deg,#1e50a0,#2a6db8); color:white; font-size:15px; font-weight:600; cursor:pointer; transition:all .2s ease; font-family:"Noto Sans JP",sans-serif; box-shadow:0 4px 16px rgba(30,80,160,.3); display:flex; align-items:center; justify-content:center; gap:8px; }
        .btn-search:disabled { opacity:0.4; cursor:not-allowed; box-shadow:none; }
        .btn-search:not(:disabled):hover { box-shadow:0 6px 24px rgba(30,80,160,.4); transform:translateY(-1px); }
        .btn-search:not(:disabled):active { transform:scale(.98) translateY(0); }

        /* ─── Spinner ─── */
        .spinner { width:20px; height:20px; border-radius:50%; border:2px solid rgba(255,255,255,.3); border-top-color:#fff; animation:spin 0.8s linear infinite; }
        .spinner-lg { width:52px; height:52px; border-radius:50%; border:3px solid ${isDark ? 'rgba(255,255,255,.08)' : 'rgba(0,0,0,.08)'}; border-top-color:${currentTheme.accent}; animation:spin 1s linear infinite; margin:0 auto 20px; }

        /* ─── Not Found / Error ─── */
        .status-box { background:${currentTheme.cardBg}; border:1px solid ${currentTheme.cardBorder}; border-radius:16px; padding:28px 24px; text-align:center; animation:fadeInUp .4s ease; }
        .status-icon { width:52px; height:52px; border-radius:50%; display:flex; align-items:center; justify-content:center; margin:0 auto 16px; font-size:24px; }
        .status-icon--notfound { background:rgba(251,191,36,.1); }
        .status-icon--error { background:rgba(248,113,113,.1); }
        .status-title { font-size:17px; font-weight:700; color:${currentTheme.text}; margin-bottom:10px; }
        .status-msg { font-size:13px; color:${currentTheme.textSecondary}; line-height:1.7; margin-bottom:24px; }
        .btn-retry { width:100%; padding:14px; border:none; border-radius:12px; background:${isDark ? 'rgba(255,255,255,.08)' : 'rgba(0,0,0,.06)'}; color:${currentTheme.text}; font-size:14px; font-weight:600; cursor:pointer; font-family:"Noto Sans JP",sans-serif; border:1px solid ${currentTheme.cardBorder}; transition:all .2s ease; }
        .btn-retry:hover { background:${isDark ? 'rgba(255,255,255,.12)' : 'rgba(0,0,0,.1)'}; }

        /* ─── Result ─── */
        .result-screen { width:100%; max-width:440px; animation:fadeInUp .5s ease; padding-bottom:20px; }
        .result-header { text-align:center; margin-bottom:20px; }
        .result-header h2 { font-size:20px; font-weight:700; color:${currentTheme.text}; }
        .result-header p { font-size:11px; color:${currentTheme.textTertiary}; margin-top:2px; letter-spacing:.08em; }
        .overall-eval { border-radius:16px; padding:24px 20px; margin-bottom:20px; text-align:center; border:1px solid; }
        .overall-label { font-size:22px; font-weight:700; margin-bottom:8px; display:flex; align-items:center; justify-content:center; gap:10px; }
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
        .result-meta { background:${isDark ? 'rgba(100,180,255,.06)' : 'rgba(59,130,246,.06)'}; border:1px solid ${isDark ? 'rgba(100,180,255,.15)' : 'rgba(59,130,246,.15)'}; border-radius:12px; padding:12px 16px; margin-bottom:16px; display:flex; flex-direction:column; gap:6px; }
        .result-meta-row { display:flex; justify-content:space-between; align-items:center; }
        .result-meta-label { font-size:11px; color:${currentTheme.textTertiary}; }
        .result-meta-value { font-size:12px; font-weight:600; color:${currentTheme.accent}; font-family:monospace; }
        .result-notice { background:${isDark ? 'rgba(255,180,60,.08)' : 'rgba(0,0,0,.04)'}; border:1px solid ${isDark ? 'rgba(255,180,60,.15)' : currentTheme.cardBorder}; border-radius:10px; padding:12px 14px; margin-bottom:20px; }
        .result-notice p { font-size:10px; color:${currentTheme.textSecondary}; line-height:1.6; }
        .btn-back { width:100%; padding:15px; border:1px solid ${currentTheme.cardBorder}; border-radius:12px; background:${isDark ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.04)'}; color:${currentTheme.text}; font-size:14px; font-weight:600; cursor:pointer; font-family:"Noto Sans JP",sans-serif; transition:all .2s ease; }
        .btn-back:hover { background:${isDark ? 'rgba(255,255,255,.1)' : 'rgba(0,0,0,.08)'}; }

        /* ─── Back link ─── */
        .back-link { display:inline-flex; align-items:center; gap:6px; font-size:13px; color:${currentTheme.textTertiary}; text-decoration:none; margin-bottom:28px; transition:color .2s ease; cursor:pointer; background:none; border:none; padding:0; font-family:"Noto Sans JP",sans-serif; }
        .back-link:hover { color:${currentTheme.accent}; }

        /* ─── Separator ─── */
        .sep { width:100%; height:1px; background:${currentTheme.cardBorder}; margin:20px 0; }

        /* ─── Animations ─── */
        @keyframes fadeInUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        @keyframes spin { to { transform:rotate(360deg); } }

        /* ─── Responsive ─── */
        @media (max-width:479px) {
          .header { padding:10px 14px; gap:8px; }
          .header-right { gap:6px; }
          .main-content { padding:24px 16px 48px; }
          .search-form { padding:22px 18px; }
          .id-input { font-size:30px; }
        }
      `}</style>

            <div className="bg-gradient" />

            {/* Header */}
            <header className="header">
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <a href="/" className="logo">
                        Vital Sensing
                    </a>
                    <span className="badge">{tr.badge}</span>
                </div>
                <div className="header-right">
                    <select
                        className="palette-selector"
                        value={themePalette}
                        onChange={(e) => setThemePalette(e.target.value as ThemePalette)}
                    >
                        <option value="clinical-blue">Clinical Blue</option>
                        <option value="clean-white">Clean White</option>
                    </select>
                    <button
                        className="lang-toggle"
                        onClick={() => setLanguage(language === "ja" ? "en" : "ja")}
                    >
                        🌐 {language.toUpperCase()}
                    </button>
                </div>
            </header>

            {/* Main content */}
            <main className="main-content">

                {/* Loading state */}
                {step === "loading" && (
                    <div className="lookup-card" style={{ textAlign: "center", paddingTop: "60px" }}>
                        <div className="spinner-lg" />
                        <p style={{ fontSize: "15px", color: currentTheme.textSecondary }}>
                            {tr.searching}
                        </p>
                    </div>
                )}

                {/* Search form (shown when step is search, not-found, or error) */}
                {(step === "search" || step === "not-found" || step === "error") && (
                    <div className="lookup-card">
                        <div className="lookup-title">
                            <h1>{tr.pageTitle}</h1>
                            <p>{tr.pageSubtitle}</p>
                        </div>

                        <form className="search-form" onSubmit={handleSubmit}>
                            <label className="input-label" htmlFor="report-id-input">
                                {tr.inputLabel}
                            </label>
                            <div className="id-input-wrapper">
                                <span className="id-prefix">VS-</span>
                                <input
                                    id="report-id-input"
                                    type="text"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    className="id-input"
                                    placeholder="0000"
                                    value={inputId}
                                    onChange={handleInputChange}
                                    maxLength={4}
                                    autoComplete="off"
                                    autoFocus
                                />
                            </div>
                            <p className="input-hint">{tr.inputHint}</p>
                            <button
                                type="submit"
                                className="btn-search"
                                disabled={inputId.length !== 4}
                            >
                                {tr.searchButton}
                            </button>
                        </form>

                        {/* Not Found feedback */}
                        {step === "not-found" && (
                            <div className="status-box" style={{ borderColor: "rgba(251,191,36,.2)" }}>
                                <div className="status-icon status-icon--notfound">🔍</div>
                                <div className="status-title">{tr.notFoundTitle}</div>
                                <p className="status-msg">{tr.notFoundMsg}</p>
                            </div>
                        )}

                        {/* Error feedback */}
                        {step === "error" && (
                            <div className="status-box" style={{ borderColor: "rgba(248,113,113,.2)" }}>
                                <div className="status-icon status-icon--error">⚠️</div>
                                <div className="status-title">{tr.errorTitle}</div>
                                <p className="status-msg">{errorMsg || tr.errorMsg}</p>
                            </div>
                        )}

                        {/* Back to main */}
                        <div style={{ textAlign: "center", marginTop: "20px" }}>
                            <a href="/" className="back-link">{tr.backToMain}</a>
                        </div>
                    </div>
                )}

                {/* Result display */}
                {step === "found" && report && (() => {
                    const ev = getOverallEvaluation(report, language);
                    const bs = getVitalStatus("bpm", report.bpm, language);
                    const ss = getVitalStatus("sys", report.bpv1, language);
                    const ds = getVitalStatus("dia", report.bpv0, language);
                    // createdAt từ API là ISO string (không phải object {toDate()})
                    const measuredAt = report.createdAt
                        ? new Date(report.createdAt as unknown as string).toLocaleString(language === "ja" ? "ja-JP" : "en-US", {
                            year: "numeric", month: "long", day: "numeric",
                            hour: "2-digit", minute: "2-digit", hour12: false,
                        })
                        : "—";

                    return (
                        <div className="result-screen">
                            {/* Search again */}
                            <button className="back-link" onClick={handleReset} style={{ marginBottom: "20px" }}>
                                ← {tr.tryAgain}
                            </button>

                            <div className="result-header">
                                <h2>{tr.foundTitle}</h2>
                                <p>{tr.foundSubtitle}</p>
                            </div>

                            {/* Overall status card */}
                            <div
                                className="overall-eval"
                                style={{ background: `${ev.color}10`, borderColor: `${ev.color}30` }}
                            >
                                <div className="overall-label" style={{ color: ev.color }}>
                                    <span style={{ fontSize: "28px" }}>{ev.emoji}</span>
                                    {ev.label}
                                </div>
                                <div className="overall-comment">{ev.comment}</div>
                            </div>

                            {/* Vital metric cards */}
                            <div className="vital-cards">
                                {[
                                    { label: tr.heartRate, sub: tr.heartRateSub, val: report.bpm, unit: " bpm", st: bs },
                                    { label: tr.systolic, sub: tr.systolicSub, val: report.bpv1, unit: " mmHg", st: ss },
                                    { label: tr.diastolic, sub: tr.diastolicSub, val: report.bpv0, unit: " mmHg", st: ds },
                                    { label: tr.s2Signal, sub: tr.s2SignalSub, val: report.S2, unit: "", st: { label: "—", color: "#64b4ff" } },
                                    { label: tr.ltvValue, sub: tr.ltvValueSub, val: report.LTv, unit: "", st: { label: "—", color: "#64b4ff" } },
                                ].map((item, i) => (
                                    <div className="vital-card" key={i}>
                                        <div className="vital-card-left">
                                            <div className="vital-card-label">{item.label}</div>
                                            <div className="vital-card-sublabel">{item.sub}</div>
                                        </div>
                                        <div className="vital-card-right">
                                            <div className="vital-card-value" style={{ color: item.st.color }}>
                                                {item.val}
                                                <span className="vital-card-unit">{item.unit}</span>
                                            </div>
                                            {item.st.label !== "—" && (
                                                <div
                                                    className="vital-card-status"
                                                    style={{ background: `${item.st.color}20`, color: item.st.color }}
                                                >
                                                    {item.st.label}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Report meta (ID + measured at) */}
                            <div className="result-meta">
                                <div className="result-meta-row">
                                    <span className="result-meta-label">{tr.reportIdLabel}</span>
                                    <span className="result-meta-value">VS-{report.shortId ?? inputId}</span>
                                </div>
                                <div className="result-meta-row">
                                    <span className="result-meta-label">{tr.measuredAt}</span>
                                    <span className="result-meta-value" style={{ fontFamily: "sans-serif", fontSize: "11px" }}>
                                        {measuredAt}
                                    </span>
                                </div>
                            </div>

                            {/* Disclaimer */}
                            <div className="result-notice">
                                <p>{tr.disclaimer}</p>
                            </div>

                            {/* Actions */}
                            <button className="btn-back" onClick={handleReset}>{tr.tryAgain}</button>
                        </div>
                    );
                })()}
            </main>
        </div>
    );
}

// ============================================
// Page export (Suspense wrapper for useSearchParams)
// ============================================
export default function ReportLookupPage() {
    return (
        <Suspense fallback={null}>
            <ReportLookupInner />
        </Suspense>
    );
}
