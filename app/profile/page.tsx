import SidebarUser from '../components/Sidebar/SidebarUser/Sidebaruser';
import SidebarHR from '../components/Sidebar/SidebarHR/Sidebarhr';
import SidebarOPS from '../components/Sidebar/SidebarOPS/Sidebarops';
import SidebarSuperAdmin from '../components/Sidebar/SidebarSuperAdmin/Sidebarsuperadmin';

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string }>;
}) {
  const resolvedParams = await searchParams;
  const role = resolvedParams.role || 'user';

  const renderSidebar = () => {
    switch (role) {
      case 'hr':
        return <SidebarHR />;
      case 'ops':
        return <SidebarOPS />;
      case 'super':
        return <SidebarSuperAdmin />;
      default:
        return <SidebarUser />;
    }
  };

  return (
    <div className="flex w-full min-h-screen bg-amana-white font-sans">
      
      {renderSidebar()}

      <main className="flex-1 p-8 text-amana-blue overflow-x-hidden flex justify-center">
        <div className="w-full max-w-5xl mt-4">
          
          <h1 className="text-2xl font-semibold mb-8 border-b-2 border-amana-blue pb-2 inline-block">
            Profile - {role.toUpperCase()}
          </h1>

          <div className="w-full bg-white p-8 rounded-2xl shadow-lg flex flex-col md:flex-row gap-10 items-start">
            
            <div className="flex-shrink-0 flex flex-col items-center">
              <div className="w-48 h-64 bg-amana-sec-6 rounded-xl overflow-hidden border-2 border-amana-blue shadow-md flex items-center justify-center">
                <img 
                  src="/rafael.jpg" 
                  alt="Foto Profil" 
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            <div className="flex-1 w-full flex flex-col gap-6">
              
              <h2 className="text-4xl font-bold">Halo AmanaLicious!</h2>

              <div className="border-2 border-amana-blue rounded-xl p-6 relative bg-white shadow-sm hover:shadow-md transition-shadow">
                <h3 className="text-2xl font-bold leading-tight mb-8">
                  {role === 'hr' ? 'HR Specialist' : role === 'ops' ? 'Operations Staff' : role === 'super' ? 'Super Administrator' : 'Intern Software Eng.'}
                </h3>
                <p className="text-sm font-medium text-amana-sec-7-5">
                  Kontrak Sampai : 13/10/2026
                </p>
              </div>

              <div className="border-2 border-amana-blue rounded-xl p-6 bg-white shadow-sm hover:shadow-md transition-shadow">
                <h3 className="text-xl font-bold mb-4">Sisa Cuti</h3>
                
                <div className="flex gap-4 md:gap-8">
                  
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-20 h-14 border-2 border-amana-blue rounded-lg flex items-center justify-center text-2xl font-bold bg-amana-white">
                      12
                    </div>
                    <span className="text-xs font-semibold text-center">Paid Leave</span>
                  </div>

                  <div className="flex flex-col items-center gap-2">
                    <div className="w-20 h-14 border-2 border-amana-blue rounded-lg flex items-center justify-center text-2xl font-bold bg-amana-white">
                      0
                    </div>
                    <span className="text-xs font-semibold text-center">Special Leave</span>
                  </div>

                  <div className="flex flex-col items-center gap-2">
                    <div className="w-20 h-14 border-2 border-amana-blue rounded-lg flex items-center justify-center text-2xl font-bold bg-amana-white">
                      0
                    </div>
                    <span className="text-xs font-semibold text-center">Unpaid Leave</span>
                  </div>

                </div>
              </div>

            </div>
          </div>

        </div>
      </main>
    </div>
  );
}