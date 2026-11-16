import type { ReactNode } from 'react';
import browser from 'webextension-polyfill';

interface PageContainerProps {
  children: ReactNode;
}

const version = browser.runtime.getManifest().version;

export const PageContainer = ({ children }: PageContainerProps) => (
  <div className="flex flex-col">
    <div className="flex flex-col gap-4">{children}</div>
    <footer className="mt-6 border-t border-slate-700 pt-3 text-center text-xs text-slate-500">
      Version: {version}
    </footer>
  </div>
);
