import SidebarUser from '../../components/Sidebar/SidebarUser/Sidebaruser';

export default function ProfileUserPage() {
  const role = 'user';

  return (
    <div className="flex w-full min-h-screen bg-amana-white font-sans">
      
      <SidebarUser />

      <main className="flex-1 p-8 text-amana-blue overflow-x-hidden flex justify-center">
        <div className="w-full max-w-5xl mt-4">
          
          <h1 className="text-2xl font-semibold mb-8 border-b-2 border-amana-blue pb-2 inline-block">
            Profile
          </h1>

          <div className="w-full bg-white p-8 rounded-2xl shadow-lg flex flex-col md:flex-row gap-10 items-start">
            
            <div className="flex-shrink-0 flex flex-col items-center">
              <div className="w-48 h-64 bg-amana-sec-6 rounded-xl overflow-hidden border-2 border-amana-blue shadow-md flex items-center justify-center">
                <img 
                  src="/PlaceholderPP.png" 
                  alt="Foto Profil" 
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            <div className="flex-1 w-full flex flex-col gap-6">
              
              <h2 className="text-4xl font-bold">Halo Rafael!</h2>

              <div className="border-2 border-amana-blue rounded-xl p-6 relative bg-white shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between h-full">
                
                {/* Divisi & Role dibuat mepet dengan gap-1 */}
                <div className="flex flex-col gap-1 mb-6">
                  <h3 className="text-2xl font-bold leading-tight">
                    Intern
                  </h3>
                  <h3 className="text-2xl font-regular leading-tight">
                    Software Engineer
                  </h3>
                </div>

                <p className="text-sm font-medium pt-4 border-t border-slate-100">
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