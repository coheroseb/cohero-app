'use client';

import React from 'react';

interface MobileNativeLayoutProps {
  children: React.ReactNode;
}

const MobileNativeLayout: React.FC<MobileNativeLayoutProps> = ({ children }) => {
  return <>{children}</>;
};

export default MobileNativeLayout;
