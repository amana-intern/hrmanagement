import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { prisma } from '@/lib/prisma';

// Inisiasi otak AI (Gemini)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Tanggal hari ini di timezone Asia/Jakarta (WIB)
    const jakartaParts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Jakarta',
      month: 'numeric',
      day: 'numeric',
    }).formatToParts(new Date());
    const currentMonth = Number(jakartaParts.find((p) => p.type === 'month')?.value ?? 0);
    const currentDay = Number(jakartaParts.find((p) => p.type === 'day')?.value ?? 0);

    // Ambil semua karyawan yang punya tanggal lahir (dari schema Prisma `Karyawan`)
    const karyawan = await prisma.karyawan.findMany({
      where: { tanggalLahir: { not: null } },
      include: { masterGrade: true },
    });

    // Filter yang ulang tahun hari ini (kolom @db.Date -> UTC midnight, pakai getUTC*)
    const birthdays = karyawan.filter((k) => {
      const tgl = k.tanggalLahir!;
      return tgl.getUTCMonth() + 1 === currentMonth && tgl.getUTCDate() === currentDay;
    });

    if (birthdays.length > 0) {
      const webhookUrl = process.env.GOOGLE_CHAT_WEBHOOK_URL;

      // Pakai model Gemini versi terbaru yang selalu didukung
      const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });

      for (const person of birthdays) {
        const nama = person.nama ?? 'teman kita';
        const grade = person.masterGrade?.namaGrade ? ` (${person.masterGrade.namaGrade})` : '';

        // Beri perintah (prompt) ke AI untuk merangkai kalimatnya
        const prompt = `buatkan ucapan selamat ulang tahun berbahasa indonesia untuk salah satu anggota keluarga bernama ${nama}${grade}. Buat pesannya unik, kreatif, tidak kaku, serta mengingatkan bahwa bertambahnya umur semoga bertambah juga keimanan dan ketakwaan kepada tuhan yang maha esa. berikan juga doa semoga bertambah rezeki, selalu diberi kesehatan dan doa baik lainnya. Gunakan emoji yang pas. Jangan terlalu panjang, maksimal 2 sampai 3 kalimat saja.`;

        const aiResult = await model.generateContent(prompt);
        const generatedMessage = aiResult.response.text();

        // Kirim teks buatan AI ke Google Chat
        await fetch(webhookUrl!, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: generatedMessage }),
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Birthday check completed. Found ${birthdays.length} birthday(s) and sent dynamic AI messages.`,
    });
  } catch (error) {
    console.error('Error broadcasting birthday:', error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
