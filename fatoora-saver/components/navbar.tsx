'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function Navbar() {
  const [language, setLanguage] = useState<'ar' | 'en'>('ar');

  const navItems = {
    ar: [
      { label: 'الرئيسية', href: '/' },
      { label: 'التسعير', href: '/pricing' },
      { label: 'حول', href: '/about' },
      { label: 'تواصل', href: '/contact' },
    ],
    en: [
      { label: 'Home', href: '/' },
      { label: 'Pricing', href: '/pricing' },
      { label: 'About', href: '/about' },
      { label: 'Contact', href: '/contact' },
    ],
  };

  const ctaText = language === 'ar' ? 'ابدأ الآن' : 'Get Started';

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-teal-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">FS</span>
            </div>
            <span className="font-bold text-lg text-gray-900">
              {language === 'ar' ? 'فاتورة سيفر' : 'Fatoora Saver'}
            </span>
          </Link>

          {/* Nav Items */}
          <div className="hidden md:flex items-center gap-8">
            {navItems[language].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-gray-700 hover:text-blue-600 transition"
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* Right side: Language toggle + CTA */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
              className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition"
            >
              {language === 'ar' ? 'EN' : 'العربية'}
            </button>
            <Link
              href="/signup"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
            >
              {ctaText}
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
