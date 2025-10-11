import React from "react";
import { useAuth } from "../contexts/AuthContext";

const TestAuth: React.FC = () => {
  const { user, isAuthenticated, isLoading, error, token } = useAuth();

  return (
    <div className="p-8 space-y-4">
      <h1 className="text-2xl font-bold">Authentication Debug</h1>

      <div className="space-y-2">
        <p>
          <strong>Loading:</strong> {isLoading ? "Yes" : "No"}
        </p>
        <p>
          <strong>Authenticated:</strong> {isAuthenticated ? "Yes" : "No"}
        </p>
        <p>
          <strong>Token:</strong> {token ? "Present" : "None"}
        </p>
        <p>
          <strong>User:</strong> {user ? user.name : "None"}
        </p>
        <p>
          <strong>Error:</strong> {error || "None"}
        </p>
      </div>

      <div className="space-y-2">
        <h2 className="text-lg font-semibold">User Details:</h2>
        {user ? (
          <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
            {JSON.stringify(user, null, 2)}
          </pre>
        ) : (
          <p>No user data</p>
        )}
      </div>

      <div className="space-y-2">
        <h2 className="text-lg font-semibold">Local Storage:</h2>
        <p>
          <strong>Token in localStorage:</strong>{" "}
          {localStorage.getItem("token") ? "Present" : "None"}
        </p>
      </div>
    </div>
  );
};

export default TestAuth;
