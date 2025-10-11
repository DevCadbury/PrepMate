const fetch = require("node-fetch");

const baseUrl = "http://localhost:5000/api";

async function testDeleteAccount() {
  try {
    console.log("=== COMPREHENSIVE DELETE ACCOUNT TEST ===");

    // 1. Test backend connectivity
    console.log("\n1. Testing backend connectivity...");
    try {
      const healthResponse = await fetch(`${baseUrl}/health`);
      console.log("✅ Backend health check status:", healthResponse.status);
    } catch (error) {
      console.log("❌ Backend is not running or not accessible");
      console.log("Error:", error.message);
      return;
    }

    // 2. Test login to get a valid token
    console.log("\n2. Testing login to get valid token...");
    try {
      const loginResponse = await fetch(`${baseUrl}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          identifier: "test@example.com", // Replace with actual test user
          password: "password123",
        }),
      });

      console.log("Login response status:", loginResponse.status);
      const loginText = await loginResponse.text();
      console.log("Login response body:", loginText);

      if (loginResponse.ok) {
        const loginData = JSON.parse(loginText);
        const token = loginData.data.token;
        console.log("✅ Got valid token, length:", token.length);

        // 3. Test delete account with valid token
        console.log("\n3. Testing delete account with valid token...");
        const deleteResponse = await fetch(`${baseUrl}/auth/delete-account`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ password: "password123" }),
        });

        console.log("Delete response status:", deleteResponse.status);
        const deleteText = await deleteResponse.text();
        console.log("Delete response body:", deleteText);
      } else {
        console.log("❌ Login failed, cannot test with valid token");
      }
    } catch (error) {
      console.log("❌ Login test failed:", error.message);
    }

    // 4. Test CORS preflight
    console.log("\n4. Testing CORS preflight...");
    try {
      const preflightResponse = await fetch(`${baseUrl}/auth/delete-account`, {
        method: "OPTIONS",
        headers: {
          Origin: "http://localhost:3000",
          "Access-Control-Request-Method": "DELETE",
          "Access-Control-Request-Headers": "Content-Type, Authorization",
        },
      });
      console.log("✅ CORS preflight status:", preflightResponse.status);
    } catch (error) {
      console.log("❌ CORS preflight failed:", error.message);
    }

    // 5. Test delete account endpoint without authentication
    console.log("\n5. Testing delete account endpoint without auth...");
    const response = await fetch(`${baseUrl}/auth/delete-account`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ password: "testpassword" }),
    });

    console.log("Response status:", response.status);
    const responseText = await response.text();
    console.log("Response body:", responseText);

    if (response.status === 401) {
      console.log("✅ Endpoint exists and requires authentication");
    } else {
      console.log("⚠️ Unexpected response from endpoint");
    }

    // 6. Test with invalid token
    console.log("\n6. Testing with invalid token...");
    const invalidTokenResponse = await fetch(`${baseUrl}/auth/delete-account`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer invalid-token",
      },
      body: JSON.stringify({ password: "testpassword" }),
    });

    console.log("Invalid token response status:", invalidTokenResponse.status);
    const invalidTokenText = await invalidTokenResponse.text();
    console.log("Invalid token response body:", invalidTokenText);
  } catch (error) {
    console.error("❌ Error testing delete account:", error.message);
  }
}

testDeleteAccount();
