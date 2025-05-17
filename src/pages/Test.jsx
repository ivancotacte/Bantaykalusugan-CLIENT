
import { useEffect, useState } from "react";
import { io } from "socket.io-client";

export default function TestDashboard() {
  const [healthData, setHealthData] = useState({
    heartRate: null,
    SpO2: null,
    weight: null,
    timestamp: null,
  });

  const handleSubmit = async (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    const data = Object.fromEntries(formData.entries());

    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/v1/test`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      console.log("Server response:", result);
    } catch (error) {
      console.error("Error submitting data:", error);
    }
  }

  useEffect(() => {
    const socket = io(import.meta.env.VITE_BACKEND_URL, {
      withCredentials: true,
    });

    socket.on("connect", () => {
      console.log("Connected to socket:", socket.id);
    });

    socket.on("healthData", (payload) => {
      console.log("Received health data:", payload);
      setHealthData((prevData) => ({
        ...prevData,
        ...payload,
      }));
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <div>
      <h1>Test Dashboard</h1>
      <form onSubmit={handleSubmit}>
        <h2>Received Data:</h2>
        <p>Heart Rate: {healthData.heartRate}</p>
        <p>SpO2: {healthData.SpO2}</p>
        <p>Weight: {healthData.weight}</p>
        <p>Timestamp: {healthData.timestamp}</p>
        <button type="submit">Submit</button>
      </form>
    </div>
  );
}