const fetch = require("node-fetch");

const BASE_URL = process.env.BASE_URL || "http://localhost:5000";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@prepmate.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";

const pretty = (value) => JSON.stringify(value, null, 2);

const login = async () => {
  const response = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identifier: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok || !payload?.data?.token) {
    throw new Error(
      `Admin login failed (${response.status}). Response: ${pretty(payload)}`
    );
  }

  return payload.data.token;
};

const callAdminApi = async (token, endpoint, options = {}) => {
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    method: options.method || "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const payload = await response.json().catch(() => ({}));

  return {
    status: response.status,
    ok: response.ok,
    payload,
  };
};

const smokeTests = [
  { name: "Admin Profile", endpoint: "/api/admin/me", expected: [200] },
  {
    name: "Permission Catalog",
    endpoint: "/api/admin/permissions/catalog",
    expected: [200],
  },
  { name: "Dashboard", endpoint: "/api/admin/dashboard", expected: [200] },
  { name: "Overview", endpoint: "/api/admin/overview", expected: [200] },
  { name: "Insights", endpoint: "/api/admin/insights", expected: [200] },
  { name: "Users", endpoint: "/api/admin/users?page=1&limit=5", expected: [200] },
  {
    name: "Content Reports",
    endpoint: "/api/admin/social/posts?page=1&limit=5&reportedOnly=true",
    expected: [200],
  },
  {
    name: "Chat Reports",
    endpoint: "/api/admin/chat/reports?page=1&limit=5",
    expected: [200],
  },
  {
    name: "Activity Logs",
    endpoint: "/api/admin/logs/recent?lines=20",
    expected: [200],
  },
  {
    name: "Analytics Overview",
    endpoint: "/api/admin/analytics/overview",
    expected: [200],
  },
  {
    name: "System Health",
    endpoint: "/api/admin/system/health",
    expected: [200],
  },
  { name: "AI Usage", endpoint: "/api/admin/ai/usage", expected: [200] },
  {
    name: "Coding Problems",
    endpoint: "/api/admin/coding/problems?page=1&limit=5",
    expected: [200],
  },
  {
    name: "Support Tickets",
    endpoint: "/api/support/tickets?page=1&limit=5",
    expected: [200],
  },
];

const run = async () => {
  console.log("\nRunning Admin Terminal smoke tests...");
  console.log(`BASE_URL: ${BASE_URL}`);
  console.log(`ADMIN_EMAIL: ${ADMIN_EMAIL}\n`);

  let token;
  try {
    token = await login();
    console.log("Login: PASS\n");
  } catch (error) {
    console.error("Login: FAIL");
    console.error(error.message);
    process.exitCode = 1;
    return;
  }

  let failures = 0;

  for (const testCase of smokeTests) {
    try {
      const result = await callAdminApi(token, testCase.endpoint);
      const passed = testCase.expected.includes(result.status) && result.payload?.success !== false;

      if (passed) {
        console.log(`${testCase.name}: PASS (${result.status})`);
      } else {
        failures += 1;
        console.error(`${testCase.name}: FAIL (${result.status})`);
        console.error(`Response: ${pretty(result.payload)}`);
      }
    } catch (error) {
      failures += 1;
      console.error(`${testCase.name}: FAIL (request error)`);
      console.error(error.message);
    }
  }

  // Invite token flow smoke check (non-destructive)
  try {
    const tokenResult = await callAdminApi(token, "/api/admin/generate-token", {
      method: "POST",
      body: {
        adminRole: "support_admin",
        permissions: ["admin.help.view", "admin.help.manage"],
      },
    });

    if (
      tokenResult.status === 200 &&
      tokenResult.payload?.success &&
      String(tokenResult.payload?.token || "").startsWith("admin_")
    ) {
      console.log("Admin Invite Token: PASS (200)");
    } else {
      failures += 1;
      console.error(`Admin Invite Token: FAIL (${tokenResult.status})`);
      console.error(`Response: ${pretty(tokenResult.payload)}`);
    }
  } catch (error) {
    failures += 1;
    console.error("Admin Invite Token: FAIL (request error)");
    console.error(error.message);
  }

  console.log("\nSmoke test run complete.");
  if (failures > 0) {
    console.error(`Failures: ${failures}`);
    process.exitCode = 1;
  } else {
    console.log("All smoke checks passed.");
  }
};

run().catch((error) => {
  console.error("Smoke test runner crashed:", error);
  process.exitCode = 1;
});
