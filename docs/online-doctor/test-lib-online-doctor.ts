#!/usr/bin/env bun
/**
 * test-lib-online-doctor.ts
 *
 * Test script để kiểm tra trực tiếp lib/online-doctor.ts
 * Mục đích: loại trừ bug trong lib, so sánh với test-online-doctor-vital-sensing.ts
 *
 * Cách dùng:
 *   bun docs/online-doctor/test-lib-online-doctor.ts [--video <path>]
 *
 * Khác biệt so với test-online-doctor-vital-sensing.ts:
 *   - Script này import và dùng trực tiếp lib/online-doctor.ts
 *   - Simulate đúng flow của Next.js route handler:
 *       1. Nhận file từ FormData (multipart)
 *       2. Gọi analyzeVitalSignal(file: Blob | File)
 *   - Không có logic login/getSignal độc lập
 */

import path from "path";

// Import trực tiếp lib cần test
import { getAccessToken, analyzeVitalSignal, type VitalData } from "../../lib/online-doctor";

// ─────────────────────────────────────────────
// Debug helpers (đồng nhất format với test-online-doctor-vital-sensing.ts)
// ─────────────────────────────────────────────
function dbgStep(label: string) {
    console.log(`\n${"-".repeat(52)}`);
    console.log(`  → ${label}`);
    console.log("-".repeat(52));
}
function dbgReq(method: string, url: string, extra?: Record<string, unknown>) {
    console.log(`  [REQ] ${method} ${url}`);
    if (extra) {
        for (const [k, v] of Object.entries(extra)) console.log(`         ${k}: ${v}`);
    }
}
function dbgRes(status: number | string, body: unknown) {
    const bodyStr = typeof body === "string" ? body : JSON.stringify(body);
    console.log(`  [RES] ${status} ${bodyStr.substring(0, 300)}${bodyStr.length > 300 ? "..." : ""}`);
}
function dbgOk(label: string, value: unknown) {
    console.log(`  ✅  ${label}: ${value}`);
}
function dbgFail(label: string, value: unknown) {
    console.log(`  ❌  ${label}: ${value}`);
}

function getArg(args: string[], name: string): string | undefined {
    const i = args.indexOf(name);
    return i !== -1 ? args[i + 1] : undefined;
}

// ─────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────
async function main() {
    const args = process.argv.slice(2);
    const videoArg = getArg(args, "--video");
    const videoPath = videoArg
        ? path.resolve(videoArg)
        : path.resolve(import.meta.dir, "../sample_video_1.mp4");

    console.log("=".repeat(52));
    console.log("  lib/online-doctor.ts — Direct Library Test");
    console.log("=".repeat(52));
    console.log(`  Video      : ${videoPath}`);
    console.log(`  API_BASE   : ${process.env.API_BASE_URL ?? "a1123324sc430+demouser@googlemail.com"}`);
    console.log(`  LOGIN_EMAIL: ${process.env.LOGIN_EMAIL ?? "password1234"}`);

    // ── Step 1: getAccessToken ──────────────────────────
    dbgStep("Step 1: getAccessToken()");
    dbgReq(
        "POST",
        `${process.env.API_BASE_URL ?? "https://jvit-demo.ishachoku.com"}/y-api/v1/user/user-login`,
        { mailaddress: process.env.LOGIN_EMAIL ?? "a1123324sc430+demouser@googlemail.com", password: "password1234" },
    );
    let token: string;
    try {
        token = await getAccessToken();
        // lib đã log [RES] nội bộ — hiển thị tóm tắt
        dbgOk("token", `${token.substring(0, 20)}...`);
    } catch (err) {
        dbgFail("getAccessToken", err instanceof Error ? err.message : err);
        process.exit(1);
    }

    // ── Step 2: Đọc video file ──────────────────────────
    dbgStep("Step 2: Read video → Blob & File");
    let fileBlob: Blob;
    let fileObject: File;
    try {
        const bunFile = Bun.file(videoPath);
        if (!await bunFile.exists()) throw new Error(`File not found: ${videoPath}`);
        const arrayBuffer = await bunFile.arrayBuffer();
        fileBlob = new Blob([arrayBuffer], { type: "video/mp4" });
        fileObject = new File([arrayBuffer], path.basename(videoPath), { type: "video/mp4" });
        dbgOk("Blob", `size=${fileBlob.size}  type=${fileBlob.type}`);
        dbgOk("File", `name=${fileObject.name}  size=${fileObject.size}  type=${fileObject.type}`);
    } catch (err) {
        dbgFail("Read file", err instanceof Error ? err.message : err);
        process.exit(1);
    }

    // ── Step 3a: analyzeVitalSignal(Blob) ──────────────
    dbgStep("Step 3a: analyzeVitalSignal(Blob)  [simulate Next.js route — plain Blob]");
    dbgReq("POST (via lib)", "…/vital-sensing/get-signal", {
        "file (Blob)": `size=${fileBlob.size}  type=${fileBlob.type}`,
        "note": 'lib sẽ wrap thành File("vital_scan.mp4")',
    });
    let vitalFromBlob: VitalData | null = null;
    try {
        vitalFromBlob = await analyzeVitalSignal(fileBlob);
        // lib đã log [RES] nội bộ
        dbgOk("analyzeVitalSignal(Blob)", "thành công");
        dbgRes("data", vitalFromBlob);
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        dbgFail("analyzeVitalSignal(Blob)", msg);
        console.log("  → tiếp tục test với File object...");
    }

    // ── Step 3b: analyzeVitalSignal(File) ──────────────
    dbgStep("Step 3b: analyzeVitalSignal(File)  [simulate browser gửi File có .name]");
    dbgReq("POST (via lib)", "…/vital-sensing/get-signal", {
        "file (File)": `name=${fileObject.name}  size=${fileObject.size}  type=${fileObject.type}`,
        "note": "lib dùng File.name trực tiếp, không wrap lại",
    });
    let vitalFromFile: VitalData | null = null;
    try {
        vitalFromFile = await analyzeVitalSignal(fileObject);
        dbgOk("analyzeVitalSignal(File)", "thành công");
        dbgRes("data", vitalFromFile);
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        dbgFail("analyzeVitalSignal(File)", msg);
    }

    // ── Kết luận ────────────────────────────────────────
    dbgStep("Kết luận");
    const blobOk = vitalFromBlob !== null;
    const fileOk = vitalFromFile !== null;
    blobOk ? dbgOk("analyzeVitalSignal(Blob)", "OK") : dbgFail("analyzeVitalSignal(Blob)", "FAILED");
    fileOk ? dbgOk("analyzeVitalSignal(File)", "OK") : dbgFail("analyzeVitalSignal(File)", "FAILED");

    if (blobOk || fileOk) {
        console.log("\n  🎉  lib/online-doctor.ts hoạt động đúng!\n");
    } else {
        console.log("\n  ⚠️  Cả 2 đều fail — xem [RES] body bên trên để biết lỗi.");
        console.log("     'ご利用回数の上限に達しました' → lib đúng, API quota hết.");
        console.log("     Lỗi khác → cần điều tra thêm.\n");
    }
}

main().catch((err) => {
    console.error("\n=== Script error ===");
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
});
