import React, { useState, useEffect } from "react";
import { apiClient } from "../lib/apiClient";

const TestBackend: React.FC = () => {
  const [healthStatus, setHealthStatus] = useState<string>("Loading...");
  const [authTest, setAuthTest] = useState<string>("Not tested");

  useEffect(() => {
    // Test health endpoint
    apiClient.fetch(apiClient.getApiOriginUrl("/health"))
      .then((response) => response.json())
      .then((data) => {
        setHealthStatus(JSON.stringify(data, null, 2));
      })
      .catch((error) => {
        setHealthStatus(
          `Error: ${error instanceof Error ? error.message : String(error)}`
        );
      });
  }, []);

  const testAuth = async () => {
    setAuthTest("Testing...");
    try {
      const response = await apiClient.fetch("/auth/me", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token") || "invalid"}`,
          "Content-Type": "application/json",
        },
      });
      const data = await response.json();
      setAuthTest(JSON.stringify(data, null, 2));
    } catch (error) {
      setAuthTest(
        `Error: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  };

  return (
    <div className="p-8 space-y-4">
      <h1 className="text-2xl font-bold">Backend Debug</h1>

      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Health Check:</h2>
          <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
            {healthStatus}
          </pre>
        </div>

        <div>
          <h2 className="text-lg font-semibold">Auth Test:</h2>
          <button
            onClick={testAuth}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Test /api/auth/me
          </button>
          <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto mt-2">
            {authTest}
          </pre>
        </div>
      </div>
    </div>
  );
};

export default TestBackend;
