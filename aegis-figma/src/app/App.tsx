import React, { useState, useCallback } from "react";
import { BathroomLayout, type Pose } from "./components/BathroomLayout";
import { SignalGraph } from "./components/SignalGraph";

export default function App() {
  const [pose, setPose] = useState<Pose>("stand");
  const [personPos, setPersonPos] = useState({ x: 0.5, y: 0.5 });
  const [triggerCount, setTriggerCount] = useState(0);
  const [personVisible, setPersonVisible] = useState(true);
  const [wifiDisconnected, setWifiDisconnected] = useState(false);
  const [lowConfidence, setLowConfidence] = useState(false);
  const [showFallNotification, setShowFallNotification] = useState(false);

  const handleClickMove = useCallback((pos: { x: number; y: number }) => {
    setPersonPos(pos);
  }, []);

  const handlePose = useCallback((newPose: Pose) => {
    setPose(newPose);
    setTriggerCount((c) => c + 1);
    
    // Show notification when fall is triggered (with 1 second delay)
    if (newPose === "fall") {
      setTimeout(() => {
        setShowFallNotification(true);
        // Auto-hide after 5 seconds
        setTimeout(() => setShowFallNotification(false), 5000);
      }, 1000);
    }
  }, []);

  return (
    <div className="w-screen h-screen bg-[#1a1a2e] flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-2.5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-[#7c9a8e] animate-pulse" />
          <h1 className="text-white/90" style={{ fontSize: "18px", fontWeight: 700 }}>
            WiFi Sensing — Fall Detection Demo
          </h1>
        </div>
        <span className="text-white/30" style={{ fontSize: "11px" }}>
          Click bathroom to move person
        </span>
      </div>

      {/* Main content — side by side */}
      <div className="flex-1 flex min-h-0 p-4 gap-4">
        {/* Bathroom layout — left, ~55% */}
        <div className="w-[55%] flex flex-col min-h-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-white/40" style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.05em" }}>
              BATHROOM FLOOR PLAN (4m × 2.9m)
            </span>
            <span className="text-white/20" style={{ fontSize: "10px" }}>
              — WiFi CSI-based monitoring
            </span>
          </div>
          <div className="aspect-[4/2.9] w-full rounded-lg overflow-hidden border border-white/10">
            <BathroomLayout
              pose={pose}
              personPos={personPos}
              onClickMove={handleClickMove}
              personVisible={personVisible}
              wifiDisconnected={wifiDisconnected}
            />
          </div>
          {/* Legend */}
          <div className="flex items-center gap-5 mt-1.5">
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-3.5 rounded bg-[#5a7e8c] flex items-center justify-center">
                <span className="text-white" style={{ fontSize: "8px", fontWeight: 700 }}>TX</span>
              </div>
              <span className="text-white/40" style={{ fontSize: "10px" }}>Transmitter (1.0m)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-3.5 rounded bg-[#8c7a5a] flex items-center justify-center">
                <span className="text-white" style={{ fontSize: "8px", fontWeight: 700 }}>RX</span>
              </div>
              <span className="text-white/40" style={{ fontSize: "10px" }}>Receiver (0.5m)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-3.5 rounded bg-[#6a8c75] flex items-center justify-center">
                <span className="text-white" style={{ fontSize: "8px", fontWeight: 700 }}>RT</span>
              </div>
              <span className="text-white/40" style={{ fontSize: "10px" }}>Router (2.0m)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-[#7c9a8e]" />
              <span className="text-white/40" style={{ fontSize: "10px" }}>Standing</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-[#b8976a]" />
              <span className="text-white/40" style={{ fontSize: "10px" }}>Sitting</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-[#b56b5f]" />
              <span className="text-white/40" style={{ fontSize: "10px" }}>Fallen</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-4 border-t border-dashed border-[#5a7e8c]" />
              <span className="text-white/40" style={{ fontSize: "10px", fontWeight: 600 }}>Signal path</span>
            </div>
          </div>
          {/* Disclaimer */}
          <div className="mt-1.5">
            <p className="text-white/30 italic" style={{ fontSize: "9px" }}>
              Simplified direct signal path shown, WiFi signal propagates in all directions
            </p>
          </div>
        </div>

        {/* Right panel — graph + event buttons */}
        <div className="w-[45%] min-h-0 flex flex-col">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-white/40" style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.05em" }}>
              SIGNAL ANALYSIS
            </span>
          </div>
          {/* Height = 2/3 of bathroom height. Bathroom is 55vw * (2.9/4), minus padding */}
          <div style={{ height: "calc((55vw - 2rem) * 2.9 / 4 * 2 / 3)" }}>
            <SignalGraph
              pose={pose}
              personPos={personPos}
              triggerCount={triggerCount}
              personVisible={personVisible}
              wifiDisconnected={wifiDisconnected}
              lowConfidence={lowConfidence}
            />
          </div>

          {/* Controls below graph — two columns + system message */}
          <div className="flex gap-4 mt-3 items-start flex-nowrap">
            {/* Left column: Simulate Events */}
            <div className="flex flex-col gap-1.5 flex-shrink-0">
              <span className="text-white/40 mb-0.5" style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.05em" }}>
                EVENTS
              </span>
              <button
                onClick={() => handlePose("fall")}
                className="px-4 py-1.5 rounded-md cursor-pointer border bg-[#b56b5f] text-white border-[#944f44] hover:bg-[#c47a6e] active:bg-[#a35a4e] transition-colors text-left h-8"
                style={{ fontSize: "12px", fontWeight: 600 }}
              >
                Simulate Fall
              </button>
              <button
                onClick={() => handlePose("stand")}
                className="px-4 py-1.5 rounded-md cursor-pointer border bg-[#7c9a8e] text-white border-[#5f7d71] hover:bg-[#8dab9f] active:bg-[#6b8a7d] transition-colors text-left h-8"
                style={{ fontSize: "12px", fontWeight: 600 }}
              >
                Stand
              </button>
              <button
                onClick={() => handlePose("sit")}
                className="px-4 py-1.5 rounded-md cursor-pointer border bg-[#b8976a] text-white border-[#9a7c54] hover:bg-[#c9a87b] active:bg-[#a78659] transition-colors text-left h-8"
                style={{ fontSize: "12px", fontWeight: 600 }}
              >
                Sit
              </button>
            </div>

            {/* Right column: Toggles */}
            <div className="flex flex-col gap-1.5 flex-shrink-0">
              <span className="text-white/40 mb-0.5" style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.05em" }}>
                TOGGLES
              </span>
              <button
                onClick={() => setPersonVisible((v) => !v)}
                className={`px-4 py-1.5 rounded-md cursor-pointer border-2 transition-colors text-left bg-[#2a2a3e] text-white/80 hover:bg-[#333348] h-8 ${
                  personVisible
                    ? "border-[#7c9a8e]"
                    : "border-transparent"
                }`}
                style={{ fontSize: "12px", fontWeight: 600 }}
              >
                {personVisible ? "Person: Present" : "Person: Absent"}
              </button>
              <button
                onClick={() => setWifiDisconnected((v) => !v)}
                className={`px-4 py-1.5 rounded-md cursor-pointer border-2 transition-colors text-left bg-[#2a2a3e] text-white/80 hover:bg-[#333348] h-8 ${
                  wifiDisconnected
                    ? "border-[#b56b5f]"
                    : "border-transparent"
                }`}
                style={{ fontSize: "12px", fontWeight: 600 }}
              >
                {wifiDisconnected ? "WiFi: Disconnected" : "WiFi: Connected"}
              </button>
              <button
                onClick={() => setLowConfidence((v) => !v)}
                className={`px-4 py-1.5 rounded-md cursor-pointer border-2 transition-colors text-left bg-[#2a2a3e] text-white/80 hover:bg-[#333348] h-8 ${
                  lowConfidence
                    ? "border-[#b8976a]"
                    : "border-transparent"
                }`}
                style={{ fontSize: "12px", fontWeight: 600 }}
              >
                {lowConfidence ? "AI Confidence: Low" : "AI Confidence: High"}
              </button>
            </div>

            {/* System message — appears to the right when wifi is disconnected */}
            {wifiDisconnected && (
              <div className="flex flex-col gap-1.5 ml-2 max-w-[220px] animate-[fadeSlideIn_0.25s_ease-out]">
                <span className="text-white/40 mb-0.5" style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.05em" }}>
                  SYSTEM
                </span>
                <div className="rounded-lg border border-[#b56b5f]/30 bg-[#b56b5f]/10 px-3 py-2.5">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#b56b5f] animate-pulse" />
                    <span className="text-[#d4918a]" style={{ fontSize: "11px", fontWeight: 700 }}>
                      WiFi Link Lost
                    </span>
                  </div>
                  <p className="text-white/50" style={{ fontSize: "10px", lineHeight: "1.45" }}>
                    CSI stream interrupted. Fall detection unavailable while WiFi is disconnected. System will resume monitoring automatically upon reconnection.
                  </p>
                  <div className="flex items-center gap-1.5 mt-2 pt-1.5 border-t border-white/5">
                    <span className="text-[#b56b5f]/70" style={{ fontSize: "9px", fontWeight: 600 }}>
                      ERR_WIFI_DISCONNECT
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Fall notification */}
      {showFallNotification && (
        <div className="fixed bottom-6 right-6 w-80 bg-[#2a2a3e] border-2 border-[#b56b5f] rounded-lg shadow-2xl animate-[slideInRight_0.3s_ease-out]">
          <div className="bg-[#b56b5f] px-4 py-2.5 rounded-t-md flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
            <span className="text-white" style={{ fontSize: "14px", fontWeight: 700 }}>
              Dialing emergency contact
            </span>
          </div>
          <div className="px-4 py-3">
            <p className="text-white" style={{ fontSize: "13px", lineHeight: "1.5" }}>
              Urgent: Fall detected in the bathroom
            </p>
          </div>
        </div>
      )}
    </div>
  );
}