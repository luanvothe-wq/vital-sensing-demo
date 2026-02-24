#!/usr/bin/env bun

import path from "path";
import { unlink } from "node:fs/promises";

type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

interface ApiEnvelope {
  code?: number;
  error?: boolean;
  message?: string | string[];
  data?: any;
  title?: string | null;
}

interface LoginResult {
  accessToken: string;
  userId: string;
  raw: ApiEnvelope;
}

interface VitalResult {
  bpm?: string | number;
  bpv1?: string | number;
  bpv0?: string | number;
  S2?: string | number;
  LTv?: string | number;
}

interface CliOptions {
  videoPath: string;
  baseUrl: string;
  phpBaseUrl: string;
  email: string;
  password: string;
  basicUser: string;
  basicPass: string;
  patientId?: string;
  userId?: string;
  receptionId?: string;
  saveData: boolean;
  skipHistory: boolean;
  json: boolean;
}

interface PreparedVideo {
  uploadPath: string;
  cleanup: () => Promise<void>;
  originalSizeBytes: number;
  uploadSizeBytes: number;
  transformed: boolean;
}

const DEFAULTS = {
  baseUrl: "https://jvit-demo.ishachoku.com/y-api/v1",
  phpBaseUrl: "https://jvit-demo.ishachoku.com",
  basicUser: "ishachoku_demo",
  basicPass: "od@jvit108",
  email: "a1123324sc430+demouser@googlemail.com",
  password: "password1234",
};

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

function printHelp() {
  console.log(`
Online Doctor Vital Sensing test script

Usage:
  bun scripts/test-online-doctor-vital-sensing.ts [options]

Options:
  --video <path>          Video file path (default: ./sample_video_1.mp4)
  --base-url <url>        y-api base URL
  --php-base-url <url>    Base URL for PHP history endpoint
  --email <email>         Login email
  --password <pass>       Login password
  --basic-user <user>     Basic Auth user for PHP history endpoint
  --basic-pass <pass>     Basic Auth password for PHP history endpoint
  --patient-id <id>       Optional patientId for get-signal
  --user-id <id>          Override user_id when save-data/history
  --reception-id <id>     Optional reception_id for save-data
  --save-data             Call save-data after get-signal
  --skip-history          Skip history API call
  --json                  Print full API responses as JSON
  --help                  Show this help

Examples:
  bun scripts/test-online-doctor-vital-sensing.ts
  bun scripts/test-online-doctor-vital-sensing.ts --save-data --json
  bun scripts/test-online-doctor-vital-sensing.ts --video ./sample_video_1.mp4 --patient-id 293_0
`);
}

function getArg(args: string[], name: string): string | undefined {
  const index = args.indexOf(name);
  if (index === -1) return undefined;
  return args[index + 1];
}

function parseArgs(): CliOptions {
  const args = process.argv.slice(2);

  if (args.includes("--help") || args.includes("-h")) {
    printHelp();
    process.exit(0);
  }

  const video = getArg(args, "--video");

  return {
    videoPath: video
      ? path.resolve(video)
      : path.resolve(import.meta.dir, "../sample_video_1.mp4"),
    baseUrl: getArg(args, "--base-url") ?? DEFAULTS.baseUrl,
    phpBaseUrl: getArg(args, "--php-base-url") ?? DEFAULTS.phpBaseUrl,
    email: getArg(args, "--email") ?? DEFAULTS.email,
    password: getArg(args, "--password") ?? DEFAULTS.password,
    basicUser: getArg(args, "--basic-user") ?? DEFAULTS.basicUser,
    basicPass: getArg(args, "--basic-pass") ?? DEFAULTS.basicPass,
    patientId: getArg(args, "--patient-id"),
    userId: getArg(args, "--user-id"),
    receptionId: getArg(args, "--reception-id"),
    saveData: args.includes("--save-data"),
    skipHistory: args.includes("--skip-history"),
    json: args.includes("--json"),
  };
}

function getMessage(message?: string | string[]): string {
  if (!message) return "";
  return Array.isArray(message) ? message.join(" | ") : message;
}

// ─── Debug helpers ───────────────────────────────────────
function dbgReq(method: string, url: string, extra?: Record<string, unknown>) {
  console.log(`  [REQ] ${method} ${url}`);
  if (extra) {
    for (const [k, v] of Object.entries(extra)) console.log(`         ${k}: ${v}`);
  }
}
function dbgRes(status: number, body: unknown) {
  const bodyStr = typeof body === "string" ? body : JSON.stringify(body);
  console.log(`  [RES] ${status} ${bodyStr.substring(0, 300)}${bodyStr.length > 300 ? "..." : ""}`);
}
function dbgStep(label: string) {
  console.log(`\n${"-".repeat(52)}`);
  console.log(`  → ${label}`);
  console.log("-".repeat(52));
}

async function parseResponse(response: Response): Promise<{ status: number; body: ApiEnvelope | JsonValue | string }> {
  const text = await response.text();
  if (!text) return { status: response.status, body: "" };

  try {
    return { status: response.status, body: JSON.parse(text) as ApiEnvelope | JsonValue };
  } catch {
    return { status: response.status, body: text };
  }
}

function ensureApiSuccess(parsed: { status: number; body: ApiEnvelope | JsonValue | string }, endpointName: string) {
  if (typeof parsed.body === "string") {
    if (!parsed.status || parsed.status < 200 || parsed.status >= 300) {
      throw new Error(`${endpointName} failed [${parsed.status}]: ${parsed.body}`);
    }
    return;
  }

  const body = parsed.body as ApiEnvelope;
  const code = body?.code;
  const isBusinessError = body?.error === true || (typeof code === "number" && code >= 400);
  const isHttpError = parsed.status < 200 || parsed.status >= 300;

  if (isHttpError || isBusinessError) {
    throw new Error(`${endpointName} failed [http:${parsed.status} code:${code ?? "N/A"}]: ${JSON.stringify(parsed.body)}`);
  }
}

async function prepareUploadVideo(videoPath: string): Promise<PreparedVideo> {
  const file = Bun.file(videoPath);
  console.log('videoPath', videoPath)
  const exists = await file.exists();
  if (!exists) {
    throw new Error(`Video file not found: ${videoPath}`);
  }

  const originalSizeBytes = file.size;
  if (originalSizeBytes <= MAX_UPLOAD_BYTES) {
    return {
      uploadPath: videoPath,
      cleanup: async () => { },
      originalSizeBytes,
      uploadSizeBytes: originalSizeBytes,
      transformed: false,
    };
  }

  const tempOutputPath = path.resolve(
    import.meta.dir,
    `../.tmp-online-doctor-upload-${Date.now()}.mp4`,
  );

  const ffmpeg = Bun.spawn([
    "ffmpeg",
    "-y",
    "-i",
    videoPath,
    "-an",
    "-vf",
    "scale='min(640,iw)':-2",
    "-c:v",
    "libx264",
    "-preset",
    "veryfast",
    "-crf",
    "35",
    "-movflags",
    "+faststart",
    tempOutputPath,
  ], {
    stdout: "ignore",
    stderr: "pipe",
  });

  const exitCode = await ffmpeg.exited;
  if (exitCode !== 0) {
    const errText = await new Response(ffmpeg.stderr).text();
    throw new Error(`ffmpeg failed while compressing video: ${errText}`);
  }

  const outputFile = Bun.file(tempOutputPath);
  const uploadSizeBytes = outputFile.size;

  if (uploadSizeBytes > MAX_UPLOAD_BYTES) {
    await unlink(tempOutputPath);
    throw new Error(
      `Compressed video is still larger than 10MB (${(uploadSizeBytes / 1024 / 1024).toFixed(2)}MB). ` +
      `Please provide a shorter or lower-resolution clip.`,
    );
  }

  return {
    uploadPath: tempOutputPath,
    cleanup: async () => {
      try {
        await unlink(tempOutputPath);
      } catch {
      }
    },
    originalSizeBytes,
    uploadSizeBytes,
    transformed: true,
  };
}

async function login(baseUrl: string, email: string, password: string): Promise<LoginResult> {
  const form = new FormData();
  form.append("mailaddress", email);
  form.append("password", password);

  dbgReq("POST", `${baseUrl}/user/user-login`, { mailaddress: email, password: "***" });
  const response = await fetch(`${baseUrl}/user/user-login`, {
    method: "POST",
    body: form,
  });

  const parsed = await parseResponse(response);
  dbgRes(parsed.status, parsed.body);
  ensureApiSuccess(parsed, "login");

  const body = parsed.body as ApiEnvelope;
  const data = (body?.data ?? {}) as Record<string, unknown>;
  const accessToken = String(data.access_token ?? "");

  const userRecord = data.user as Record<string, unknown> | undefined;
  const userIdCandidate = data.user_id ?? userRecord?.user_id ?? userRecord?.id;
  const userId = userIdCandidate !== undefined ? String(userIdCandidate) : "";

  if (!accessToken) {
    throw new Error(`Login response missing access_token: ${JSON.stringify(body)}`);
  }

  if (!userId) {
    throw new Error(`Login response missing user_id: ${JSON.stringify(body)}`);
  }

  return {
    accessToken,
    userId,
    raw: body,
  };
}

async function getSignal(baseUrl: string, token: string, videoPath: string, patientId?: string): Promise<{ raw: ApiEnvelope; vital: VitalResult }> {
  const file = Bun.file(videoPath);
  const exists = await file.exists();
  if (!exists) {
    throw new Error(`Video file not found: ${videoPath}`);
  }

  const form = new FormData();
  form.append("file", file, path.basename(videoPath));
  if (patientId) form.append("patientId", patientId);

  dbgReq("POST", `${baseUrl}/user/vital-sensing/get-signal`, {
    "Authorization": `Bearer ${token.substring(0, 16)}...`,
    "file": `${path.basename(videoPath)} (${(file.size / 1024).toFixed(1)} KB)`,
    ...(patientId ? { patientId } : {}),
  });
  const response = await fetch(`${baseUrl}/user/vital-sensing/get-signal`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: form,
  });

  const parsed = await parseResponse(response);
  dbgRes(parsed.status, parsed.body);
  ensureApiSuccess(parsed, "get-signal");

  const body = parsed.body as ApiEnvelope;
  const payload = (body?.data ?? {}) as Record<string, unknown>;
  const nested = (payload.enhance_response as Record<string, unknown> | undefined)?.data;
  const vital = ((nested ?? payload) as VitalResult);

  return {
    raw: body,
    vital,
  };
}

async function saveData(baseUrl: string, token: string, userId: string, vital: VitalResult, receptionId?: string): Promise<ApiEnvelope> {
  const requiredFields: Array<keyof VitalResult> = ["bpm", "bpv1", "bpv0", "S2", "LTv"];
  for (const key of requiredFields) {
    if (vital[key] === undefined || vital[key] === null || vital[key] === "") {
      throw new Error(`save-data missing required value from get-signal: ${key}`);
    }
  }

  const form = new FormData();
  form.append("vital_sensing_data[bpm]", String(vital.bpm));
  form.append("vital_sensing_data[bpv1]", String(vital.bpv1));
  form.append("vital_sensing_data[bpv0]", String(vital.bpv0));
  form.append("vital_sensing_data[S2]", String(vital.S2));
  form.append("vital_sensing_data[LTv]", String(vital.LTv));
  form.append("user_id", userId);
  if (receptionId) form.append("reception_id", receptionId);

  dbgReq("POST", `${baseUrl}/user/vital-sensing/save-data`, {
    "Authorization": `Bearer ${token.substring(0, 16)}...`,
    user_id: userId,
    bpm: vital.bpm, bpv1: vital.bpv1, bpv0: vital.bpv0,
    S2: vital.S2, LTv: vital.LTv,
    ...(receptionId ? { reception_id: receptionId } : {}),
  });
  const response = await fetch(`${baseUrl}/user/vital-sensing/save-data`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: form,
  });

  const parsed = await parseResponse(response);
  dbgRes(parsed.status, parsed.body);
  ensureApiSuccess(parsed, "save-data");

  return parsed.body as ApiEnvelope;
}

async function getHistory(phpBaseUrl: string, basicUser: string, basicPass: string, userid: string): Promise<unknown> {
  const url = new URL(`${phpBaseUrl}/api/vital_sensing/get_vital_signal_by_userid.php`);
  url.searchParams.set("userid", userid);
  url.searchParams.set("limit", "10");
  url.searchParams.set("offset", "0");

  const basicToken = Buffer.from(`${basicUser}:${basicPass}`).toString("base64");

  dbgReq("GET", url.toString(), { "Authorization": `Basic ${basicToken.substring(0, 8)}...` });
  const response = await fetch(url.toString(), {
    method: "GET",
    headers: {
      Authorization: `Basic ${basicToken}`,
    },
  });

  const parsed = await parseResponse(response);
  dbgRes(parsed.status, parsed.body);
  ensureApiSuccess(parsed, "get_vital_signal_by_userid");

  return parsed.body;
}

function printVitalReport(vital: VitalResult) {
  console.log("Vital report:");
  console.log(`- bpm : ${vital.bpm ?? "N/A"}`);
  console.log(`- bpv1: ${vital.bpv1 ?? "N/A"}`);
  console.log(`- bpv0: ${vital.bpv0 ?? "N/A"}`);
  console.log(`- S2  : ${vital.S2 ?? "N/A"}`);
  console.log(`- LTv : ${vital.LTv ?? "N/A"}`);
}

async function main() {
  const options = parseArgs();
  const preparedVideo = await prepareUploadVideo(options.videoPath);

  try {
    console.log("=== Online Doctor Vital Sensing API Test ===\n");
    console.log(`Video:        ${options.videoPath}`);
    if (preparedVideo.transformed) {
      console.log(
        `Upload video: ${(preparedVideo.originalSizeBytes / 1024 / 1024).toFixed(2)}MB -> ` +
        `${(preparedVideo.uploadSizeBytes / 1024 / 1024).toFixed(2)}MB (auto-compressed)`,
      );
    } else {
      console.log(`Upload video: ${(preparedVideo.uploadSizeBytes / 1024 / 1024).toFixed(2)}MB`);
    }
    console.log(`Base URL:     ${options.baseUrl}`);
    console.log(`PHP Base URL: ${options.phpBaseUrl}`);
    console.log(`Email:        ${options.email}`);
    console.log(`Save data:    ${options.saveData ? "yes" : "no"}`);
    console.log(`History:      ${options.skipHistory ? "skip" : "fetch"}`);
    console.log();

    dbgStep("Step 1: Login");
    const loginResult = await login(options.baseUrl, options.email, options.password);
    console.log(`   OK | user_id=${loginResult.userId}`);
    console.log(`   Message: ${getMessage(loginResult.raw.message) || "(none)"}`);

    dbgStep("Step 2: get-signal");
    const signalResult = await getSignal(
      options.baseUrl,
      loginResult.accessToken,
      preparedVideo.uploadPath,
      options.patientId,
    );
    console.log(`   OK | code=${signalResult.raw.code ?? "N/A"}`);
    console.log(`   Message: ${getMessage(signalResult.raw.message) || "(none)"}`);
    printVitalReport(signalResult.vital);

    const effectiveUserId = options.userId ?? loginResult.userId;
    const historyUserId = effectiveUserId.includes("_") ? effectiveUserId : `${effectiveUserId}_0`;

    let saveResponse: ApiEnvelope | undefined;
    if (options.saveData) {
      dbgStep("Step 3: save-data");
      saveResponse = await saveData(
        options.baseUrl,
        loginResult.accessToken,
        effectiveUserId,
        signalResult.vital,
        options.receptionId,
      );
      console.log(`   OK | code=${saveResponse.code ?? "N/A"}`);
      console.log(`   Message: ${getMessage(saveResponse.message) || "(none)"}`);
    }

    let historyResponse: unknown;
    if (!options.skipHistory) {
      dbgStep(`Step ${options.saveData ? "4" : "3"}: get_vital_signal_by_userid.php`);
      historyResponse = await getHistory(
        options.phpBaseUrl,
        options.basicUser,
        options.basicPass,
        historyUserId,
      );
      console.log(`   OK | userid=${historyUserId}`);
    }

    if (options.json) {
      console.log("\n=== JSON Output ===");
      console.log(
        JSON.stringify(
          {
            login: loginResult.raw,
            getSignal: signalResult.raw,
            saveData: saveResponse,
            history: historyResponse,
          },
          null,
          2,
        ),
      );
    }

    console.log("\n=== Completed ===");
  } finally {
    await preparedVideo.cleanup();
  }
}

main().catch((error) => {
  console.error("\n=== Failed ===");
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
