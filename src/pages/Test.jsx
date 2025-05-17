import { useEffect, useState } from "react";
import { io } from "socket.io-client";

export default function TestDashboard() {
  const [healthData, setHealthData] = useState({
    heartRate: "--",
    SpO2: "--",
    weight: "--",
    timestamp: null,
    type: null,
  });

  useEffect(() => {
    const socket = io(import.meta.env.VITE_BACKEND_URL, {
      withCredentials: true,
    });

    socket.on("connect", () => {
      console.log("Connected to socket:", socket.id);
    });

    socket.on("healthData", (payload) => {
      if (payload.type === "health") {
        setHealthData({
          heartRate: payload.data.heartRate,
          SpO2: payload.data.SpO2,
          weight: "--", // Reset weight if new health data is received
          timestamp: payload.data.timestamp,
          type: "health",
        });
      } else if (payload.type === "weight") {
        setHealthData({
          heartRate: "--", // Reset heart rate if new weight data is received
          SpO2: "--", // Reset SpO2 if new weight data is received
          weight: payload.data.weight,
          timestamp: payload.data.timestamp,
          type: "weight",
        });
      }
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <div>
      <h2>Live Health Updates</h2>
      {healthData.type === "health" && (
        <>
          <p>Heart Rate: {healthData.heartRate} bpm</p>
          <p>SpO₂: {healthData.SpO2}%</p>
        </>
      )}
      {healthData.type === "weight" && (
        <p>Weight: {healthData.weight} kg</p>
      )}
      <p>Updated at: {healthData.timestamp ? new Date(healthData.timestamp).toLocaleTimeString() : "--"}</p>
    </div>
  );
}
