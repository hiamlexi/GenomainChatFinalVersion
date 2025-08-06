/**
 * Middleware to delegate user management operations to AdminSystem
 * when USE_ADMIN_SYSTEM_AUTH is enabled
 */

const { AdminSystemAuth } = require('./adminSystemAuth');

// Check if AdminSystem auth is enabled
const isAdminSystemEnabled = () => {
  return process.env.USE_ADMIN_SYSTEM_AUTH === 'true';
};

/**
 * Middleware to intercept user creation requests and delegate to AdminSystem
 */
const delegateUserCreation = async (req, res, next) => {
  if (!isAdminSystemEnabled()) {
    return next(); // Continue with normal Genomain user creation
  }

  try {
    // Extract user data from request
    const userData = {
      username: req.body.username,
      password: req.body.password,
      email: req.body.email,
      role: req.body.role || 'default',
      companyId: req.body.companyId,
      agentId: req.body.agentId
    };

    // Create user through AdminSystem
    const result = await AdminSystemAuth.createUser(userData);

    if (result.success) {
      // Return AdminSystem response
      return res.status(201).json({
        user: result.user,
        message: 'User created successfully via AdminSystem'
      });
    } else {
      return res.status(400).json({
        message: result.message || 'Failed to create user'
      });
    }
  } catch (error) {
    console.error('User creation delegation error:', error);
    return res.status(500).json({
      message: 'Failed to create user via AdminSystem'
    });
  }
};

/**
 * Middleware to intercept user update requests and delegate to AdminSystem
 */
const delegateUserUpdate = async (req, res, next) => {
  if (!isAdminSystemEnabled()) {
    return next(); // Continue with normal Genomain user update
  }

  try {
    const userId = req.params.id;
    const updateData = req.body;

    // Update user through AdminSystem
    const result = await AdminSystemAuth.updateUser(userId, updateData);

    if (result.success) {
      return res.json({
        user: result.user,
        message: 'User updated successfully via AdminSystem'
      });
    } else {
      return res.status(400).json({
        message: result.message || 'Failed to update user'
      });
    }
  } catch (error) {
    console.error('User update delegation error:', error);
    return res.status(500).json({
      message: 'Failed to update user via AdminSystem'
    });
  }
};

/**
 * Middleware to intercept user deletion requests and delegate to AdminSystem
 */
const delegateUserDeletion = async (req, res, next) => {
  if (!isAdminSystemEnabled()) {
    return next(); // Continue with normal Genomain user deletion
  }

  try {
    const userId = req.params.id;

    // Delete user through AdminSystem
    const result = await AdminSystemAuth.deleteUser(userId);

    if (result.success) {
      return res.json({
        message: 'User deleted successfully via AdminSystem'
      });
    } else {
      return res.status(400).json({
        message: result.message || 'Failed to delete user'
      });
    }
  } catch (error) {
    console.error('User deletion delegation error:', error);
    return res.status(500).json({
      message: 'Failed to delete user via AdminSystem'
    });
  }
};

/**
 * Middleware to intercept user list requests and delegate to AdminSystem
 */
const delegateUserList = async (req, res, next) => {
  if (!isAdminSystemEnabled()) {
    return next(); // Continue with normal Genomain user list
  }

  try {
    // Get users from AdminSystem
    const result = await AdminSystemAuth.listUsers();

    if (result.success) {
      return res.json({
        users: result.users,
        totalUsers: result.users.length
      });
    } else {
      return res.status(400).json({
        message: result.message || 'Failed to list users'
      });
    }
  } catch (error) {
    console.error('User list delegation error:', error);
    return res.status(500).json({
      message: 'Failed to list users via AdminSystem'
    });
  }
};

/**
 * Middleware to block direct user management when AdminSystem is enabled
 */
const blockDirectUserManagement = (operation) => {
  return (req, res, next) => {
    if (isAdminSystemEnabled()) {
      return res.status(403).json({
        message: `Direct ${operation} is disabled. Please use AdminSystem for user management.`,
        adminSystemUrl: process.env.ADMIN_SYSTEM_URL
      });
    }
    next();
  };
};

module.exports = {
  isAdminSystemEnabled,
  delegateUserCreation,
  delegateUserUpdate,
  delegateUserDeletion,
  delegateUserList,
  blockDirectUserManagement
};