"use client";

import { useEffect, useRef, useState } from "react";
import { RetellWebClient } from "retell-client-js-sdk";

export default function HomePage() {
  const clientRef = useRef<RetellWebClient | null>(null);
  const hasAutoStartedRef = useRef(false);

  const [status, setStatus] = useState("Page loaded.");
  const [isCalling, setIsCalling] = useState(false);
  const [isEmbedded, setIsEmbedded] = useState(false);

  useEffect(() => {
    const embedded = window.self !== window.top;
    setIsEmbedded(embedded);

    const client = new RetellWebClient();
    clientRef.current = client;

    client.on("call_started", () => {
      setStatus("Conversation started.");
      setIsCalling(true);
    });

    client.on("call_ended", () => {
      setStatus("Conversation ended.");
      setIsCalling(false);
    });

    client.on("error", (err: any) => {
      console.error("Retell client error:", err);
      setStatus(err?.message || "Microphone access or connection issue.");
      setIsCalling(false);
    });

    if (!embedded && !hasAutoStartedRef.current) {
      hasAutoStartedRef.current = true;
    }

    return () => {
      try {
        client.stopCall();
      } catch (e) {
        console.error(e);
      }
    };
  }, []);

  const requestMicPermission = async () => {
    try {
      setStatus("Requesting microphone access...");
      await navigator.mediaDevices.getUserMedia({ audio: true });
      await handleStartCall();
    } catch (err) {
      console.error(err);
      setStatus("Microphone permission is required.");
    }
  };

  const openInNewTab = () => {
    const url = window.location.href;
    const a = document.createElement("a");
    a.href = url;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.click();
    setStatus("Opening in a new tab...");
  };

  const handleStartCall = async () => {
    if (isCalling) return;

    try {
      setStatus("Preparing connection...");
      const response = await fetch("/api/create-call", { method: "POST" });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Server request failed.");
      }

      setStatus("Connecting to AI...");
      await clientRef.current?.startCall({ accessToken: data.accessToken });
    } catch (error: any) {
      console.error(error);
      setStatus(error?.message || "Failed to start conversation.");
      setIsCalling(false);
    }
  };

  const handleStopCall = () => {
    try {
      clientRef.current?.stopCall();
    } catch (e) {
      console.error(e);
    }
    setIsCalling(false);
    setStatus("Conversation finished.");
  };

  return (
    <main style={{
      minHeight: "100vh",
      backgroundColor: "#f4f6f8",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      padding: "24px"
    }}>
      <div style={{
        width: "100%",
        maxWidth: "560px",
        backgroundColor: "#fff",
        borderRadius: "16px",
        padding: "32px",
        textAlign: "center",
        boxShadow: "0 4px 20px rgba(0,0,0,0.1)"
      }}>
        <h2 style={{ marginBottom: "10px" }}>
          Engineering Scenario Voice Simulation
        </h2>

        <p style={{ color: "#444", marginBottom: "10px" }}>
          UK Automotive Manufacturing Scenario
        </p>

        <p style={{
          color: "#666",
          marginBottom: "24px",
          fontSize: "14px",
          lineHeight: 1.7
        }}>
          You will speak with Sam, a senior engineer, about a hydraulic system pressure issue.
          <br />
          Please respond clearly and explain your reasoning as you would in a real workplace.
        </p>

        <p style={{ color: "#666", marginBottom: "28px" }}>
          Status: <strong>{status}</strong>
        </p>

        {isEmbedded ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <button
              onClick={openInNewTab}
              style={{
                padding: "16px",
                backgroundColor: "#2563eb",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                fontWeight: "bold",
                cursor: "pointer"
              }}
            >
              🚀 Open in a new tab to start
            </button>

            <p style={{ fontSize: "12px", color: "#999" }}>
              You are currently inside an embedded environment (e.g. Gather).
              <br />
              Microphone access requires opening in a new browser tab.
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", gap: "10px" }}>
            <button
              onClick={requestMicPermission}
              disabled={isCalling}
              style={{
                flex: 1,
                padding: "16px",
                backgroundColor: isCalling ? "#ccc" : "#111827",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                fontWeight: "bold"
              }}
            >
              {isCalling ? "In conversation" : "Start conversation"}
            </button>

            {isCalling && (
              <button
                onClick={handleStopCall}
                style={{
                  padding: "16px",
                  backgroundColor: "#dc2626",
                  color: "#fff",
                  border: "none",
                  borderRadius: "8px",
                  fontWeight: "bold"
                }}
              >
                End
              </button>
            )}
          </div>
        )}
      </div>
    </main>
  );
}