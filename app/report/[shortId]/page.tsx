"use client";

import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";

/**
 * /report/[shortId] — Redirect page
 *
 * Cho phép URL trực tiếp như /report/1234 hoạt động.
 * Redirect về /report?id=1234 để search form tự động điền và tìm kiếm.
 *
 * Edge cases:
 * - shortId không phải 4 chữ số → redirect về /report (trống)
 */
export default function DirectReportPage() {
    const router = useRouter();
    const params = useParams();
    const shortId = params.shortId as string;

    useEffect(() => {
        if (/^\d{4}$/.test(shortId)) {
            router.replace(`/report?id=${shortId}`);
        } else {
            router.replace("/report");
        }
    }, [shortId, router]);

    // Minimal loading UI trong khi redirect
    return (
        <div
            style={{
                width: "100vw",
                height: "100dvh",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "#0c1821",
                fontFamily: '"Noto Sans JP", sans-serif',
            }}
        >
            <div
                style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "50%",
                    border: "3px solid rgba(255,255,255,.1)",
                    borderTopColor: "#38bdf8",
                    animation: "spin 0.8s linear infinite",
                }}
            />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}
