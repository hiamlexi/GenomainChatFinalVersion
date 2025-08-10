import System from "@/models/system";
import showToast from "@/utils/toast";
import { useEffect, useRef, useState } from "react";
import AgentLLMSelection from "./AgentLLMSelection";
import Admin from "@/models/admin";
import * as Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import PreLoader from "@/components/Preloader";
import Sidebar from "@/components/SettingsSidebar";
import { isMobile } from "react-device-detect";
import ContextualSaveBar from "@/components/ContextualSaveBar";

export default function GeneralAgentLLMPreference() {
  const [settings, setSettings] = useState({});
  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const formEl = useRef(null);

  useEffect(() => {
    async function fetchSettings() {
      const _settings = await System.keys();
      const _preferences = await Admin.systemPreferences();
      setSettings({ ..._settings, preferences: _preferences.settings } ?? {});
      setLoading(false);
    }
    fetchSettings();
  }, []);

  const handleUpdate = async (e) => {
    setSaving(true);
    e.preventDefault();
    const data = {};

    const form = new FormData(formEl.current);
    for (var [key, value] of form.entries()) {
      // Map agentProvider and agentModel to the correct ENV keys
      if (key === "agentProvider") {
        data["AgentLLMProvider"] = String(value);
      } else if (key === "agentModel") {
        data["AgentLLMModel"] = String(value);
      } else {
        data[key] = String(value);
      }
    }

    const { error } = await System.updateSystem(data);
    if (error) {
      showToast(`Error: ${error}`, "error", { clear: true });
    } else {
      showToast("Agent LLM settings updated successfully!", "success", { clear: true });
      // Refresh settings
      const _settings = await System.keys();
      setSettings(_settings ?? {});
    }

    setSaving(false);
    setHasChanges(false);
  };

  if (loading) {
    return (
      <div className="w-full h-screen overflow-hidden bg-sidebar flex">
        <Sidebar />
        <div
          style={{ height: isMobile ? "100%" : "calc(100% - 32px)" }}
          className="transition-all duration-500 relative md:ml-[2px] md:mr-[16px] md:my-[16px] md:rounded-[16px] bg-main-gradient w-full h-full overflow-y-scroll border-2 border-outline"
        >
          <div className="w-full h-full flex justify-center items-center">
            <PreLoader />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen overflow-hidden bg-sidebar flex">
      <Sidebar />
      <div
        style={{ height: isMobile ? "100%" : "calc(100% - 32px)" }}
        className="transition-all duration-500 relative md:ml-[2px] md:mr-[16px] md:my-[16px] md:rounded-[16px] bg-main-gradient w-full h-full overflow-y-scroll border-2 border-outline"
      >
        <form
          ref={formEl}
          onSubmit={handleUpdate}
          onChange={() => setHasChanges(true)}
          className="flex flex-col w-full px-1 md:pl-6 md:pr-[86px] md:py-6 py-16"
        >
          <div className="w-full flex flex-col gap-y-1 pb-6 border-white border-b-2 border-opacity-10">
            <div className="flex gap-x-4 items-center">
              <p className="text-lg leading-6 font-bold text-white">
                Agent LLM Preference
              </p>
            </div>
            <p className="text-xs leading-[18px] font-base text-white text-opacity-60">
              Configure the default LLM provider and model that agents will use across all workspaces.
              These settings will be applied system-wide for agent functionality.
            </p>
          </div>

          <div className="mt-6 flex flex-col gap-y-6">
            <AgentLLMSelection
              settings={settings}
              setHasChanges={setHasChanges}
            />
          </div>

          {hasChanges && (
            <ContextualSaveBar
              onSave={handleUpdate}
              onCancel={() => {
                setHasChanges(false);
                formEl.current?.reset();
              }}
              disabled={saving}
            />
          )}
        </form>
      </div>
    </div>
  );
}