import React from 'react';
import { PatientAuthPage, PatientAuthPageProps } from './PatientAuthPage';
import { PatientProfile } from '../../services/patientAuthService';

export interface PatientAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (patient: PatientProfile) => void;
  initialMode?: 'signin' | 'register';
  redirectReason?: string;
}

export const PatientAuthModal: React.FC<PatientAuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialMode = 'signin',
  redirectReason,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-white dark:bg-[#090F17]">
      <PatientAuthPage
        initialMode={initialMode}
        redirectReason={redirectReason}
        onBack={onClose}
        onSuccess={(patient) => {
          onSuccess(patient);
          onClose();
        }}
      />
    </div>
  );
};

export { PatientAuthPage };
