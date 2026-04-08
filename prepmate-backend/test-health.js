const fetch = require("node-fetch");

const BASE_URL = process.env.BASE_URL || "http://localhost:5000";

const endpointDefinitions = [
  { name: "Basic Health Check", path: "" },
  { name: "Detailed Health Check", path: "/detailed" },
  { name: "Database Health Check", path: "/database" },
  { name: "System Health Check", path: "/system" },
  { name: "API Health Check", path: "/api" },
  { name: "Readiness Probe", path: "/ready" },
  { name: "Liveness Probe", path: "/live" },
];

const healthPrefixes = ["/health", "/api/health"];

async function requestHealth(path) {
  for (const prefix of healthPrefixes) {
    const response = await fetch(`${BASE_URL}${prefix}${path}`);

    // If route exists under this prefix, use it.
    if (response.status !== 404) {
      return {
        response,
        endpoint: `${prefix}${path}`,
      };
    }
  }

  // Return final 404 response to preserve diagnostics.
  const fallbackPrefix = healthPrefixes[healthPrefixes.length - 1];
  const response = await fetch(`${BASE_URL}${fallbackPrefix}${path}`);

  return {
    response,
    endpoint: `${fallbackPrefix}${path}`,
  };
}

async function ensureServerReachable() {
  try {
    await requestHealth("/live");
    return true;
  } catch (error) {
    console.error("❌ Backend is not reachable for health testing.");
    console.error(
      `   Target base URL: ${BASE_URL} (${error.code || error.type || "unknown"})`
    );
    console.error("   Start the backend server, then rerun: npm run test-health");
    return false;
  }
}

async function testHealthEndpoints() {
  console.log("🧪 Testing PrepMate Health Check Endpoints...\n");

  const canReachServer = await ensureServerReachable();
  if (!canReachServer) {
    process.exitCode = 1;
    return;
  }

  let failedCount = 0;
  let errorCount = 0;

  for (const endpointDef of endpointDefinitions) {
    try {
      console.log(`📡 Testing: ${endpointDef.name}`);
      const { response, endpoint } = await requestHealth(endpointDef.path);
      const data = await response.json();

      if (response.ok) {
        console.log(`✅ ${endpointDef.name}: SUCCESS`);
        console.log(`   Endpoint: ${endpoint}`);
        console.log(`   Status: ${data.success ? "Success" : "Failed"}`);
        if (data.data && data.data.status) {
          console.log(`   Health: ${data.data.status}`);
        }
      } else {
        failedCount += 1;
        console.log(`❌ ${endpointDef.name}: FAILED`);
        console.log(`   Endpoint: ${endpoint}`);
        console.log(`   Status: ${response.status}`);
        console.log(`   Message: ${data.message || "Unknown error"}`);
      }
    } catch (error) {
      errorCount += 1;
      console.log(`❌ ${endpointDef.name}: ERROR`);
      console.log(`   Error: ${error.message}`);
      if (error.code) {
        console.log(`   Code: ${error.code}`);
      }
    }
    console.log("");
  }

  console.log("🎯 Health Check Test Complete!");
  console.log(
    "📊 You can view the dashboard at: http://localhost:5000/health-dashboard"
  );

  if (failedCount > 0 || errorCount > 0) {
    process.exitCode = 1;
  }
}

// Run the test
testHealthEndpoints().catch(console.error);
