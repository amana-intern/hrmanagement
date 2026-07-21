import StatsCard from '../components/StatsCard/StatsCard';

export default function BerandaPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-800 mb-2">Halo, Karyawan!</h1>
      <p className="text-gray-600 mb-8">Ini adalah dasbor informasi personal Anda.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatsCard 
          title="Sisa Cuti Tahunan" 
          value={12} 
          description="Akan di-reset tahun depan" 
        />
        <StatsCard 
          title="Status Kontrak" 
          value="Aktif" 
          description="Berlaku hingga 2027" 
        />
      </div>
    </div>
  );
}