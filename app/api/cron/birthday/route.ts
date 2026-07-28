import { NextResponse } from 'next/server';
import { Pool } from 'pg';
import { GoogleGenerativeAI } from '@google/generative-ai';

// 1. Inisiasi koneksi database
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// 2. Inisiasi otak AI (Gemini)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function GET(request: Request) {
  try {
    const now = new Date();
    const jakartaTime = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Jakarta" }));
    const currentMonth = jakartaTime.getMonth() + 1;
    const currentDay = jakartaTime.getDate();

    // Query ke database
    const query = `
      SELECT full_name, grade 
      FROM employees 
      WHERE EXTRACT(MONTH FROM date_of_birth) = $1 
        AND EXTRACT(DAY FROM date_of_birth) = $2
    `;
    const result = await pool.query(query, [currentMonth, currentDay]);
    const birthdays = result.rows;

    if (birthdays.length > 0) {
      const webhookUrl = process.env.GOOGLE_CHAT_WEBHOOK_URL;
      
      // Pakai model Gemini versi terbaru yang selalu didukung
      const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
      
      for (const person of birthdays) {
        // 3. Kita kasih perintah (prompt) ke AI untuk merangkai kalimatnya
        const prompt = `Buatkan satu pesan ucapan ulang tahun yang asik, ramah, dan seru dalam bahasa Indonesia untuk rekan kerja bernama ${person.full_name} dengan jabatan ${person.grade} di perusahaan AMANA Solutions. Buat pesannya unik, kreatif, dan tidak kaku. Gunakan emoji yang pas. Jangan terlalu panjang, maksimal 2 sampai 3 kalimat saja.`;
        
        // AI mulai berpikir dan men-generate teks
        const aiResult = await model.generateContent(prompt);
        const generatedMessage = aiResult.response.text();
        
        const message = {
          text: generatedMessage
        };

        // 4. Kirim teks buatan AI ke Google Chat
        await fetch(webhookUrl!, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(message),
        });
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `Birthday check completed. Found ${birthdays.length} birthday(s) and sent dynamic AI messages.` 
    });
  } catch (error) {
    console.error("Error broadcasting birthday:", error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}