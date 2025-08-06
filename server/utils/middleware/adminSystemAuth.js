const axios = require('axios');

// AdminSystem configuration
const ADMIN_SYSTEM_URL = process.env.ADMIN_SYSTEM_URL || 'http://localhost:5002';
const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY || 'secret-internal-api-key-change-in-production';

// Cache for validated tokens to reduce API calls
const tokenCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

class AdminSystemAuth {
  /**
   * Validate token with AdminSystem
   */
  static async validateToken(token) {
    try {
      // Check cache first
      const cached = tokenCache.get(token);
      if (cached && cached.expiresAt > Date.now()) {
        return cached.data;
      }

      // Validate with AdminSystem
      const response = await axios.post(
        `${ADMIN_SYSTEM_URL}/api/auth-gateway/validate-token`,
        { token },
        {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 5000
        }
      );

      if (response.data.valid) {
        // Cache the result
        tokenCache.set(token, {
          data: response.data,
          expiresAt: Date.now() + CACHE_TTL
        });

        // Clean old cache entries
        if (tokenCache.size > 100) {
          const now = Date.now();
          for (const [key, value] of tokenCache.entries()) {
            if (value.expiresAt < now) {
              tokenCache.delete(key);
            }
          }
        }

        return response.data;
      }

      return null;
    } catch (error) {
      console.error('AdminSystem token validation error:', error.message);
      return null;
    }
  }

  /**
   * Login through AdminSystem
   */
  static async login(username, password) {
    try {
      const response = await axios.post(
        `${ADMIN_SYSTEM_URL}/api/auth-gateway/unified-login`,
        { username, password },
        {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 5000
        }
      );

      return response.data;
    } catch (error) {
      console.error('AdminSystem login error:', error.message);
      throw error;
    }
  }

  /**
   * Create user through AdminSystem
   */
  static async createUser(userData) {
    try {
      const response = await axios.post(
        `${ADMIN_SYSTEM_URL}/api/auth-gateway/create-user`,
        userData,
        {
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': INTERNAL_API_KEY
          },
          timeout: 5000
        }
      );

      return response.data;
    } catch (error) {
      console.error('AdminSystem create user error:', error.message);
      throw error;
    }
  }

  /**
   * Get user from AdminSystem
   */
  static async getUser(userId) {
    try {
      const response = await axios.get(
        `${ADMIN_SYSTEM_URL}/api/auth-gateway/user/${userId}`,
        {
          headers: {
            'X-API-Key': INTERNAL_API_KEY
          },
          timeout: 5000
        }
      );

      return response.data;
    } catch (error) {
      console.error('AdminSystem get user error:', error.message);
      return null;
    }
  }

  /**
   * Update user in AdminSystem
   */
  static async updateUser(userId, updateData) {
    try {
      const response = await axios.put(
        `${ADMIN_SYSTEM_URL}/api/auth-gateway/user/${userId}`,
        updateData,
        {
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': INTERNAL_API_KEY
          },
          timeout: 5000
        }
      );

      return response.data;
    } catch (error) {
      console.error('AdminSystem update user error:', error.message);
      throw error;
    }
  }

  /**
   * Delete user from AdminSystem
   */
  static async deleteUser(userId) {
    try {
      const response = await axios.delete(
        `${ADMIN_SYSTEM_URL}/api/auth-gateway/user/${userId}`,
        {
          headers: {
            'X-API-Key': INTERNAL_API_KEY
          },
          timeout: 5000
        }
      );

      return response.data;
    } catch (error) {
      console.error('AdminSystem delete user error:', error.message);
      throw error;
    }
  }

  /**
   * List all users from AdminSystem
   */
  static async listUsers() {
    try {
      const response = await axios.get(
        `${ADMIN_SYSTEM_URL}/api/auth-gateway/users`,
        {
          headers: {
            'X-API-Key': INTERNAL_API_KEY
          },
          timeout: 5000
        }
      );

      return response.data;
    } catch (error) {
      console.error('AdminSystem list users error:', error.message);
      throw error;
    }
  }

  /**
   * Refresh token through AdminSystem
   */
  static async refreshToken(token) {
    try {
      const response = await axios.post(
        `${ADMIN_SYSTEM_URL}/api/auth-gateway/refresh-token`,
        { token },
        {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 5000
        }
      );

      return response.data;
    } catch (error) {
      console.error('AdminSystem refresh token error:', error.message);
      throw error;
    }
  }

  /**
   * Clear token from cache
   */
  static clearTokenCache(token) {
    tokenCache.delete(token);
  }

  /**
   * Clear all cached tokens
   */
  static clearAllTokenCache() {
    tokenCache.clear();
  }
}

/**
 * Express middleware to validate requests with AdminSystem
 */
function requireAdminSystemAuth(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '') || 
                 req.headers['auth-token'] ||
                 req.query.token;

  if (!token) {
    return res.status(401).json({
      error: 'No authentication token provided'
    });
  }

  AdminSystemAuth.validateToken(token)
    .then(result => {
      if (result && result.valid) {
        req.user = result.user;
        req.token = token;
        next();
      } else {
        res.status(401).json({
          error: 'Invalid or expired token'
        });
      }
    })
    .catch(error => {
      console.error('Auth middleware error:', error);
      res.status(500).json({
        error: 'Authentication service unavailable'
      });
    });
}

/**
 * Optional auth middleware - doesn't fail if no token
 */
function optionalAdminSystemAuth(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '') || 
                 req.headers['auth-token'] ||
                 req.query.token;

  if (!token) {
    return next();
  }

  AdminSystemAuth.validateToken(token)
    .then(result => {
      if (result && result.valid) {
        req.user = result.user;
        req.token = token;
      }
      next();
    })
    .catch(error => {
      console.error('Optional auth error:', error);
      next();
    });
}

/**
 * Middleware to check specific roles
 */
function requireRole(roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Insufficient permissions'
      });
    }

    next();
  };
}

module.exports = {
  AdminSystemAuth,
  requireAdminSystemAuth,
  optionalAdminSystemAuth,
  requireRole
};