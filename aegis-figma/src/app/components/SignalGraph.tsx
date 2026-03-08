import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import type { Pose } from "./BathroomLayout";

interface SignalGraphProps {
  pose: Pose;
  personPos: { x: number; y: number };
  triggerCount: number;
  personVisible: boolean;
  wifiDisconnected: boolean;
  lowConfidence: boolean;
}

interface DataPoint {
  time: number;
  amplitude: number;
}

const MAX_POINTS = 150;

// Room bounding box in normalized coords (matching the bathroom floor plan image area)
const ROOM = { xMin: 0.12, xMax: 0.88, yMin: 0.08, yMax: 0.92 };

function isInsideRoom(pos: { x: number; y: number }): boolean {
  return pos.x >= ROOM.xMin && pos.x <= ROOM.xMax && pos.y >= ROOM.yMin && pos.y <= ROOM.yMax;
}

// Distance from person to the direct TX-RX line
// TX at (0.13, 0.705), RX at (0.77, 0.32) — diagonal
function distToSignalPath(pos: { x: number; y: number }): number {
  const ax = 0.13, ay = 0.705, bx = 0.77, by = 0.32;
  const dx = bx - ax, dy = by - ay;
  const len2 = dx * dx + dy * dy;
  const t = Math.max(0, Math.min(1, ((pos.x - ax) * dx + (pos.y - ay) * dy) / len2));
  const projX = ax + t * dx, projY = ay + t * dy;
  return Math.sqrt((pos.x - projX) ** 2 + (pos.y - projY) ** 2);
}

export function SignalGraph({ pose, personPos, triggerCount, personVisible, wifiDisconnected, lowConfidence }: SignalGraphProps) {
  const [data, setData] = useState<DataPoint[]>([]);
  const tickRef = useRef(0);
  const poseRef = useRef<Pose>(pose);
  const posRef = useRef(personPos);
  const prevPosRef = useRef(personPos);
  const poseChangeTickRef = useRef<number>(0);
  const prevPoseRef = useRef<Pose>(pose);
  const triggerCountRef = useRef(triggerCount);
  const personVisibleRef = useRef(personVisible);
  const wifiDisconnectedRef = useRef(wifiDisconnected);
  const lowConfidenceRef = useRef(lowConfidence);

  useEffect(() => {
    prevPosRef.current = posRef.current;
    posRef.current = personPos;
  }, [personPos]);

  useEffect(() => {
    const prev = poseRef.current;
    poseRef.current = pose;
    // Re-trigger on any pose change OR repeated click (triggerCount changed)
    if (pose !== prev || triggerCount !== triggerCountRef.current) {
      prevPoseRef.current = prev;
      poseChangeTickRef.current = tickRef.current;
      triggerCountRef.current = triggerCount;
    }
  }, [pose, triggerCount]);

  useEffect(() => {
    personVisibleRef.current = personVisible;
  }, [personVisible]);

  useEffect(() => {
    wifiDisconnectedRef.current = wifiDisconnected;
  }, [wifiDisconnected]);

  useEffect(() => {
    lowConfidenceRef.current = lowConfidence;
  }, [lowConfidence]);

  const generatePoint = useCallback((): DataPoint => {
    tickRef.current += 1;
    const t = tickRef.current;
    const currentPose = poseRef.current;
    const pos = posRef.current;
    const prev = prevPosRef.current;
    const isPersonVisible = personVisibleRef.current;
    const isWifiDisconnected = wifiDisconnectedRef.current;
    const isLowConfidence = lowConfidenceRef.current;

    // WiFi disconnected — no signal at all, flat zero with tiny electronic noise
    if (isWifiDisconnected) {
      return {
        time: t,
        amplitude: 0.005 * Math.sin(t * 0.13) + 0.003 * Math.cos(t * 0.29),
      };
    }

    const inRoom = isInsideRoom(pos);
    const dist = distToSignalPath(pos);
    const proximity = Math.max(0, 1 - dist / 0.45);

    const moveDx = pos.x - prev.x;
    const moveDy = pos.y - prev.y;
    const moveMag = Math.sqrt(moveDx * moveDx + moveDy * moveDy);
    const moveVariance = Math.min(moveMag * 8, 0.15);

    const sincePoseChange = t - poseChangeTickRef.current;

    let amplitude: number;

    if (!inRoom || !isPersonVisible) {
      // Person outside room or not visible: static environment — near-flat low value
      const staticBase = 0.02;
      const tinyNoise =
        0.015 * Math.sin(t * 0.07) +
        0.01 * Math.sin(t * 0.19) +
        0.006 * Math.cos(t * 0.31);
      amplitude = staticBase + tinyNoise;
    } else if (currentPose === "stand") {
      // STAND: gentle rhythmic oscillations between ~-0.2 and ~0.5
      // Slower, smoother sine waves for a calm breathing/idle rhythm
      const base = 0.15;
      const wave1 = 0.18 * Math.sin(t * 0.28 + 0.3);
      const wave2 = 0.09 * Math.sin(t * 0.47 + 1.7);
      const wave3 = 0.05 * Math.sin(t * 0.71 + 0.9);
      const noise = 0.02 * Math.sin(t * 1.1) + 0.015 * Math.cos(t * 1.5);
      const proxEffect = 0.08 * proximity;
      amplitude = base + wave1 + wave2 + wave3 + noise + proxEffect + moveVariance * Math.sin(t * 0.37);

      // If transitioning from another pose, blend in over ~15 samples
      if (sincePoseChange < 15) {
        const blend = sincePoseChange / 15;
        amplitude = amplitude * blend + 0.0 * (1 - blend);
      }
    } else if (currentPose === "sit") {
      // SIT: quick drop from current level, then stabilize at a low baseline
      const dropDuration = 12;
      const settleDuration = 8;

      if (sincePoseChange < dropDuration) {
        // Quick drop phase — body lowering causes rapid signal decrease
        const progress = sincePoseChange / dropDuration;
        // Fast ease-out curve dropping from ~0.3 to low target
        const eased = 1 - (1 - progress) * (1 - progress); // ease-out quadratic
        const startLevel = 0.3 + 0.1 * proximity;
        const target = -0.15;
        amplitude = startLevel + (target - startLevel) * eased;
        // Add slight turbulence during the drop
        amplitude += 0.04 * Math.sin(t * 0.8) * (1 - progress);
      } else if (sincePoseChange < dropDuration + settleDuration) {
        // Settling phase — small oscillations dampening to flat
        const settleProgress = (sincePoseChange - dropDuration) / settleDuration;
        const dampening = 1 - settleProgress;
        amplitude = -0.15 + 0.08 * Math.sin(t * 0.6) * dampening;
        amplitude += 0.02 * Math.cos(t * 0.9) * dampening;
      } else {
        // Stable/flat phase — person at rest in chair
        const flatBase = 0.05;
        const tinyNoise =
          0.02 * Math.sin(t * 0.09) +
          0.015 * Math.sin(t * 0.21) +
          0.008 * Math.cos(t * 0.37);
        amplitude = flatBase + tinyNoise;
      }
    } else {
      // FALL: stability near 0, sharp volatile spike, plummet to -3.0, then sustained low
      const spikeStart = 8;
      const spikeDuration = 10;
      const spikeEnd = spikeStart + spikeDuration;
      const dropDuration = 6;
      const sustainedEnd = 55;
      const recoveryDuration = 8;

      if (sincePoseChange < spikeStart) {
        // Initial stability near 0
        amplitude = 0.05 + 0.03 * Math.sin(t * 0.15) + 0.02 * Math.cos(t * 0.27);
      } else if (sincePoseChange < spikeEnd) {
        // Sharp volatile spike — uncontrolled acceleration of body
        const spikeProgress = (sincePoseChange - spikeStart) / spikeDuration;
        const volatile1 = 1.2 * Math.sin(spikeProgress * Math.PI * 3.5);
        const volatile2 = 0.6 * Math.cos(spikeProgress * Math.PI * 5.2 + 1.3);
        const volatile3 = 0.4 * Math.sin(spikeProgress * Math.PI * 7.1);
        amplitude = volatile1 + volatile2 + volatile3;
        // Envelope: peaks in middle
        const envelope = Math.sin(spikeProgress * Math.PI);
        amplitude *= envelope * (1.0 + 0.3 * proximity);
      } else if (sincePoseChange < spikeEnd + dropDuration) {
        // Rapid plummet to sustained low
        const dropProgress = (sincePoseChange - spikeEnd) / dropDuration;
        const eased = dropProgress * dropProgress;
        const target = -2.8 - 0.3 * proximity;
        amplitude = 0 + target * eased;
      } else if (sincePoseChange < sustainedEnd) {
        // Sustained low — body on floor, drastically altered signal baseline
        const base = -2.8 - 0.3 * proximity;
        const subtleNoise =
          0.04 * Math.sin(t * 0.11) +
          0.03 * Math.sin(t * 0.23) +
          0.02 * Math.cos(t * 0.41);
        amplitude = base + subtleNoise;
      } else if (sincePoseChange < sustainedEnd + recoveryDuration) {
        // Recovery — return toward baseline
        const recProgress = (sincePoseChange - sustainedEnd) / recoveryDuration;
        const base = -2.8 - 0.3 * proximity;
        const eased = recProgress * recProgress * (3 - 2 * recProgress);
        amplitude = base * (1 - eased) + 0.0 * eased;
        amplitude += 0.05 * Math.sin(t * 0.3);
      } else {
        // Post-recovery — stays near baseline with minor activity
        amplitude = 0.03 + 0.025 * Math.sin(t * 0.13) + 0.015 * Math.cos(t * 0.29);
      }
    }

    return {
      time: t,
      amplitude: Math.max(-3.5, Math.min(2.5, amplitude)),
    };
  }, []);

  useEffect(() => {
    const initial: DataPoint[] = [];
    for (let i = 0; i < MAX_POINTS; i++) {
      initial.push(generatePoint());
    }
    setData(initial);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setData((prev) => {
        const next = [...prev, generatePoint()];
        if (next.length > MAX_POINTS) next.shift();
        return next;
      });
    }, 80);
    return () => clearInterval(interval);
  }, [generatePoint]);

  const minTime = data.length > 0 ? data[0].time : 0;
  const maxTime = data.length > 0 ? data[data.length - 1].time : 100;

  const isFall = pose === "fall";
  const inRoom = isInsideRoom(personPos);

  const effectiveNoOccupant = !personVisible || !inRoom;

  const lineColor = wifiDisconnected
    ? "#444"
    : effectiveNoOccupant
    ? "#6b7280"
    : isFall
    ? "#b56b5f"
    : pose === "sit"
    ? "#b8976a"
    : "#5a7e8c";

  const statusColor = wifiDisconnected
    ? "bg-red-500/20 text-red-400"
    : effectiveNoOccupant
    ? "bg-white/10 text-white/40"
    : isFall
    ? "bg-[#b56b5f]/20 text-[#d4918a]"
    : pose === "sit"
    ? "bg-[#b8976a]/20 text-[#d4bc8a]"
    : "bg-[#7c9a8e]/20 text-[#a0c4b6]";

  const statusText = wifiDisconnected
    ? "✕ WiFi Disconnected"
    : effectiveNoOccupant
    ? "— No occupant"
    : isFall
    ? "⚠ Fall Detected"
    : pose === "sit"
    ? "● Sitting"
    : "● Standing";

  return (
    <div className="flex flex-col h-full bg-[#0f0f1f] rounded-lg border border-white/10 px-4 py-3">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-white/80" style={{ fontSize: "14px", fontWeight: 600 }}>
          CSI Amplitude (Real-time)
        </h2>
        <div
          className={`px-2.5 py-0.5 rounded-full ${statusColor}`}
          style={{ fontSize: "11px", fontWeight: 600 }}
        >
          {statusText}
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-hidden">
        <ResponsiveContainer width="100%" height="100%" minHeight={80}>
          <LineChart data={data} margin={{ top: 20, right: 60, bottom: 18, left: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis
              dataKey="time"
              domain={[minTime, maxTime]}
              tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 9 }}
              tickFormatter={() => ""}
              label={{
                value: "Time →",
                position: "insideBottom",
                offset: -8,
                fill: "rgba(255,255,255,0.3)",
                fontSize: 11,
              }}
              stroke="rgba(255,255,255,0.08)"
            />
            <YAxis
              domain={[-3.5, 2.5]}
              ticks={[-3, -2, -1, 0, 1, 2]}
              tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 9 }}
              label={{
                value: "Mean CSI Amplitude",
                angle: -90,
                position: "insideLeft",
                offset: 10,
                fill: "rgba(255,255,255,0.3)",
                fontSize: 11,
              }}
              stroke="rgba(255,255,255,0.08)"
            />
            <ReferenceLine y={0} stroke="rgba(255,255,255,0.12)" strokeWidth={1} />
            <ReferenceLine
              y={-1.5}
              stroke="rgba(181,107,95,0.4)"
              strokeDasharray="6 3"
              label={{
                value: "Fall Threshold",
                fill: "rgba(181,107,95,0.65)",
                fontSize: 9,
                position: "insideBottomRight",
              }}
            />
            {isFall && poseChangeTickRef.current > 0 && (
              <ReferenceLine
                x={poseChangeTickRef.current + 8}
                stroke="#b56b5f"
                strokeDasharray="4 4"
                label={{
                  value: "Fall Event",
                  fill: "#b56b5f",
                  fontSize: 10,
                  position: "insideTop",
                }}
              />
            )}
            <Line
              type="monotone"
              dataKey="amplitude"
              stroke={lineColor}
              strokeWidth={1.5}
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}