const fetch = require("node-fetch");

const BASE_URL = "http://localhost:5000";

async function testHealthEndpoints() {
  console.log("🧪 Testing PrepMate Health Check Endpoints...\n");

  const endpoints = [
    { name: "Basic Health Check", url: "/health" },
    { name: "Detailed Health Check", url: "/health/detailed" },
    { name: "Database Health Check", url: "/health/database" },
    { name: "System Health Check", url: "/health/system" },
    { name: "API Health Check", url: "/health/api" },
    { name: "Readiness Probe", url: "/health/ready" },
    { name: "Liveness Probe", url: "/health/live" },
  ];

  for (const endpoint of endpoints) {
    try {
      console.log(`📡 Testing: ${endpoint.name}`);
      const response = await fetch(`${BASE_URL}${endpoint.url}`);
      const data = await response.json();

      if (response.ok) {
        console.log(`✅ ${endpoint.name}: SUCCESS`);
        console.log(`   Status: ${data.success ? "Success" : "Failed"}`);
        if (data.data && data.data.status) {
          console.log(`   Health: ${data.data.status}`);
        }
      } else {
        console.log(`❌ ${endpoint.name}: FAILED`);
        console.log(`   Status: ${response.status}`);
        console.log(`   Message: ${data.message || "Unknown error"}`);
      }
    } catch (error) {
      console.log(`❌ ${endpoint.name}: ERROR`);
      console.log(`   Error: ${error.message}`);
    }
    console.log("");
  }

  console.log("🎯 Health Check Test Complete!");
  console.log(
    "📊 You can view the dashboard at: http://localhost:5000/health-dashboard"
  );
}

// Run the test
testHealthEndpoints().catch(console.error);
