import React from 'react';
import { AppProject } from '../../../types';
import MonolithLayout from './MonolithLayout';

interface ChronicleLayoutProps {
  project: AppProject;
  onClose: () => void;
  isLoggedIn: boolean;
  onAuthTrigger?: () => void;
  isOwner?: boolean;
  onManageJam?: () => void;
}

const ChronicleLayout: React.FC<ChronicleLayoutProps> = (props) => {
  return <MonolithLayout {...props} />;
};

export default ChronicleLayout;
