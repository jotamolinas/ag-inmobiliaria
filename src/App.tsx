/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  PhoneCall,
  X
} from 'lucide-react';
import AcarayLandingPage from './components/AcarayLandingPage';
import AdminPanel from './components/AdminPanel';
import { COPY_BLOCKS } from './data';
import { CopyBlock } from './types';

export default function App() {
  // Global States configured to default production specifications
  const [agentName] = useState<string>('Sara Genes');
  const [whatsappNumber] = useState<string>('595973821270');
  const [monthlyPayment] = useState<number>(1300000);
  const [downPayment] = useState<number>(0);
  const [customBlocks] = useState<CopyBlock[]>(COPY_BLOCKS);
  
  // Custom theme configured to Quinta Verde (Forest) - Natural and Harmonious
  const [theme] = useState<'forest' | 'midnight' | 'minimalist'>('forest');

  // SPA Hash & Path Routing State for Admin Control Panel
  const [isAdminView, setIsAdminView] = useState(false);

  useEffect(() => {
    const handleUrlChange = () => {
      const isHashAdmin = window.location.hash === '#admin';
      const isQueryAdmin = window.location.search.includes('admin=true');
      const isPathAdmin = window.location.pathname === '/admin' || window.location.pathname === '/admin/';
      setIsAdminView(isHashAdmin || isQueryAdmin || isPathAdmin);
    };

    // Run once on load
    handleUrlChange();

    window.addEventListener('hashchange', handleUrlChange);
    window.addEventListener('popstate', handleUrlChange);
    return () => {
      window.removeEventListener('hashchange', handleUrlChange);
      window.removeEventListener('popstate', handleUrlChange);
    };
  }, []);

  const handleSimulateLead = (ctaType: string, message: string) => {
    // Direct production console logging instead of popup alerts/warnings
    console.log(`Lead Inquiry: ${ctaType} - ${message}`);
  };

  return (
    <div id="production-landing-root" className="w-full min-h-screen bg-stone-50 select-none selection:bg-emerald-800 selection:text-white overflow-x-hidden">
      
      {isAdminView ? (
        /* Dark immersive background dedicated exclusively to Administrative Panel */
        <div className="w-full min-h-screen lg:h-screen bg-stone-950 p-2 md:p-4 select-text lg:overflow-hidden">
          <AdminPanel 
            onClose={() => {
              window.location.hash = ''; // Clear hash, triggers auto-refreshing of landing page view
              // If loaded via /admin pathname, return cleanly to homepage
              if (window.location.pathname === '/admin' || window.location.pathname === '/admin/') {
                window.history.pushState({}, '', '/');
              }
              // If loaded via query string, we also rewrite search history safely
              if (window.location.search.includes('admin=true')) {
                const cleanUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
                window.history.pushState({ path: cleanUrl }, '', cleanUrl);
              }
              setIsAdminView(false);
            }} 
          />
        </div>
      ) : (
        /* Pristine Master Landing Page Rendering */
        <AcarayLandingPage 
          monthlyPayment={monthlyPayment}
          downPayment={downPayment}
          whatsappNumber={whatsappNumber}
          agentName={agentName}
          customBlocks={customBlocks}
          theme={theme}
          onSimulateLead={handleSimulateLead}
        />
      )}
    </div>
  );
}
