import Link from 'next/link';

export default function Sidebar() {
  return (
    <aside className="w-64 h-screen bg-gray-900 text-white flex flex-col p-4 fixed">
      <h2 className="text-2xl font-bold mb-8 text-blue-400">AMANA HR</h2>
      <nav className="flex flex-col gap-4">
        <Link href="/beranda" className="hover:bg-gray-800 p-2 rounded transition">
          Beranda / Dashboard
        </Link>
        <Link href="/cuti" className="hover:bg-gray-800 p-2 rounded transition">
          Pengajuan Cuti
        </Link>
        <Link href="/izin-sakit" className="hover:bg-gray-800 p-2 rounded transition">
          Izin Sakit
        </Link>
      </nav>
    </aside>
  );
}