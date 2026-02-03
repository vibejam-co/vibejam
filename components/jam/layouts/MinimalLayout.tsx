import React from 'react';
import { AppProject } from '../../../types';
import MonolithLayout from './MonolithLayout';

interface MinimalLayoutProps {
  project: AppProject;
  onClose: () => void;
  isLoggedIn: boolean;
  onAuthTrigger?: () => void;
  isOwner?: boolean;
  onManageJam?: () => void;
}

const MinimalLayout: React.FC<MinimalLayoutProps> = (props) => {
  return <MonolithLayout {...props} />;
};

export default MinimalLayout;
