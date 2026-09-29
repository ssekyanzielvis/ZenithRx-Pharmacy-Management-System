import React from 'react';
import { RegisterPharmacyPage } from './RegisterPharmacyPage';
import { UseAuthReturn } from '../../hooks/useAuth';

export interface SignUpPageProps {
  auth: UseAuthReturn;
  onClose?: () => void;
  onSwitchToLogin: () => void;
  onBackToLanding?: () => void;
  isModal?: boolean;
}

export const SignUpPage: React.FC<SignUpPageProps> = ({
  auth,
  onClose,
  onSwitchToLogin,
  onBackToLanding,
}) => {
  return (
    <RegisterPharmacyPage
      auth={auth}
      onBackToLanding={onBackToLanding || onClose}
      onSwitchToLogin={onSwitchToLogin}
    />
  );
};
