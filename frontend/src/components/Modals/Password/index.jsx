import React, { useState, useEffect } from "react";
import System from "../../../models/system";
import SingleUserAuth from "./SingleUserAuth";
import MultiUserAuth from "./MultiUserAuth";
import {
  AUTH_TOKEN,
  AUTH_USER,
  AUTH_TIMESTAMP,
} from "../../../utils/constants";
import useLogo from "../../../hooks/useLogo";

export default function PasswordModal({ mode = "single" }) {
  const { loginLogo } = useLogo();
  return (
    <div className="fixed top-0 left-0 right-0 z-50 w-full overflow-x-hidden overflow-y-auto md:inset-0 h-[calc(100%-1rem)] h-full flex items-center justify-center" style={{
      background: 'linear-gradient(135deg, #000428 0%, #004e92 100%)',
      backgroundImage: `
        radial-gradient(circle at 20% 50%, rgba(0, 150, 255, 0.3) 0%, transparent 50%),
        radial-gradient(circle at 80% 80%, rgba(0, 200, 255, 0.2) 0%, transparent 50%),
        radial-gradient(circle at 40% 20%, rgba(0, 100, 255, 0.2) 0%, transparent 50%),
        linear-gradient(135deg, #000428 0%, #004e92 100%)
      `
    }}>
      {/* Network pattern overlay */}
      <div className="absolute inset-0 overflow-hidden" style={{
        backgroundImage: `
          linear-gradient(90deg, rgba(0, 150, 255, 0.1) 1px, transparent 1px),
          linear-gradient(rgba(0, 150, 255, 0.1) 1px, transparent 1px)
        `,
        backgroundSize: '50px 50px'
      }}>
        <svg className="absolute inset-0 w-full h-full opacity-20" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="network" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
              <circle cx="0" cy="0" r="2" fill="#00aaff"/>
              <circle cx="100" cy="0" r="2" fill="#00aaff"/>
              <circle cx="0" cy="100" r="2" fill="#00aaff"/>
              <circle cx="100" cy="100" r="2" fill="#00aaff"/>
              <circle cx="50" cy="50" r="3" fill="#00ddff"/>
              <line x1="0" y1="0" x2="50" y2="50" stroke="#00aaff" strokeWidth="0.5" opacity="0.5"/>
              <line x1="100" y1="0" x2="50" y2="50" stroke="#00aaff" strokeWidth="0.5" opacity="0.5"/>
              <line x1="0" y1="100" x2="50" y2="50" stroke="#00aaff" strokeWidth="0.5" opacity="0.5"/>
              <line x1="100" y1="100" x2="50" y2="50" stroke="#00aaff" strokeWidth="0.5" opacity="0.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#network)"/>
        </svg>
      </div>
      
      {/* Main content */}
      <div className="flex flex-col items-center justify-center z-50 relative">
        {/* Logo */}
        <img
          src="/Logga-vit.png"
          alt="Logo"
          className="mb-8 h-20 w-auto"
        />
        
        {/* Login card */}
        <div className="backdrop-blur-lg bg-white/5 rounded-2xl border border-white/10 shadow-2xl">
          {mode === "single" ? <SingleUserAuth /> : <MultiUserAuth />}
        </div>
        
        {/* Footer text */}
        <p className="mt-8 text-gray-400 text-sm">
          © 2024 GenomainAB. All rights reserved.
        </p>
      </div>
    </div>
  );
}

export function usePasswordModal(notry = false) {
  const [auth, setAuth] = useState({
    loading: true,
    requiresAuth: false,
    mode: "single",
  });

  useEffect(() => {
    async function checkAuthReq() {
      if (!window) return;

      // If the last validity check is still valid
      // we can skip the loading.
      if (!System.needsAuthCheck() && notry === false) {
        setAuth({
          loading: false,
          requiresAuth: false,
          mode: "multi",
        });
        return;
      }

      const settings = await System.keys();
      if (settings?.MultiUserMode) {
        const currentToken = window.localStorage.getItem(AUTH_TOKEN);
        if (!!currentToken) {
          const valid = notry ? false : await System.checkAuth(currentToken);
          if (!valid) {
            setAuth({
              loading: false,
              requiresAuth: true,
              mode: "multi",
            });
            window.localStorage.removeItem(AUTH_USER);
            window.localStorage.removeItem(AUTH_TOKEN);
            window.localStorage.removeItem(AUTH_TIMESTAMP);
            return;
          } else {
            setAuth({
              loading: false,
              requiresAuth: false,
              mode: "multi",
            });
            return;
          }
        } else {
          setAuth({
            loading: false,
            requiresAuth: true,
            mode: "multi",
          });
          return;
        }
      } else {
        // Running token check in single user Auth mode.
        // If Single user Auth is disabled - skip check
        const requiresAuth = settings?.RequiresAuth || false;
        if (!requiresAuth) {
          setAuth({
            loading: false,
            requiresAuth: false,
            mode: "single",
          });
          return;
        }

        const currentToken = window.localStorage.getItem(AUTH_TOKEN);
        if (!!currentToken) {
          const valid = notry ? false : await System.checkAuth(currentToken);
          if (!valid) {
            setAuth({
              loading: false,
              requiresAuth: true,
              mode: "single",
            });
            window.localStorage.removeItem(AUTH_TOKEN);
            window.localStorage.removeItem(AUTH_USER);
            window.localStorage.removeItem(AUTH_TIMESTAMP);
            return;
          } else {
            setAuth({
              loading: false,
              requiresAuth: false,
              mode: "single",
            });
            return;
          }
        } else {
          setAuth({
            loading: false,
            requiresAuth: true,
            mode: "single",
          });
          return;
        }
      }
    }
    checkAuthReq();
  }, []);

  return auth;
}
