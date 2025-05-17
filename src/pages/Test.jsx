
import { useEffect, useState } from "react";
import { io } from "socket.io-client";

export default function TestDashboard() {
  const [healthData, setHealthData] = useState({
    heartRate: "--",
    SpO2: "--",
    weight: "--",
    timestamp: null,
  });

  useEffect(() => {
    const socket = io(import.meta.env.VITE_BACKEND_URL, {
      withCredentials: true,
    });

    socket.on("connect", () => {
      console.log("Connected to socket:", socket.id);
    });

    socket.on("healthData", (payload) => {
      setHealthData(payload);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <div>
      <h2>Live Health Updates</h2>
      <p>Heart Rate: {healthData.heartRate} bpm</p>
      <p>SpO₂: {healthData.SpO2}%</p>
      <p>Weight: {healthData.weight} kg</p>
      <p>Updated at: {new Date(healthData.timestamp).toLocaleTimeString()}</p>
    </div>
  );
}