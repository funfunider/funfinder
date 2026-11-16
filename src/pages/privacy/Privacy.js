import React from 'react';
import {
  Box,
  Typography,
  Container,
  Paper,
  Divider,
  Link as MuiLink,
} from '@mui/material';
import {
  PrivacyTip,
  Lock,
  Visibility,
  Cookie,
  Policy,
  Person,
  Share,
  DeleteOutline,
} from '@mui/icons-material';
import { useLanguage } from '../../contexts/LanguageContext';

const SECTION_ICONS = [<Person />, <Visibility />, <Share />, <Cookie />, <Lock />, <DeleteOutline />, <Policy />];

const TRANSLATIONS = {
  en: {
    pageTitle: 'Privacy Policy',
    lastUpdated: 'Last updated: 14 January 2026',
    subtitle: 'This policy explains how Funfinder collects, uses, protects, and shares your personal data when you use',
    contactTitle: 'Contact',
    contactSub: 'Questions, requests, or complaints about this policy:',
    sections: [
      {
        title: '1. Information We Collect',
        body: [
          'Account data: name, email, phone number, country, password (stored as a salted hash).',
          'Booking data: events you reserve, dates, number of participants, special notes.',
          'Payment data: handled by our payment processors (Bank of Georgia, Google Pay, Apple Pay). Funfinder never stores your full card number or CVV. We retain only an order ID and a redacted/last-4 reference.',
          'Device & usage data: IP address, browser type, language, pages visited, timestamps. Used for security and analytics.',
          'Location data: only when you explicitly grant browser permission for nearby-activity discovery.',
        ],
      },
      {
        title: '2. How We Use Your Data',
        body: [
          'Process bookings and deliver tickets / confirmations.',
          'Authenticate you and protect your account (login attempts, suspicious activity).',
          'Send transactional emails: order confirmations, payment receipts, ticket QR codes.',
          'Provide customer support when you contact us.',
          'Improve the platform: aggregate, de-identified analytics — never to sell your individual data.',
          'Comply with legal obligations (tax, anti-fraud, lawful requests).',
        ],
      },
      {
        title: '3. Sharing With Third Parties',
        body: [
          'Activity providers: we share booking details necessary to deliver the experience (your name, contact, party size, date).',
          'Payment processors: Bank of Georgia, Google Pay, Apple Pay — they receive only what is required to authorise the transaction.',
          'Email delivery: transactional email service used to send your tickets.',
          'Hosting & infrastructure: cloud providers running the website and database.',
          'Authorities: only when legally required (court order, regulator request).',
          'We do not sell or rent your personal data to advertisers.',
        ],
      },
      {
        title: '4. Cookies & Local Storage',
        body: [
          'Essential cookies: session token, language, currency preference. Required for the site to work.',
          'Analytics cookies: Google Analytics (gtag) — measures aggregate traffic; you can opt out via browser settings.',
          'You can clear cookies at any time from your browser settings. Doing so will sign you out and reset your preferences.',
        ],
      },
      {
        title: '5. Data Security',
        body: [
          'All traffic is served over HTTPS with TLS 1.2+.',
          'Passwords are hashed (never stored in plain text).',
          'Payment data is tokenised by the payment processor — Funfinder does not see card numbers.',
          'Database access is restricted to authorised personnel and audited.',
          'No system is perfectly secure; we promise reasonable safeguards, not absolute protection.',
        ],
      },
      {
        title: '6. Data Retention',
        body: [
          'Account data: kept while your account is active. Delete the account and we erase the personal record (ledger entries needed for tax / accounting are retained per Georgian law, typically 5 years).',
          'Booking and payment records: retained as required by financial regulations (typically 5 years).',
          'Logs: rotated and purged within 12 months unless needed for an active investigation.',
        ],
      },
      {
        title: '7. Your Rights',
        body: [
          'Access: request a copy of the personal data we hold about you.',
          'Rectification: ask us to correct inaccurate or out-of-date data.',
          'Erasure: ask us to delete your data, subject to retention requirements above.',
          'Portability: request an export of your data in a structured format.',
          'Objection: opt out of non-essential analytics.',
          'Withdraw consent: any consent you gave (e.g. location, marketing) can be withdrawn at any time.',
          'To exercise any of these, email info@funfinder.ge from the address tied to your account. We respond within 30 days.',
        ],
      },
    ],
  },
  ka: {
    pageTitle: 'კონფიდენციალურობის პოლიტიკა',
    lastUpdated: 'ბოლო განახლება: 14 იანვარი 2026',
    subtitle: 'ეს პოლიტიკა განმარტავს, თუ როგორ აგროვებს, იყენებს, იცავს და აზიარებს Funfinder თქვენს პერსონალურ მონაცემებს',
    contactTitle: 'კონტაქტი',
    contactSub: 'კითხვები, მოთხოვნები ან საჩივრები ამ პოლიტიკის შესახებ:',
    sections: [
      {
        title: '1. ინფორმაცია, რომელსაც ვაგროვებთ',
        body: [
          'ანგარიშის მონაცემები: სახელი, ელფოსტა, ტელეფონის ნომერი, ქვეყანა, პაროლი.',
          'დაჯავშნის მონაცემები: დაჯავშნილი ღონისძიებები, თარიღები, მონაწილეთა რაოდენობა.',
          'გადახდის მონაცემები: მუშავდება გადახდის პროვაიდერების მიერ (საქართველოს ბანკი, Google Pay, Apple Pay). Funfinder არ ინახავს ბარათის სრულ ნომერს.',
          'მოწყობილობის მონაცემები: IP მისამართი, ბრაუზერის ტიპი, ენა, გვერდების ისტორია.',
          'ლოკაციის მონაცემები: მხოლოდ ბრაუზერის ნებართვის გაცემის შემთხვევაში.',
        ],
      },
      {
        title: '2. როგორ ვიყენებთ თქვენს მონაცემებს',
        body: [
          'ჯავშნების დამუშავება და ბილეთების მიწოდება.',
          'ავტორიზაცია და ანგარიშის უსაფრთხოება.',
          'ტრანზაქციული ელფოსტის გაგზავნა: შეკვეთის დადასტურება, ქვითრები, QR კოდები.',
          'მომხმარებელთა მხარდაჭერა.',
          'პლატფორმის გაუმჯობესება და ანალიტიკა.',
          'საკანონმდებლო ვალდებულებების შესრულება.',
        ],
      },
      {
        title: '3. მესამე მხარეებთან გაზიარება',
        body: [
          'აქტივობის პროვაიდერები: ჯავშნის შესასრულებლად საჭირო დეტალები.',
          'გადახდის პროცესორები: საქართველოს ბანკი, Google Pay, Apple Pay.',
          'ელფოსტის სერვისები: ტრანზაქციული შეტყობინებების გაგზავნისთვის.',
          'ჰოსტინგი და ინფრასტრუქტურა.',
          'ჩვენ არ ვყიდით თქვენს პერსონალურ მონაცემებს.',
        ],
      },
      {
        title: '4. ქუქი-ფაილები და ლოკალური მეხსიერება',
        body: [
          'აუცილებელი ქუქიები: სესიის ტოკენი, ენა, ვალუტა.',
          'ანალიტიკური ქუქიები: Google Analytics.',
          'ქუქიების გასუფთავება შეგიძლიათ ბრაუზერის პარამეტრებიდან.',
        ],
      },
      {
        title: '5. მონაცემთა უსაფრთხოება',
        body: [
          'ყველა ტრაფიკი დაცულია HTTPS და TLS 1.2+ პროტოკოლით.',
          'პაროლები დაშიფრულია (ჰეშირებული).',
          'გადახდის მონაცემები ტოკენიზებულია.',
          'მონაცემთა ბაზაზე წვდომა მკაცრად შეზღუდულია.',
        ],
      },
      {
        title: '6. მონაცემთა შენახვა',
        body: [
          'ანგარიშის მონაცემები: ინახება ანგარიშის აქტიურობის მანძილზე.',
          'ფინანსური ჩანაწერები: ინახება 5 წლის განმავლობაში კანონმდებლობის შესაბამისად.',
        ],
      },
      {
        title: '7. თქვენი უფლებები',
        body: [
          'წვდომა: მოითხოვეთ თქვენი მონაცემების ასლი.',
          'გასწორება: მოითხოვეთ არაზუსტი მონაცემების გასწორება.',
          'წაშლა: მოითხოვეთ მონაცემების წაშლა.',
          'უფლებების გამოსაყენებლად მოგვწერეთ: info@funfinder.ge.',
        ],
      },
    ],
  },
  ru: {
    pageTitle: 'Политика конфиденциальности',
    lastUpdated: 'Последнее обновление: 14 января 2026 г.',
    subtitle: 'Настоящая политика объясняет, как Funfinder собирает, использует и защищает ваши персональные данные',
    contactTitle: 'Контакты',
    contactSub: 'Вопросы и обращения по поводу политики:',
    sections: [
      {
        title: '1. Сбор информации',
        body: [
          'Данные аккаунта: имя, email, телефон, страна, хэш пароля.',
          'Данные бронирования: мероприятия, даты, количество участников.',
          'Платежные данные: обрабатываются платежными системами (Bank of Georgia, Google Pay, Apple Pay).',
          'Данные устройства: IP-адрес, тип браузера, язык, посещенные страницы.',
        ],
      },
      {
        title: '2. Использование данных',
        body: [
          'Обработка бронирований и доставка билетов.',
          'Аутентификация и защита аккаунта.',
          'Отправка транзакционных писем и QR-кодов.',
          'Клиентская поддержка.',
          'Улучшение сервиса и аналитика.',
        ],
      },
      {
        title: '3. Передача третьим лицам',
        body: [
          'Организаторы мероприятий: только необходимые данные для проведения тура.',
          'Платежные процессоры: Bank of Georgia, Google Pay, Apple Pay.',
          'Мы не продаем персональные данные рекламодателям.',
        ],
      },
      {
        title: '4. Cookies и локальное хранилище',
        body: [
          'Обязательные cookies: токен сессии, язык, валюта.',
          'Аналитические cookies: Google Analytics.',
        ],
      },
      {
        title: '5. Безопасность данных',
        body: [
          'Шифрование HTTPS / TLS 1.2+.',
          'Хэширование паролей.',
          'Ограниченный доступ к базам данных.',
        ],
      },
      {
        title: '6. Хранение данных',
        body: [
          'Данные аккаунта хранятся пока аккаунт активен.',
          'Финансовые записи хранятся согласно законам Грузии (5 лет).',
        ],
      },
      {
        title: '7. Ваши права',
        body: [
          'Право на доступ, исправление и удаление данных.',
          'Свяжитесь с нами: info@funfinder.ge.',
        ],
      },
    ],
  },
  hi: {
    pageTitle: 'गोपनीयता नीति',
    lastUpdated: 'अंतिम अद्यतन: 14 जनवरी 2026',
    subtitle: 'यह नीति बताती है कि Funfinder आपके व्यक्तिगत डेटा को कैसे एकत्र, उपयोग और सुरक्षित करता है',
    contactTitle: 'संपर्क',
    contactSub: 'इस नीति के बारे में प्रश्न या अनुरोध:',
    sections: [
      {
        title: '1. जानकारी जो हम एकत्र करते हैं',
        body: [
          'खाता डेटा: नाम, ईमेल, फोन नंबर, देश, पासवर्ड।',
          'बुकिंग डेटा: बुक किए गए इवेंट, तिथियां, प्रतिभागियों की संख्या।',
          'भुगतान डेटा: बैंक ऑफ जॉर्जिया, गूगल पे, एप्पल पे द्वारा संसाधित।',
        ],
      },
      {
        title: '2. हम आपके डेटा का उपयोग कैसे करते हैं',
        body: [
          'बुकिंग संसाधित करना और टिकट प्रदान करना।',
          'खाता प्रमाणीकरण और सुरक्षा।',
          'पुष्टि और क्यूआर कोड ईमेल भेजना।',
        ],
      },
      {
        title: '3. तृतीय पक्षों के साथ साझा करना',
        body: [
          'गतिविधि प्रदाता: बुकिंग पूर्ण करने के लिए आवश्यक विवरण।',
          'हम आपका डेटा विज्ञापनदाताओं को नहीं बेचते हैं।',
        ],
      },
      {
        title: '4. कुकीज़ और स्थानीय भंडारण',
        body: [
          'आवश्यक कुकीज़: भाषा, मुद्रा और सत्र डेटा।',
        ],
      },
      {
        title: '5. डेटा सुरक्षा',
        body: [
          'सभी ट्रैफ़िक HTTPS पर सुरक्षित हैं।',
          'पासवर्ड हैश किए गए हैं।',
        ],
      },
      {
        title: '6. डेटा प्रतिधारण',
        body: [
          'खाता सक्रिय रहने तक डेटा सुरक्षित रखा जाता है।',
        ],
      },
      {
        title: '7. आपके अधिकार',
        body: [
          'अपने डेटा तक पहुँच और हटाने का अनुरोध करें: info@funfinder.ge।',
        ],
      },
    ],
  },
  ar: {
    pageTitle: 'سياسة الخصوصية',
    lastUpdated: 'آخر تحديث: 14 يناير 2026',
    subtitle: 'توضح هذه السياسة كيفية جمع Funfinder لبياناتك الشخصية واستخدامها وحمايتها',
    contactTitle: 'الاتصال',
    contactSub: 'للأسئلة والاستفسارات حول هذه السياسة:',
    sections: [
      {
        title: '1. المعلومات التي نجمعها',
        body: [
          'بيانات الحساب: الاسم ، البريد الإلكتروني ، رقم الهاتف ، الدولة ، كلمة المرور.',
          'بيانات الحجز: الفعاليات الترفيهية ، التواريخ ، عدد المشاركين.',
          'بيانات الدفع: معالجة بواسطة بنك جورجيا ، Google Pay ، Apple Pay.',
        ],
      },
      {
        title: '2. كيفية استخدام بياناتك',
        body: [
          'معالجة الحجوزات وإرسال التذاكر.',
          'حماية الحساب والأمان.',
          'إرسال تأكيدات الطلب ورموز QR.',
        ],
      },
      {
        title: '3. المشاركة مع أطراف ثالثة',
        body: [
          'مقدمو الأنشطة: تفاصيل الحجز الضرورية فقط.',
          'نحن لا نبيع بياناتك الشخصية للمعلنين.',
        ],
      },
      {
        title: '4. ملفات تعريف الارتباط',
        body: [
          'ملفات تعريف الارتباط الأساسية: اللغة ، العملة ، الجلسة.',
        ],
      },
      {
        title: '5. أمان البيانات',
        body: [
          'حماية كاملة عبر HTTPS و TLS 1.2+.',
          'تشفير كلمة المرور.',
        ],
      },
      {
        title: '6. الاحتفاظ بالبيانات',
        body: [
          'يتم الاحتفاظ بالبيانات طالما أن حسابك نشط.',
        ],
      },
      {
        title: '7. حقوقك',
        body: [
          'طلب الوصول إلى البيانات أو حذفها: info@funfinder.ge.',
        ],
      },
    ],
  },
  he: {
    pageTitle: 'מדיניות פרטיות',
    lastUpdated: 'עדכון אחרון: 14 בינואר 2026',
    subtitle: 'מדיניות זו מסבירה כיצד Funfinder אוספת, משתמשת ומגנה על המידע האישי שלך',
    contactTitle: 'צור קשר',
    contactSub: 'לשאלות או פניות בנוגע למדיניות זו:',
    sections: [
      {
        title: '1. מידע שאנו אוספים',
        body: [
          'נתוני חשבון: שם, אימייל, מס"ד טלפון, מדינה, סיסמה מוצפנת.',
          'נתוני הזמנה: אירועים, תאריכים, מספר משתתפים.',
          'נתוני תשלום: מעובדים ע"י מעבדי תשלומים מורשים (Bank of Georgia, Google Pay, Apple Pay).',
        ],
      },
      {
        title: '2. כיצד אנו משתמשים במידע',
        body: [
          'עיבוד הזמנות ואספקת כרטיסים.',
          'אבטחת החשבון ואימות.',
          'שליחת אישורי הזמנה וקודי QR.',
        ],
      },
      {
        title: '3. שיתוף עם צדדים שלישיים',
        body: [
          'ספקי אטרקציות: פרטי הזמנה נדרשים בלבד.',
          'איננו מוכרים את המידע האישי שלך למפרסמים.',
        ],
      },
      {
        title: '4. עוגיות ואחסון מקומי',
        body: [
          'עוגיות חיוניות: שפה, מטבע ונתוני הפעלה.',
        ],
      },
      {
        title: '5. אבטחת מידע',
        body: [
          'תקשורת מוצפנת בתקן HTTPS ו-TLS 1.2+.',
          'הצפנת סיסמאות.',
        ],
      },
      {
        title: '6. שמירת נתונים',
        body: [
          'נתונים נשמרים כל עוד החשבון פעיל.',
        ],
      },
      {
        title: '7. הזכויות שלך',
        body: [
          'בקשת גישה או מחיקת מידע: info@funfinder.ge.',
        ],
      },
    ],
  },
};

const Privacy = () => {
  const { language } = useLanguage();
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;
  const isRtl = language === 'he' || language === 'ar';

  return (
    <Box sx={{ py: 6, backgroundColor: '#f8f9fa', minHeight: '80vh', direction: isRtl ? 'rtl' : 'ltr' }}>
      <Container maxWidth="md">
        <Paper
          elevation={0}
          sx={{
            p: { xs: 3, md: 5 },
            borderRadius: 4,
            border: '1px solid rgba(0,0,0,0.08)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1.5, flexDirection: isRtl ? 'row-reverse' : 'row' }}>
            <PrivacyTip sx={{ fontSize: 40, color: '#87003A' }} />
            <Typography variant="h4" component="h1" sx={{ fontWeight: 800, color: '#87003A' }}>
              {t.pageTitle}
            </Typography>
          </Box>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontWeight: 500 }}>
            {t.lastUpdated}
          </Typography>

          <Typography variant="body1" sx={{ mb: 4, color: '#444', lineHeight: 1.7 }}>
            {t.subtitle}{' '}
            <MuiLink href="https://funfinder.ge" underline="hover" color="#87003A">
              funfinder.ge
            </MuiLink>.
          </Typography>

          <Divider sx={{ mb: 4 }} />

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {t.sections.map((section, idx) => (
              <Box key={section.title}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5, flexDirection: isRtl ? 'row-reverse' : 'row' }}>
                  <Box
                    sx={{
                      width: 36,
                      height: 36,
                      borderRadius: 2,
                      background: 'rgba(135,0,58,0.08)',
                      color: '#87003A',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {SECTION_ICONS[idx] || <Policy />}
                  </Box>
                  <Typography
                    variant="h6"
                    sx={{ fontWeight: 700, color: '#222', fontSize: { xs: '1.05rem', md: '1.2rem' } }}
                  >
                    {section.title}
                  </Typography>
                </Box>
                <Box component="ul" sx={{ pl: isRtl ? 0 : 2.5, pr: isRtl ? 2.5 : 0, m: 0, color: 'text.secondary' }}>
                  {section.body.map((line, i) => (
                    <Box
                      component="li"
                      key={i}
                      sx={{ mb: 0.75, lineHeight: 1.6, fontSize: '0.95rem' }}
                    >
                      {line}
                    </Box>
                  ))}
                </Box>
              </Box>
            ))}
          </Box>

          <Divider sx={{ my: 4 }} />

          <Box
            sx={{
              p: 3,
              borderRadius: 3,
              background: 'linear-gradient(135deg, rgba(135,0,58,0.06), rgba(255,193,7,0.08))',
              border: '1px solid rgba(135,0,58,0.12)',
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#87003A', mb: 1 }}>
              {t.contactTitle}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
              {t.contactSub}
            </Typography>
            <Typography variant="body2">
              Email:{' '}
              <MuiLink href="mailto:info@funfinder.ge" underline="hover" color="#87003A">
                info@funfinder.ge
              </MuiLink>
            </Typography>
            <Typography variant="body2">
              Website:{' '}
              <MuiLink href="https://funfinder.ge" underline="hover" color="#87003A">
                funfinder.ge
              </MuiLink>
            </Typography>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default Privacy;
