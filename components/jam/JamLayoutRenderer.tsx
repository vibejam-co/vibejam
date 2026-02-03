import React from 'react';
import { AppProject } from '../../types';
import MonolithLayout from './layouts/MonolithLayout';
import ChronicleLayout from './layouts/ChronicleLayout';
import GalleryLayout from './layouts/GalleryLayout';
import MinimalLayout from './layouts/MinimalLayout';

export type JamLayoutType = 'monolith' | 'chronicle' | 'gallery' | 'minimal';

interface JamLayoutRendererProps {
  layout: JamLayoutType;
  jam: AppProject;
  onClose: () => void;
  isLoggedIn: boolean;
  onAuthTrigger?: () => void;
  isOwner?: boolean;
  onManageJam?: () => void;
}

const JamLayoutRenderer: React.FC<JamLayoutRendererProps> = ({
  layout,
  jam,
  onClose,
  isLoggedIn,
  onAuthTrigger,
  isOwner,
  onManageJam
}) => {
  switch (layout) {
    case 'chronicle':
      return (
        <ChronicleLayout
          project={jam}
          onClose={onClose}
          isLoggedIn={isLoggedIn}
          onAuthTrigger={onAuthTrigger}
          isOwner={isOwner}
          onManageJam={onManageJam}
        />
      );
    case 'gallery':
      return (
        <GalleryLayout
          project={jam}
          onClose={onClose}
          isLoggedIn={isLoggedIn}
          onAuthTrigger={onAuthTrigger}
          isOwner={isOwner}
          onManageJam={onManageJam}
        />
      );
    case 'minimal':
      return (
        <MinimalLayout
          project={jam}
          onClose={onClose}
          isLoggedIn={isLoggedIn}
          onAuthTrigger={onAuthTrigger}
          isOwner={isOwner}
          onManageJam={onManageJam}
        />
      );
    case 'monolith':
    default:
      return (
        <MonolithLayout
          project={jam}
          onClose={onClose}
          isLoggedIn={isLoggedIn}
          onAuthTrigger={onAuthTrigger}
          isOwner={isOwner}
          onManageJam={onManageJam}
        />
      );
  }
};

export default JamLayoutRenderer;
