"use client";

import { useEffect, useRef, useState } from "react";
import { RetellWebClient } from "retell-client-js-sdk";

export default function HomePage() {
  const clientRef = useRef<RetellWebClient | null>(null);

  const [status, setStatus] = useState("대기중");
  const [isCalling, setIsCalling] = useState(false);

  useEffect(() => {
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

    return () => {
      try {
        client.stopCall();
      } catch {
      }
    };
  }, []);

  const handleStartCall = async () => {
    try {
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
      setStatus("통화 종료 버튼을 눌렀습니다.");
      setIsCalling(false);
    } catch (error: any) {
      console.error("stop call error:", error);
      setStatus("종료 중 오류");
    }
  };

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
          maxWidth: "480px",
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
      </div>
    </main>
  );
}