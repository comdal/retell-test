"use client";

import { useEffect, useRef, useState } from "react";
import { RetellWebClient } from "retell-client-js-sdk";

export default function HomePage() {
  const clientRef = useRef<RetellWebClient | null>(null);
  const hasAutoStartedRef = useRef(false);

  const [status, setStatus] = useState("페이지가 열렸습니다.");
  const [isCalling, setIsCalling] = useState(false);
  const [isEmbedded, setIsEmbedded] = useState(false);

  const openInNewTab = () => {
    const url = window.location.href;
    const newWindow = window.open(url, "_blank", "noopener,noreferrer");

    if (!newWindow) {
      setStatus("팝업이 차단되었습니다. 브라우저 팝업 허용 후 다시 눌러주세요.");
    }
  };

  const handleStartCall = async () => {
    try {
      if (isCalling) return;

      setStatus("통화 연결 준비중...");

      const response = await fetch("/api/create-call", {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "서버 호출 실패");
      }

      setStatus("Retell 연결중...");

      await clientRef.current?.startCall({
        accessToken: data.accessToken,
      });
    } catch (error: any) {
      console.error("start call error:", error);
      setStatus(`오류: ${error?.message || "실패"}`);
      setIsCalling(false);
    }
  };

  const handleStopCall = () => {
    try {
      clientRef.current?.stopCall();
      setStatus("통화가 종료되었습니다.");
      setIsCalling(false);
    } catch (error: any) {
      console.error("stop call error:", error);
      setStatus("종료 중 오류");
    }
  };

  useEffect(() => {
    const embedded = window.self !== window.top;
    setIsEmbedded(embedded);

    const client = new RetellWebClient();
    clientRef.current = client;

    client.on("call_started", () => {
      setStatus("통화가 시작되었습니다.");
      setIsCalling(true);
    });

    client.on("call_ended", () => {
      setStatus("통화가 종료되었습니다.");
      setIsCalling(false);
    });

    client.on("error", (err: any) => {
      console.error("Retell client error:", err);
      setStatus(`오류: ${err?.message || "알 수 없음"}`);
      setIsCalling(false);
    });

    // 직접 접속일 때만 자동 시작
    if (!embedded && !hasAutoStartedRef.current) {
      hasAutoStartedRef.current = true;
      handleStartCall();
    }

    return () => {
      try {
        client.stopCall();
      } catch {}
    };
  }, []);

  return (
    <main
      style={{
        minHeight: "100vh",
        backgroundColor: "#f4f6f8",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "24px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "520px",
          backgroundColor: "#ffffff",
          borderRadius: "16px",
          boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
          padding: "32px",
        }}
      >
        <h1
          style={{
            marginTop: 0,
            marginBottom: "12px",
            fontSize: "28px",
            fontWeight: 700,
            color: "#222",
          }}
        >
          Retell Voice Test
        </h1>

        <p
          style={{
            marginTop: 0,
            marginBottom: "24px",
            color: "#555",
            lineHeight: 1.6,
          }}
        >
          상태: <strong>{status}</strong>
        </p>

        {isEmbedded ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <button
              onClick={openInNewTab}
              style={{
                width: "100%",
                padding: "14px 18px",
                border: "none",
                borderRadius: "10px",
                backgroundColor: "#2563eb",
                color: "#fff",
                fontSize: "16px",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              새 창으로 음성 상담 시작
            </button>

            <p
              style={{
                margin: 0,
                fontSize: "14px",
                color: "#666",
                lineHeight: 1.5,
              }}
            >
              Gather 안에서는 음성 통화가 제대로 동작하지 않을 수 있습니다.
              위 버튼을 눌러 새 탭에서 실행하세요.
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", gap: "12px" }}>
            <button
              onClick={handleStartCall}
              disabled={isCalling}
              style={{
                flex: 1,
                padding: "14px 18px",
                border: "none",
                borderRadius: "10px",
                backgroundColor: isCalling ? "#9ca3af" : "#2563eb",
                color: "#fff",
                fontSize: "16px",
                fontWeight: 700,
                cursor: isCalling ? "not-allowed" : "pointer",
              }}
            >
              통화 시작
            </button>

            <button
              onClick={handleStopCall}
              disabled={!isCalling}
              style={{
                flex: 1,
                padding: "14px 18px",
                border: "none",
                borderRadius: "10px",
                backgroundColor: !isCalling ? "#9ca3af" : "#dc2626",
                color: "#fff",
                fontSize: "16px",
                fontWeight: 700,
                cursor: !isCalling ? "not-allowed" : "pointer",
              }}
            >
              통화 종료
            </button>
          </div>
        )}
      </div>
    </main>
  );
}