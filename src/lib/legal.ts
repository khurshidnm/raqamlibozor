export interface LegalDoc {
  slug: string;
  title: string;
  description: string;
  updated: string;
  sections: { heading: string; paragraphs: string[] }[];
}

/** Draft legal texts for the default (uz) locale. Have a lawyer review them before launch. */
export const legalDocs: Record<'oferta' | 'maxfiylik', LegalDoc> = {
  oferta: {
    slug: 'oferta',
    title: 'Ommaviy oferta',
    description: 'Raqamli Bozor xizmatlaridan foydalanish shartlari.',
    updated: '2026-10-09',
    sections: [
      {
        heading: '1. Umumiy qoidalar',
        paragraphs: [
          'Ushbu hujjat RealSoft (keyingi oʻrinlarda — «Ijrochi») tomonidan ishlab chiqilgan Raqamli Bozor tizimi xizmatlarini taqdim etish shartlarini belgilaydi.',
          'Buyurtmachi demo soʻrovi yuborganida yoki xizmatdan foydalanishni boshlaganida ushbu shartlarni qabul qilgan hisoblanadi.',
        ],
      },
      {
        heading: '2. Xizmat predmeti',
        paragraphs: [
          'Raqamli Bozor bozorlarni raqamli boshqarish tizimidir: rastalar bandligi, toʻlovlar nazorati, ijara hisobi, avtoturargoh va kamera tahlili hamda hisobotlar.',
          'Xizmatning aniq tarkibi, muddati va narxi tomonlar oʻrtasidagi alohida shartnoma yoki ilovada belgilanadi.',
        ],
      },
      {
        heading: '3. Demo va joriy etish',
        paragraphs: [
          'Demo bepul koʻrsatiladi va majburiyat yuklamaydi. Joriy etish bosqichida mavjud uskunalar (jumladan kameralar) tizimga mosligi tekshiriladi.',
        ],
      },
      {
        heading: '4. Tomonlarning majburiyatlari',
        paragraphs: [
          'Ijrochi xizmatni kelishilgan hajmda va sifatda taqdim etadi hamda maʼlumotlar maxfiyligini taʼminlaydi.',
          'Buyurtmachi toʻgʻri maʼlumot taqdim etadi, kirish huquqlarini uchinchi shaxslarga bermaydi va kelishilgan toʻlovlarni oʻz vaqtida amalga oshiradi.',
        ],
      },
      {
        heading: '5. Javobgarlik',
        paragraphs: [
          'Tomonlar oʻz majburiyatlarini bajarmaganlik uchun Oʻzbekiston Respublikasi qonunchiligiga muvofiq javob beradi. Ijrochi uchinchi tomon xizmatlaridagi uzilishlar uchun javobgar emas.',
        ],
      },
      {
        heading: '6. Yakuniy qoidalar',
        paragraphs: [
          'Ijrochi ushbu shartlarni oʻzgartirish huquqini saqlab qoladi; yangi tahrir saytda eʼlon qilingan paytdan kuchga kiradi. Nizolar muzokaralar orqali, kelisha olmaganda — qonunchilikda belgilangan tartibda hal qilinadi.',
          'Savollar boʻyicha: realsoft.uz.',
        ],
      },
    ],
  },
  maxfiylik: {
    slug: 'maxfiylik',
    title: 'Maxfiylik siyosati',
    description: 'Raqamli Bozor saytida shaxsiy maʼlumotlar qanday yigʻilishi va himoya qilinishi.',
    updated: '2026-10-09',
    sections: [
      {
        heading: '1. Qanday maʼlumotlar yigʻiladi',
        paragraphs: [
          'Qayta aloqa shaklida siz kiritgan telefon raqami, shuningdek soʻrov yuborilgan sahifa va vaqti saqlanadi. Boshqa shaxsiy maʼlumotlar soʻralmaydi.',
        ],
      },
      {
        heading: '2. Nima uchun foydalaniladi',
        paragraphs: [
          'Maʼlumotlar faqat siz bilan bogʻlanish, demo taqdim etish va xizmat haqida maslahat berish uchun ishlatiladi.',
        ],
      },
      {
        heading: '3. Saqlash va himoya',
        paragraphs: [
          'Telefon raqamlari yopiq tizimda saqlanadi va faqat vakolatli xodimlar koʻra oladi. Maʼlumotlar ommaviy omborlarda joylashtirilmaydi va uchinchi shaxslarga sotilmaydi yoki berilmaydi, qonunda nazarda tutilgan hollar bundan mustasno.',
          'Spamdan himoya qilish uchun IP manzil vaqtincha cheklov maqsadida ishlatilishi mumkin.',
        ],
      },
      {
        heading: '4. Cookie va tahlil',
        paragraphs: ['Sayt asosiy ishlashi uchun zarur boʻlmagan reklama cookie fayllaridan foydalanmaydi.'],
      },
      {
        heading: '5. Sizning huquqlaringiz',
        paragraphs: [
          'Siz oʻz maʼlumotlaringiz haqida maʼlumot olish, ularni tuzatish yoki oʻchirishni soʻrash huquqiga egasiz. Buning uchun biz bilan realsoft.uz orqali bogʻlaning.',
        ],
      },
      {
        heading: '6. Oʻzgartirishlar',
        paragraphs: ['Siyosat yangilansa, yangi tahrir shu sahifada eʼlon qilinadi va sana yangilanadi.'],
      },
    ],
  },
};
