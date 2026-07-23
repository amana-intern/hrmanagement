'use client';

import SidebarPar from '../../components/Sidebar/SidebarOPS/Sidebarops';
import { PageLayout } from '../../components/ui';
import StatCard from '../../components/ui/StatCard';

export default function SuperadminProfilePage() {
  return (
    <PageLayout sidebar={<SidebarPar />}>
      <div className="bg-white border border-amana-sec-6 rounded-2xl p-6 shadow-sm flex flex-col gap-6">
        
        {/* Header & Info Partner */}
        <div className="flex flex-col sm:flex-row gap-6 items-stretch">
          
          {/* Box Profile Image (Ratio 4:5) */}
          <div className="w-40 aspect-[4/5] bg-amana-sec-2/10 border border-amana-sec-6 rounded-2xl flex-shrink-0 overflow-hidden">
            <img 
              src="/PlaceHolderPP.png" 
              alt="Profile Picture" 
              className="w-full h-full object-cover" 
            />
          </div>

          <div className="flex-1 flex flex-col justify-between gap-3">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-amana-blue tracking-tight">Hello, OPS Admin!</h1>
            <div className="bg-white border border-amana-sec-6 rounded-xl p-4 flex flex-col justify-center">
              <h2 className="text-xl font-bold text-amana-blue">Operation Department</h2>
              <p className="text-base font-medium text-amana-sec-7">Operations</p>
            </div>
          </div>
        </div>

        {/* Section Summary */}
        <div className="border border-amana-sec-6 rounded-2xl p-5 flex flex-col gap-4">
          <h3 className="text-xl font-bold text-amana-blue">Summary</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            <div className="bg-amana-sec-2/10 border border-amana-sec-6 rounded-xl min-h-[120px] flex items-center justify-center p-4 text-xs font-medium text-amana-sec-7 text-center">
              Visual / Graphic
            </div>
            <StatCard value={5} label="Total Requests" color="text-amana-blue" />
            <StatCard value={3} label="Pending Review" color="text-amber-500" />
            <StatCard value={1} label="Approved" color="text-emerald-600" />
            <StatCard value={1} label="Rejected" color="text-rose-600" />
          </div>
        </div>

      </div>
    </PageLayout>
  );
}