const axios = require('axios');
const bcrypt = require('bcryptjs');

async function createUser() {
  try {
    // First, we need to login as admin to get a token
    console.log('Creating user pthomas in AdminSystem...');
    
    // The AdminSystem needs a company and agent ID, let's get them first
    // For now, we'll use the direct database approach
    
    const db = require('/Users/linhpham/Desktop/test/AdminSystem/backend/database/db');
    
    // Check if user already exists
    const users = await db.findAll('users');
    const existingUser = users.find(u => u.username === 'pthomas' && !u.isDeleted);
    
    if (existingUser) {
      console.log('User pthomas already exists');
      return;
    }
    
    // Get first company and agent (or create dummy ones)
    const companies = await db.findAll('companies');
    const agents = await db.findAll('computer-agents');
    
    let companyId = companies.length > 0 ? companies[0]._id : null;
    let agentId = agents.length > 0 ? agents[0]._id : null;
    
    if (!companyId) {
      // Create a default company
      const newCompany = await db.insert('companies', {
        name: 'Default Company',
        description: 'Default company for users',
        isDeleted: false,
        createdAt: new Date().toISOString()
      });
      companyId = newCompany._id;
      console.log('Created default company');
    }
    
    if (!agentId) {
      // Create a default agent
      const newAgent = await db.insert('computer-agents', {
        name: 'Default Agent',
        description: 'Default agent for users',
        isDeleted: false,
        createdAt: new Date().toISOString()
      });
      agentId = newAgent._id;
      console.log('Created default agent');
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    // Create user
    const newUser = await db.insert('users', {
      username: 'pthomas',
      name: 'P Thomas',
      email: 'pthomas@example.com',
      password: hashedPassword,
      companyId: companyId,
      agentId: agentId,
      role: 'default',
      aiName: '',
      aiPrompt: '',
      files: [],
      urls: [],
      isDeleted: false,
      createdAt: new Date().toISOString()
    });
    
    console.log('User created successfully:', newUser);
    
  } catch (error) {
    console.error('Error creating user:', error);
  } finally {
    process.exit(0);
  }
}

createUser();