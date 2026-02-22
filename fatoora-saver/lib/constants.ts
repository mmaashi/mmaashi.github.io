// Design Tokens
export const COLORS = {
  PRIMARY_BLUE: '#1E3A5F',
  TEAL: '#2EC4B6',
  BACKGROUND: '#FFFFFF',
  TEXT_DARK: '#1F2937',
  TEXT_LIGHT: '#6B7280',
  BORDER: '#E5E7EB',
  SUCCESS: '#10B981',
  ERROR: '#EF4444',
  WARNING: '#F59E0B',
};

// Pricing Plans
export const PRICING_PLANS = [
  {
    name: 'Free',
    nameAr: 'مجاني',
    price: 0,
    currency: 'SAR',
    invoicesPerMonth: 10,
    features: [
      ' 10 invoices per month',
      'Basic dashboard',
      'Email support',
    ],
    featuresAr: [
      '10 فواتير شهرياً',
      'لوحة تحكم أساسية',
      'دعم البريد الإلكتروني',
    ],
  },
  {
    name: 'Pro',
    nameAr: 'احترافي',
    price: 99,
    currency: 'SAR',
    invoicesPerMonth: 100,
    features: [
      '100 invoices per month',
      'Advanced dashboard',
      'Priority email support',
      'Custom branding',
    ],
    featuresAr: [
      '100 فاتورة شهرياً',
      'لوحة تحكم متقدمة',
      'دعم البريد الإلكتروني الأولوي',
      'العلامة التجارية المخصصة',
    ],
    highlighted: true,
  },
  {
    name: 'Business',
    nameAr: 'للشركات',
    price: 499,
    currency: 'SAR',
    invoicesPerMonth: 'Unlimited',
    features: [
      'Unlimited invoices',
      'API access',
      'Multiple users',
      'Dedicated support',
      'Custom integration',
    ],
    featuresAr: [
      'فواتير غير محدودة',
      'الوصول إلى API',
      'مستخدمون متعددون',
      'دعم مخصص',
      'تكامل مخصص',
    ],
  },
];

// How it works steps
export const HOW_IT_WORKS = [
  {
    step: 1,
    title: 'Sign Up',
    titleAr: 'التسجيل',
    description: 'Create your account and add your business details',
    descriptionAr: 'أنشئ حسابك وأضف تفاصيل عملك',
  },
  {
    step: 2,
    title: 'Connect WhatsApp',
    titleAr: 'توصيل واتساب',
    description: 'Scan QR code to connect your WhatsApp',
    descriptionAr: 'امسح رمز QR لربط واتساب الخاص بك',
  },
  {
    step: 3,
    title: 'Send Message',
    titleAr: 'إرسال رسالة',
    description: 'Message the bot with invoice details',
    descriptionAr: 'أرسل رسالة للروبوت تتضمن تفاصيل الفاتورة',
  },
  {
    step: 4,
    title: 'Done!',
    titleAr: 'تم!',
    description: 'Get ZATCA-compliant invoice instantly',
    descriptionAr: 'احصل على فاتورة متوافقة مع فاتورة الآن',
  },
];

// FAQ
export const FAQ = [
  {
    question: 'What is Fatoora Saver?',
    questionAr: 'ما هي فاتورة سيفر؟',
    answer: 'Fatoora Saver is a WhatsApp-based e-invoicing platform that helps Saudi businesses create ZATCA-compliant invoices easily.',
    answerAr: 'فاتورة سيفر هي منصة إصدار فواتير قائمة على واتساب تساعد الشركات السعودية على إنشاء فواتير متوافقة مع فاتورة بسهولة.',
  },
  {
    question: 'Is my data secure?',
    questionAr: 'هل بياناتي آمنة؟',
    answer: 'Yes, we use industry-standard encryption and Supabase for secure data storage.',
    answerAr: 'نعم، نستخدم التشفير من الدرجة الصناعية و Supabase لتخزين البيانات بأمان.',
  },
  {
    question: 'Can I use it without WhatsApp?',
    questionAr: 'هل يمكنني استخدامه بدون واتساب؟',
    answer: 'Yes, you can create invoices directly from the dashboard as well.',
    answerAr: 'نعم، يمكنك إنشاء الفواتير مباشرة من لوحة التحكم أيضاً.',
  },
  {
    question: 'What is ZATCA compliance?',
    questionAr: 'ما هي متطلبات فاتورة (ZATCA)؟',
    answer: 'ZATCA (Zakat, Tax and Customs Authority) requires all Saudi businesses to issue e-invoices with specific XML format and digital signatures.',
    answerAr: 'تتطلب هيئة الزكاة والضريبة والجمارك من جميع الشركات السعودية إصدار فواتير إلكترونية بصيغة XML محددة وتوقيع رقمي.',
  },
];
