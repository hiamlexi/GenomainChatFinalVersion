const { SystemSettings } = require("../models/systemSettings");
const { EventLogs } = require("../models/eventLogs");
const { Telemetry } = require("../models/telemetry");
const adminSystemClient = require("../utils/adminSystemClient");
const { reqBody } = require("../utils/http");
const axios = require("axios");

function authGatewayEndpoints(app) {
  // New login endpoint that uses AdminSystem
  app.post("/gateway/request-token", async (request, response) => {
    try {
      const { username, password } = reqBody(request);

      if (!username || !password) {
        response.status(400).json({
          user: null,
          valid: false,
          token: null,
          message: "Username and password are required.",
        });
        return;
      }

      // First authenticate with AdminSystem
      const adminSystemUrl = process.env.ADMIN_SYSTEM_URL || "http://localhost:5002";
      
      try {
        // Login to AdminSystem - using user-login endpoint for chat interface
        const loginResponse = await axios.post(`${adminSystemUrl}/api/auth/user-login`, {
          username,
          password,
        });

        if (loginResponse.data.status !== "success") {
          await EventLogs.logEvent("failed_login_invalid_credentials", {
            ip: request.ip || "Unknown IP",
            username: username || "Unknown user",
          });
          
          response.status(200).json({
            user: null,
            valid: false,
            token: null,
            message: "[001] Invalid login credentials.",
          });
          return;
        }

        const { token, user } = loginResponse.data;

        // Log successful login
        await Telemetry.sendTelemetry("login_event", { multiUserMode: true });
        await EventLogs.logEvent("login_event", {
          ip: request.ip || "Unknown IP",
          username: user.username || "Unknown user",
        });

        // Check if user needs recovery codes (hybrid approach)
        let recoveryCodes = null;
        if (user.needsRecoveryCodes) {
          try {
            // Import recovery code generation from Genomain's own utilities
            const { generateRecoveryCodes } = require("../utils/PasswordRecovery");
            const { User } = require("../models/user");
            const { RecoveryCode } = require("../models/passwordRecovery");
            
            // Check if user exists in Genomain database
            const genomainUser = await User.get({ username: user.username });
            
            if (genomainUser) {
              // Check if recovery codes already exist
              const existingCodes = await RecoveryCode.hashesForUser(genomainUser.id);
              
              if (existingCodes.length === 0) {
                // Generate new recovery codes in Genomain's database
                recoveryCodes = await generateRecoveryCodes(genomainUser.id);
                
                // Notify AdminSystem that codes have been generated (optional)
                // This could be done via a webhook or API call if needed
                console.log(`Generated recovery codes for user ${user.username} after password reset`);
              }
            }
          } catch (error) {
            console.error("Error generating recovery codes:", error);
            // Continue without recovery codes if there's an error
          }
        }

        // Prepare response
        const responseData = {
          valid: true,
          user: {
            id: user._id || user.id,
            username: user.username,
            email: user.email,
            role: user.role || "default",
          },
          token: token,
          message: null,
        };

        // Add recovery codes if generated
        if (recoveryCodes && recoveryCodes.length > 0) {
          responseData.recoveryCodes = recoveryCodes;
        }

        // Return the response
        response.status(200).json(responseData);
      } catch (error) {
        console.error("AdminSystem login error:", error.response?.data || error.message);
        
        if (error.response?.status === 401) {
          await EventLogs.logEvent("failed_login_invalid_credentials", {
            ip: request.ip || "Unknown IP",
            username: username || "Unknown user",
          });
          
          response.status(200).json({
            user: null,
            valid: false,
            token: null,
            message: "[001] Invalid login credentials.",
          });
        } else {
          response.status(500).json({
            user: null,
            valid: false,
            token: null,
            message: "Authentication service unavailable.",
          });
        }
      }
    } catch (e) {
      console.error(e.message, e);
      response.status(500).json({
        valid: false,
        token: null,
        message: "An error occurred during login.",
      });
    }
  });

  // Token validation endpoint
  app.get("/gateway/validate-token", async (request, response) => {
    try {
      const auth = request.header("Authorization");
      const token = auth ? auth.split(" ")[1] : null;

      if (!token) {
        response.status(401).json({
          valid: false,
          message: "No auth token found.",
        });
        return;
      }

      const validation = await adminSystemClient.validateToken(token);
      
      if (!validation.valid) {
        response.status(401).json({
          valid: false,
          message: validation.message,
        });
        return;
      }

      response.status(200).json({
        valid: true,
        user: validation.user,
      });
    } catch (error) {
      console.error("Token validation error:", error);
      response.status(500).json({
        valid: false,
        message: "Failed to validate token.",
      });
    }
  });

  // Token refresh endpoint
  app.post("/gateway/refresh-token", async (request, response) => {
    try {
      const { token } = reqBody(request);

      if (!token) {
        response.status(400).json({
          success: false,
          message: "Token is required.",
        });
        return;
      }

      const refreshResult = await adminSystemClient.refreshToken(token);
      
      if (refreshResult.status !== "success") {
        response.status(401).json({
          success: false,
          message: refreshResult.message,
        });
        return;
      }

      response.status(200).json({
        success: true,
        token: refreshResult.token,
        user: refreshResult.user,
      });
    } catch (error) {
      console.error("Token refresh error:", error);
      response.status(500).json({
        success: false,
        message: "Failed to refresh token.",
      });
    }
  });
}

module.exports = { authGatewayEndpoints };