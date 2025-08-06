const axios = require("axios");

class AdminSystemClient {
  constructor() {
    this.baseURL = process.env.ADMIN_SYSTEM_URL || "http://localhost:5002";
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 10000,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  async validateToken(token) {
    try {
      const response = await this.client.post("/api/gateway/auth/validate", {
        token,
      });
      return response.data;
    } catch (error) {
      if (error.response) {
        return {
          status: "error",
          valid: false,
          message: error.response.data.message || "Invalid token",
        };
      }
      throw error;
    }
  }

  async refreshToken(token) {
    try {
      const response = await this.client.post("/api/gateway/auth/refresh", {
        token,
      });
      return response.data;
    } catch (error) {
      if (error.response) {
        return {
          status: "error",
          message: error.response.data.message || "Failed to refresh token",
        };
      }
      throw error;
    }
  }

  async getUserByToken(token) {
    try {
      const response = await this.client.get("/api/gateway/users/by-token", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      if (error.response) {
        return {
          status: "error",
          message: error.response.data.message || "Failed to get user",
        };
      }
      throw error;
    }
  }
}

module.exports = new AdminSystemClient();