import GroupBtn from '../components/GroupBtn';

export default function HalamanCuti() {
  return (
    <main className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Daftar Pengajuan Cuti</h1>
        <button className="bg-green-600 text-white px-4 py-2 rounded">
          + Ajukan Cuti Baru
        </button>
      </div>

      <table className="w-full border-collapse border border-gray-200">
        <thead className="bg-black text-white">
          <tr>
            <th className="border p-2">Nama Karyawan</th>
            <th className="border p-2">Mulai - Selesai</th>
            <th className="border p-2">Jenis Cuti</th>
            <th className="border p-2">Aksi</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="border p-2 text-center">Budi Santoso</td>
            <td className="border p-2 text-center">21 Jul - 23 Jul 2026</td>
            <td className="border p-2 text-center">Cuti Tahunan</td>
            <td className="border p-2 flex justify-center">
              <GroupBtn /> 
            </td>
          </tr>
        </tbody>
      </table>
    </main>
  );
}