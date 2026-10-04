import React from 'react';
import { CompanionSettings } from '../types';
import { SettingsPage } from './SettingsPage';

export interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: CompanionSettings;
  onSave: (newSettings: CompanionSettings) => void;
}

/**
 * SettingsModal wrapper for backwards compatibility.
 * Re-routes to the unified SettingsPage.
 */
export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSave,
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop">
      <div className="w-full h-full max-w-2xl max-h-[90vh] bg-surface rounded-2xl overflow-hidden border border-border shadow-2xl flex flex-col">
        <SettingsPage
          settings={settings}
          onSave={(newSettings) => {
            onSave(newSettings);
            onClose();
          }}
          onBack={onClose}
        />
      </div>
    </div>
  );
};

export default SettingsModal;
