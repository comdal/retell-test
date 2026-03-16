"use client";

import { useEffect, useRef, useState } from "react";
import { RetellWebClient } from "retell-client-js-sdk";

export default function HomePage() {
  const clientRef = useRef<RetellWebClient | null>(null);
  const hasAutoStartedRef = useRef(false);

  const [status, setStatus] = useState("페이지가 열렸습니다.");
  const [isCalling, setIsCalling] = useState(false);
  const [isEmbedded, setIsEmbedded] = useState(false);

  // 1. 임베디드 여부 체크 및 초기화
  useEffect(() => {
    const embedded = window.self !== window.top;
    setIsEmbedded(embedded);

    const client = new RetellWebClient();
    clientRef.current = client;

    // 이벤트 리스너 설정
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
      setStatus(`오류: ${err?.message || "마이크 권한이 거부되었을 수 있습니다."}`);
      setIsCalling(false);
    });

    // 직접 접속 시에만 자동 시작 (브라우저 정책상 첫 방문은 클릭이 필요할 수 있음)
    if (!embedded && !hasAutoStartedRef.current) {
      hasAutoStartedRef.current = true;
      // Note: 일부 브라우저는 첫 로딩 시 바로 실행하면 오디오 권한 문제로 실패할 수 있습니다.
    }

    return () => { client.stopCall(); };
  }, []);

  // 2. 마이크 권한 미리 요청 (디버깅용)
  const requestMicPermission = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      handleStartCall();
    } catch (err) {
      setStatus("마이크 권한 승인이 필요합니다.");
      console.error(err);
    }
  };

  const openInNewTab = () => {
    // Gather 내부에서 팝업이 막힐 경우를 대비해 <a> 태그 우회 방식 사용
    const url = window.location.href;
    const a = document.createElement("a");
    a.href = url;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.click();
    setStatus("새 탭에서 열기를 시도합니다.");
  };

  const handleStartCall = async () => {
    if (isCalling) return;
    try {
      setStatus("연결 준비중...");
      const response = await fetch("/api/create-call", { method: "POST" });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || "서버 호출 실패");

      setStatus("AI 연결중...");
      await clientRef.current?.startCall({ accessToken: data.accessToken });
    } catch (error: any) {
      setStatus(`오류: ${error?.message}`);
      setIsCalling(false);
    }
  };

  const handleStopCall = () => {
    clientRef.current?.stopCall();
    setIsCalling(false);
  };

  return (
    <main style={{ minHeight: "100vh", backgroundColor: "#f4f6f8", display: "flex", justifyContent: "center", alignItems: "center", padding: "24px" }}>
      <div style={{ width: "100%", maxWidth: "480px", backgroundColor: "#fff", borderRadius: "16px", padding: "32px", textAlign: "center", boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }}>
        <h2 style={{ marginBottom: "10px" }}>AI Voice Consultant</h2>
        <p style={{ color: "#666", marginBottom: "30px" }}>상태: <strong>{status}</strong></p>

        {isEmbedded ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <button onClick={openInNewTab} style={{ padding: "16px", backgroundColor: "#2563eb", color: "#fff", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}>
              🚀 새 창에서 상담 시작하기
            </button>
            <p style={{ fontSize: "12px", color: "#999" }}>
              현재 Gather 내부(임베디드) 모드입니다.<br/>보안 정책상 마이크 사용을 위해 새 창이 필요합니다.
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", gap: "10px" }}>
            <button onClick={requestMicPermission} disabled={isCalling} style={{ flex: 1, padding: "16px", backgroundColor: isCalling ? "#ccc" : "#000", color: "#fff", border: "none", borderRadius: "8px", fontWeight: "bold" }}>
              {isCalling ? "통화 중" : "대화 시작"}
            </button>
            {isCalling && (
              <button onClick={handleStopCall} style={{ padding: "16px", backgroundColor: "#dc2626", color: "#fff", border: "none", borderRadius: "8px", fontWeight: "bold" }}>
                종료
              </button>
            )}
          </div>
        )}
      </div>
    </main>
  );
}