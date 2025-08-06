const { SystemSettings } = require("../../models/systemSettings");
const adminSystemClient = require("../adminSystemClient");

async function validatedRequest(request, response, next) {
  const multiUserMode = await SystemSettings.isMultiUserMode();
  response.locals.multiUserMode = multiUserMode;
  
  // In multi-user mode, validate against AdminSystem
  if (multiUserMode) {
    return await validateWithAdminSystem(request, response, next);
  }

  // Single user mode - keep existing behavior for now
  // This will be removed in Phase 4
  const { validatedRequest: originalValidation } = require("./validatedRequest");
  return originalValidation(request, response, next);
}

async function validateWithAdminSystem(request, response, next) {
  const auth = request.header("Authorization");
  const token = auth ? auth.split(" ")[1] : null;

  if (!token) {
    response.status(401).json({
      error: "No auth token found.",
    });
    return;
  }

  try {
    // Validate token with AdminSystem
    const validation = await adminSystemClient.validateToken(token);
    
    if (!validation.valid) {
      response.status(401).json({
        error: validation.message || "Invalid auth token.",
      });
      return;
    }

    // Transform AdminSystem user to match Genomain's expected format
    const user = {
      id: validation.user.id,
      username: validation.user.username,
      email: validation.user.email,
      role: validation.user.role,
      suspended: false, // AdminSystem doesn't have suspended field yet
    };

    response.locals.user = user;
    next();
  } catch (error) {
    console.error("AdminSystem validation error:", error);
    response.status(401).json({
      error: "Authentication service unavailable.",
    });
  }
}

module.exports = {
  validatedRequest,
};