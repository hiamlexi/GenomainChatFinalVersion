// Central middleware export to switch between local and gateway validation

// Set to true to use AdminSystem gateway validation
const USE_ADMIN_SYSTEM_GATEWAY = true;

if (USE_ADMIN_SYSTEM_GATEWAY) {
  console.log('[Middleware] Using AdminSystem gateway for authentication');
  module.exports = require('./validatedRequestGateway');
} else {
  console.log('[Middleware] Using local authentication');
  module.exports = require('./validatedRequest');
}