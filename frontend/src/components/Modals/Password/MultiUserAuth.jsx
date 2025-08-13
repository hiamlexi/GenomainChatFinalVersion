import React, { useEffect, useState } from "react";
import System from "../../../models/system";
import { AUTH_TOKEN, AUTH_USER } from "../../../utils/constants";
import paths from "../../../utils/paths";
import showToast from "@/utils/toast";
import ModalWrapper from "@/components/ModalWrapper";
import { useModal } from "@/hooks/useModal";
import RecoveryCodeModal from "@/components/Modals/DisplayRecoveryCodeModal";
import { useTranslation } from "react-i18next";
import { t } from "i18next";

const RecoveryForm = ({ onSubmit, setShowRecoveryForm }) => {
  const [username, setUsername] = useState("");
  const [recoveryCodeInputs, setRecoveryCodeInputs] = useState(
    Array(2).fill("")
  );

  const handleRecoveryCodeChange = (index, value) => {
    const updatedCodes = [...recoveryCodeInputs];
    updatedCodes[index] = value;
    setRecoveryCodeInputs(updatedCodes);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const recoveryCodes = recoveryCodeInputs.filter(
      (code) => code.trim() !== ""
    );
    onSubmit(username, recoveryCodes);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col justify-center items-center relative p-8 md:p-12 w-full md:w-[400px]"
    >
      <div className="flex items-start justify-between pb-6 w-full">
        <div className="flex flex-col gap-y-4 w-full">
          <h3 className="text-2xl font-bold text-white text-center">
            Password Reset
          </h3>
          <p className="text-sm text-gray-400 text-center">
            Enter your username and recovery codes to reset your password
          </p>
        </div>
      </div>
      <div className="space-y-4 flex h-full w-full">
        <div className="w-full flex flex-col gap-y-4">
          <div className="flex flex-col gap-y-2">
            <label className="text-white text-sm font-medium">
              Username
            </label>
            <input
              name="username"
              type="text"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder:text-gray-400 focus:outline-none focus:border-blue-500 focus:bg-white/15 transition-all"
              required
            />
          </div>
          <div className="flex flex-col gap-y-2">
            <label className="text-white text-sm font-medium">
              Recovery Codes
            </label>
            {recoveryCodeInputs.map((code, index) => (
              <div key={index}>
                <input
                  type="text"
                  name={`recoveryCode${index + 1}`}
                  placeholder={`Recovery code ${index + 1}`}
                  value={code}
                  onChange={(e) =>
                    handleRecoveryCodeChange(index, e.target.value)
                  }
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder:text-gray-400 focus:outline-none focus:border-blue-500 focus:bg-white/15 transition-all"
                  required
                />
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="flex items-center mt-6 w-full flex-col gap-y-4">
        <button
          type="submit"
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all duration-200"
        >
          Reset Password
        </button>
        <button
          type="button"
          className="text-gray-400 text-sm hover:text-white transition-colors"
          onClick={() => setShowRecoveryForm(false)}
        >
          Back to login
        </button>
      </div>
    </form>
  );
};

const ResetPasswordForm = ({ onSubmit }) => {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswordRequirements, setShowPasswordRequirements] = useState(true);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(newPassword, confirmPassword);
  };

  // Password requirements based on the backend validation
  const passwordRequirements = [
    { met: newPassword.length >= 8, text: "At least 8 characters" },
    { met: newPassword.length <= 250, text: "Maximum 250 characters" },
  ];

  // Check if password potentially meets basic requirements
  const hasLowercase = /[a-z]/.test(newPassword);
  const hasUppercase = /[A-Z]/.test(newPassword);
  const hasNumber = /\d/.test(newPassword);
  const hasSymbol = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword);

  // Additional recommendations (not required but good practice)
  const recommendations = [
    { met: hasLowercase, text: "Include lowercase letters (recommended)" },
    { met: hasUppercase, text: "Include uppercase letters (recommended)" },
    { met: hasNumber, text: "Include numbers (recommended)" },
    { met: hasSymbol, text: "Include special characters (recommended)" },
  ];

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col justify-center items-center relative p-8 md:p-12 w-full md:w-[400px]"
    >
      <div className="flex items-start justify-between pb-6 w-full">
        <div className="flex flex-col gap-y-4 w-full">
          <h3 className="text-2xl font-bold text-white text-center">
            Reset Password
          </h3>
          <p className="text-sm text-gray-400 text-center">
            Enter your new password
          </p>
        </div>
      </div>
      <div className="space-y-4 flex h-full w-full">
        <div className="w-full flex flex-col gap-y-4">
          <div>
            <input
              type="password"
              name="newPassword"
              placeholder="New Password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              onFocus={() => setShowPasswordRequirements(true)}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder:text-gray-400 focus:outline-none focus:border-blue-500 focus:bg-white/15 transition-all"
              required
            />
            
            {/* Password Requirements Section */}
            {showPasswordRequirements && newPassword && (
              <div className="mt-3 p-3 bg-black/20 backdrop-blur-sm rounded-lg border border-white/10">
                <p className="text-xs font-semibold text-gray-300 mb-2">Password Requirements:</p>
                <ul className="space-y-1">
                  {passwordRequirements.map((req, index) => (
                    <li
                      key={index}
                      className={`text-xs flex items-center gap-2 ${
                        req.met ? "text-green-400" : "text-gray-400"
                      }`}
                    >
                      <span className={`inline-block w-1.5 h-1.5 rounded-full ${
                        req.met ? "bg-green-400" : "bg-gray-500"
                      }`}></span>
                      {req.text}
                    </li>
                  ))}
                </ul>
                
                <p className="text-xs font-semibold text-gray-300 mt-3 mb-2">Strong Password Tips:</p>
                <ul className="space-y-1">
                  {recommendations.map((rec, index) => (
                    <li
                      key={index}
                      className={`text-xs flex items-center gap-2 ${
                        rec.met ? "text-blue-400" : "text-gray-500"
                      }`}
                    >
                      <span className={`inline-block w-1.5 h-1.5 rounded-full ${
                        rec.met ? "bg-blue-400" : "bg-gray-600"
                      }`}></span>
                      {rec.text}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          <div>
            <input
              type="password"
              name="confirmPassword"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder:text-gray-400 focus:outline-none focus:border-blue-500 focus:bg-white/15 transition-all"
              required
            />
            {confirmPassword && newPassword !== confirmPassword && (
              <p className="text-xs text-red-400 mt-1">Passwords do not match</p>
            )}
            {confirmPassword && newPassword === confirmPassword && confirmPassword.length > 0 && (
              <p className="text-xs text-green-400 mt-1">Passwords match</p>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center mt-6 w-full flex-col gap-y-4">
        <button
          type="submit"
          disabled={!newPassword || !confirmPassword || newPassword !== confirmPassword || newPassword.length < 8}
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-all duration-200"
        >
          Reset Password
        </button>
      </div>
    </form>
  );
};

export default function MultiUserAuth() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [recoveryCodes, setRecoveryCodes] = useState([]);
  const [downloadComplete, setDownloadComplete] = useState(false);
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [showRecoveryForm, setShowRecoveryForm] = useState(false);
  const [showResetPasswordForm, setShowResetPasswordForm] = useState(false);
  const [customAppName, setCustomAppName] = useState(null);

  const {
    isOpen: isRecoveryCodeModalOpen,
    openModal: openRecoveryCodeModal,
    closeModal: closeRecoveryCodeModal,
  } = useModal();

  const handleLogin = async (e) => {
    setError(null);
    setLoading(true);
    e.preventDefault();
    const data = {};
    const form = new FormData(e.target);
    for (var [key, value] of form.entries()) data[key] = value;
    const { valid, user, token, message, recoveryCodes } =
      await System.requestToken(data);
    if (valid && !!token && !!user) {
      setUser(user);
      setToken(token);

      if (recoveryCodes) {
        setRecoveryCodes(recoveryCodes);
        openRecoveryCodeModal();
      } else {
        window.localStorage.setItem(AUTH_USER, JSON.stringify(user));
        window.localStorage.setItem(AUTH_TOKEN, token);
        window.location = paths.home();
      }
    } else {
      setError(message);
      setLoading(false);
    }
    setLoading(false);
  };

  const handleDownloadComplete = () => setDownloadComplete(true);
  const handleResetPassword = () => setShowRecoveryForm(true);
  const handleRecoverySubmit = async (username, recoveryCodes) => {
    const { success, resetToken, error } = await System.recoverAccount(
      username,
      recoveryCodes
    );

    if (success && resetToken) {
      window.localStorage.setItem("resetToken", resetToken);
      setShowRecoveryForm(false);
      setShowResetPasswordForm(true);
    } else {
      showToast(error, "error", { clear: true });
    }
  };

  const handleResetSubmit = async (newPassword, confirmPassword) => {
    const resetToken = window.localStorage.getItem("resetToken");

    if (resetToken) {
      const { success, error } = await System.resetPassword(
        resetToken,
        newPassword,
        confirmPassword
      );

      if (success) {
        window.localStorage.removeItem("resetToken");
        setShowResetPasswordForm(false);
        showToast("Password reset successful", "success", { clear: true });
      } else {
        showToast(error, "error", { clear: true });
      }
    } else {
      showToast("Invalid reset token", "error", { clear: true });
    }
  };

  useEffect(() => {
    if (downloadComplete && user && token) {
      window.localStorage.setItem(AUTH_USER, JSON.stringify(user));
      window.localStorage.setItem(AUTH_TOKEN, token);
      window.location = paths.home();
    }
  }, [downloadComplete, user, token]);

  useEffect(() => {
    const fetchCustomAppName = async () => {
      const { appName } = await System.fetchCustomAppName();
      setCustomAppName(appName || "");
      setLoading(false);
    };
    fetchCustomAppName();
  }, []);

  if (showRecoveryForm) {
    return (
      <RecoveryForm
        onSubmit={handleRecoverySubmit}
        setShowRecoveryForm={setShowRecoveryForm}
      />
    );
  }

  if (showResetPasswordForm)
    return <ResetPasswordForm onSubmit={handleResetSubmit} />;
  return (
    <>
      <form onSubmit={handleLogin}>
        <div className="flex flex-col justify-center items-center relative p-8 md:p-12 w-full md:w-[400px]">
          <div className="flex items-start justify-between pb-6 rounded-t w-full">
            <div className="flex items-center flex-col gap-y-4 w-full">
              <h3 className="text-2xl font-bold text-white text-center">
                Welcome to {customAppName || "GenomainAB"}
              </h3>
              <p className="text-sm text-gray-400 text-center">
                Sign in to continue to your workspace
              </p>
            </div>
          </div>
          <div className="w-full">
            <div className="w-full flex flex-col gap-y-4">
              <div className="w-full">
                <input
                  name="username"
                  type="text"
                  placeholder="Username"
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder:text-gray-400 focus:outline-none focus:border-blue-500 focus:bg-white/15 transition-all"
                  required={true}
                  autoComplete="off"
                />
              </div>
              <div className="w-full">
                <input
                  name="password"
                  type="password"
                  placeholder="Password"
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder:text-gray-400 focus:outline-none focus:border-blue-500 focus:bg-white/15 transition-all"
                  required={true}
                  autoComplete="off"
                />
              </div>
              {error && <p className="text-red-400 text-sm text-center">Error: {error}</p>}
            </div>
          </div>
          <div className="flex items-center mt-6 w-full flex-col gap-y-4">
            <button
              disabled={loading}
              type="submit"
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
            <button
              type="button"
              className="text-gray-400 text-sm hover:text-white transition-colors"
              onClick={handleResetPassword}
            >
              Forgot password?
            </button>
          </div>
        </div>
      </form>

      <ModalWrapper isOpen={isRecoveryCodeModalOpen} noPortal={true}>
        <RecoveryCodeModal
          recoveryCodes={recoveryCodes}
          onDownloadComplete={handleDownloadComplete}
          onClose={closeRecoveryCodeModal}
        />
      </ModalWrapper>
    </>
  );
}
