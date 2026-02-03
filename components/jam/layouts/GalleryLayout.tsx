import React from 'react';
import { AppProject } from '../../../types';
import MonolithLayout from './MonolithLayout';

interface GalleryLayoutProps {
  project: AppProject;
  onClose: () => void;
  isLoggedIn: boolean;
  onAuthTrigger?: () => void;
  isOwner?: boolean;
  onManageJam?: () => void;
}

const GalleryLayout: React.FC<GalleryLayoutProps> = (props) => {
  return <MonolithLayout {...props} />;
};

export default GalleryLayout;
