const { AdminSystemAuth } = require('../../../utils/middleware/adminSystemAuth');
const { User } = require('../../../models/user');
const { EventLogs } = require('../../../models/eventLogs');

function adminSystemAuthEndpoints(app) {
  if (!app) return;

  // Login through AdminSystem
  app.post('/api/v1/auth/login', async (request, response) => {
    try {
      const { username, password } = request.body;

      if (!username || !password) {
        return response.status(400).json({
          valid: false,
          message: 'Username and password are required'
        });
      }

      // Authenticate with AdminSystem
      const authResult = await AdminSystemAuth.login(username, password);

      if (!authResult.success) {
        return response.status(401).json({
          valid: false,
          message: authResult.message || 'Invalid credentials'
        });
      }

      // Sync user to local database if needed
      const localUser = await User.get({ username });
      
      if (!localUser) {
        // Create local user record
        await User._create({
          username: authResult.user.username,
          password: 'managed-by-admin-system', // Placeholder
          role: authResult.user.role,
          email: authResult.user.email
        });
      } else {
        // Update local user role if changed
        if (localUser.role !== authResult.user.role) {
          await User._updateUser(localUser.id, {
            role: authResult.user.role
          });
        }
      }

      // Log the event
      await EventLogs.logEvent('user_login', {
        username: authResult.user.username,
        ip: request.ip
      }, authResult.user.id);

      response.status(200).json({
        valid: true,
        user: authResult.user,
        token: authResult.token,
        message: 'Authentication successful'
      });

    } catch (error) {
      console.error('Login error:', error);
      response.status(500).json({
        valid: false,
        message: 'Authentication service error'
      });
    }
  });

  // Validate token through AdminSystem
  app.get('/api/v1/auth/check', async (request, response) => {
    try {
      const token = request.headers.authorization?.replace('Bearer ', '') || 
                    request.headers['auth-token'];

      if (!token) {
        return response.status(401).json({
          valid: false,
          message: 'No token provided'
        });
      }

      const validation = await AdminSystemAuth.validateToken(token);

      if (!validation || !validation.valid) {
        return response.status(401).json({
          valid: false,
          message: 'Invalid or expired token'
        });
      }

      response.status(200).json({
        valid: true,
        user: validation.user,
        token: token
      });

    } catch (error) {
      console.error('Token validation error:', error);
      response.status(500).json({
        valid: false,
        message: 'Validation service error'
      });
    }
  });

  // Request password reset (delegated to AdminSystem)
  app.post('/api/v1/auth/reset-password', async (request, response) => {
    try {
      const { username } = request.body;

      if (!username) {
        return response.status(400).json({
          valid: false,
          message: 'Username is required'
        });
      }

      // This would be implemented in AdminSystem
      // For now, return a message to contact admin
      response.status(200).json({
        valid: true,
        message: 'Please contact your administrator to reset your password'
      });

    } catch (error) {
      console.error('Password reset error:', error);
      response.status(500).json({
        valid: false,
        message: 'Password reset service error'
      });
    }
  });

  // Refresh token through AdminSystem
  app.post('/api/v1/auth/refresh', async (request, response) => {
    try {
      const { token } = request.body;
      const headerToken = request.headers.authorization?.replace('Bearer ', '');
      
      const tokenToRefresh = token || headerToken;

      if (!tokenToRefresh) {
        return response.status(400).json({
          valid: false,
          message: 'Token is required'
        });
      }

      const refreshResult = await AdminSystemAuth.refreshToken(tokenToRefresh);

      if (!refreshResult.success) {
        return response.status(401).json({
          valid: false,
          message: refreshResult.message || 'Token refresh failed'
        });
      }

      response.status(200).json({
        valid: true,
        token: refreshResult.token,
        message: 'Token refreshed successfully'
      });

    } catch (error) {
      console.error('Token refresh error:', error);
      response.status(500).json({
        valid: false,
        message: 'Token refresh service error'
      });
    }
  });

  // Logout (clear local session)
  app.post('/api/v1/auth/logout', async (request, response) => {
    try {
      const token = request.headers.authorization?.replace('Bearer ', '');
      
      if (token) {
        // Clear token from cache
        AdminSystemAuth.clearTokenCache(token);
      }

      response.status(200).json({
        valid: true,
        message: 'Logged out successfully'
      });

    } catch (error) {
      console.error('Logout error:', error);
      response.status(500).json({
        valid: false,
        message: 'Logout failed'
      });
    }
  });
}

module.exports = { adminSystemAuthEndpoints };