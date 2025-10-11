import React, { useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Card, CardContent, CardHeader } from "../ui/card";

interface SetupScreenProps {
  onStart: (name: string, role: string, apiKey: string) => void;
}

const SetupScreen: React.FC<SetupScreenProps> = ({ onStart }) => {
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && role.trim() && apiKey.trim()) {
      setIsSubmitting(true);
      onStart(name.trim(), role.trim(), apiKey.trim());
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4">
      <div className="w-full max-w-md">
        <Card className="bg-gray-800 border-gray-700 shadow-2xl">
          <CardHeader className="text-center pb-6">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-xl">
              <div className="text-3xl font-bold text-white">AI</div>
            </div>
            <h1 className="text-3xl font-bold text-cyan-400 mb-2">
              Welcome to PrepMate
            </h1>
            <p className="text-gray-400">
              Let's get your personalized AI interview ready.
            </p>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-300 mb-2"
                >
                  What is your name?
                </label>
                <Input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setName(e.target.value)
                  }
                  required
                  className="w-full bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-cyan-500 focus:ring-cyan-500"
                  placeholder="e.g., Priya Sharma"
                />
              </div>

              <div>
                <label
                  htmlFor="role"
                  className="block text-sm font-medium text-gray-300 mb-2"
                >
                  What role are you interviewing for?
                </label>
                <Input
                  type="text"
                  id="role"
                  value={role}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setRole(e.target.value)
                  }
                  required
                  className="w-full bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-cyan-500 focus:ring-cyan-500"
                  placeholder="e.g., Senior Frontend Engineer"
                />
              </div>

              <div>
                <label
                  htmlFor="apiKey"
                  className="block text-sm font-medium text-gray-300 mb-2"
                >
                  Google Gemini API Key
                </label>
                <Input
                  type="password"
                  id="apiKey"
                  value={apiKey}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setApiKey(e.target.value)
                  }
                  required
                  className="w-full bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-cyan-500 focus:ring-cyan-500"
                  placeholder="Enter your API key"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Get your API key from{" "}
                  <a
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-cyan-400 hover:underline"
                  >
                    Google AI Studio
                  </a>
                </p>
              </div>

              <Button
                type="submit"
                disabled={!name || !role || !apiKey || isSubmitting}
                className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 disabled:bg-gray-600 disabled:cursor-not-allowed transform hover:scale-105"
              >
                {isSubmitting ? "Initializing..." : "Start Interview"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SetupScreen;
