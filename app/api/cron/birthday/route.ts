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

    // 1. Validasi webhook URL sebelum loop
    const webhookUrl = process.env.GOOGLE_CHAT_WEBHOOK_URL;
    if (!webhookUrl) {
      console.error('GOOGLE_CHAT_WEBHOOK_URL not configured');
      return NextResponse.json({ success: false, error: 'Webhook URL not configured' }, { status: 500 });
    }

    if (birthdays.length === 0) {
      console.log('No birthdays today.');
      return NextResponse.json({ success: true, message: 'No birthdays today.', sent: 0, failed: 0 });
    }

    // 3. Logging: daftar orang yang ulang tahun hari ini
    const names = birthdays.map((p) => p.nama ?? p.idKaryawan);
    console.log(`Found ${birthdays.length} birthday(s): ${names.join(', ')}`);

    // Pakai model Gemini versi terbaru yang selalu didukung
    const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });

    let sentCount = 0;
    let failedCount = 0;

    // 2. Try/catch per orang agar 1 error tidak hentikan yang lain
    for (const person of birthdays) {
      const nama = person.nama ?? 'teman kita';
      const grade = person.masterGrade?.namaGrade ? ` (${person.masterGrade.namaGrade})` : '';

      try {
        // Beri perintah (prompt) ke AI untuk merangkai kalimatnya
        const prompt = `buatkan ucapan selamat ulang tahun berbahasa indonesia untuk salah satu karyawan bernama ${nama}${grade}. Buat pesannya unik, kreatif, tidak kaku. berikan juga doa semoga bertambah rezeki, selalu diberi kesehatan dan doa baik lainnya. Gunakan emoji yang pas. Jangan terlalu panjang, maksimal 2 sampai 3 kalimat saja.`;

        const aiResult = await model.generateContent(prompt);
        let generatedMessage = aiResult.response.text();

        // 4. Validasi AI response — fallback jika kosong
        if (!generatedMessage || generatedMessage.trim().length === 0) {
          console.warn(`AI returned empty message for ${nama}, using fallback`);
          generatedMessage = `Selamat Ulang Tahun, ${nama}! 🎂 Semoga di usia baru ini, selalu diberi kesehatan, rezeki yang berlimpah, dan kebahagiaan. Terus menjadi bagian terbaik dari tim kita! 🤲✨`;
        }

        // Kirim teks buatan AI ke Google Chat
        const response = await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: generatedMessage }),
        });

        if (!response.ok) {
          throw new Error(`Webhook returned ${response.status}: ${response.statusText}`);
        }

        // 3. Logging: success
        console.log(`✅ Sent to ${nama}`);
        sentCount++;
      } catch (err) {
        // 2. Error handling per orang + 3. Logging: failed
        console.error(`❌ Failed for ${nama}:`, err);
        failedCount++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Birthday check completed.`,
      sent: sentCount,
      failed: failedCount,
      names,
    });
  } catch (error) {
    console.error('Error broadcasting birthday:', error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
