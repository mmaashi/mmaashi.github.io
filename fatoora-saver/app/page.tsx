import Link from 'next/link';
import { HOW_IT_WORKS, PRICING_PLANS, FAQ } from '@/lib/constants';

export default function Home() {
  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-blue-600 to-blue-700 text-white py-20 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            فاتورة سيفر
          </h1>
          <h2 className="text-2xl md:text-3xl font-semibold mb-6 text-blue-100">
            إنشاء فواتير متوافقة مع فاتورة عبر WhatsApp
          </h2>
          <p className="text-lg text-blue-100 mb-8 max-w-2xl mx-auto">
            أداة بسيطة وآمنة لإنشاء فواتير إلكترونية متوافقة مع متطلبات هيئة الزكاة والضريبة والجمارك
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link
              href="/signup"
              className="px-8 py-3 bg-white text-blue-600 font-semibold rounded-lg hover:bg-gray-100 transition"
            >
              ابدأ تجربتك المجانية
            </Link>
            <Link
              href="/demo"
              className="px-8 py-3 border-2 border-white text-white font-semibold rounded-lg hover:bg-white hover:text-blue-600 transition"
            >
              شاهد عرض توضيحي
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-16">كيف يعمل</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {HOW_IT_WORKS.map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                  {item.step}
                </div>
                <h3 className="font-bold text-lg mb-2">{item.titleAr}</h3>
                <p className="text-gray-600">{item.descriptionAr}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-16">خطط الأسعار</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {PRICING_PLANS.map((plan) => (
              <div
                key={plan.nameAr}
                className={`rounded-lg border-2 p-8 ${
                  plan.highlighted
                    ? 'border-blue-600 bg-blue-50 shadow-lg'
                    : 'border-gray-200 bg-white'
                }`}
              >
                {plan.highlighted && (
                  <div className="text-center mb-4">
                    <span className="bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                      الخطة الموصى بها
                    </span>
                  </div>
                )}
                <h3 className="text-2xl font-bold mb-2">{plan.nameAr}</h3>
                <div className="mb-6">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-gray-600 mr-2">{plan.currency}</span>
                  <span className="text-gray-600">/شهر</span>
                </div>
                <p className="text-gray-600 mb-6">
                  {typeof plan.invoicesPerMonth === 'number'
                    ? `${plan.invoicesPerMonth} فاتورة/شهر`
                    : plan.invoicesPerMonth}
                </p>
                <button
                  className={`w-full py-3 rounded-lg font-semibold mb-8 transition ${
                    plan.highlighted
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'border-2 border-blue-600 text-blue-600 hover:bg-blue-50'
                  }`}
                >
                  اختر هذه الخطة
                </button>
                <ul className="space-y-3">
                  {plan.featuresAr.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <span className="text-green-600 font-bold">✓</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-16">الأسئلة الشائعة</h2>
          <div className="space-y-6">
            {FAQ.map((item, index) => (
              <details
                key={index}
                className="border-2 border-gray-200 rounded-lg p-6 hover:border-blue-600 transition cursor-pointer"
              >
                <summary className="font-bold text-lg">{item.questionAr}</summary>
                <p className="mt-4 text-gray-700">{item.answerAr}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-blue-600 text-white py-20 px-4 text-center">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-6">جاهز للبدء؟</h2>
          <p className="text-lg mb-8 text-blue-100">
            انضم إلى آلاف الشركات السعودية التي تستخدم فاتورة سيفر
          </p>
          <Link
            href="/signup"
            className="px-8 py-3 bg-white text-blue-600 font-semibold rounded-lg hover:bg-gray-100 transition inline-block"
          >
            ابدأ تجربتك المجانية الآن
          </Link>
        </div>
      </section>
    </div>
  );
}
