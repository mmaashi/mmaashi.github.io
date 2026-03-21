'use client';

import { useState, useEffect } from 'react';
import { Calculator, CheckCircle } from 'lucide-react';

interface ZakatCalculatorProps {
  locale: string;
}

export function ZakatCalculator({ locale }: ZakatCalculatorProps) {
  const isAr = locale === 'ar';
  const [portfolioValue, setPortfolioValue] = useState<number>(0);
  const [zakatAmount, setZakatAmount] = useState<number>(0);
  const [isEligible, setIsEligible] = useState<boolean>(false);

  const NISAB_THRESHOLD = 28000; // SAR equivalent for ~85g gold
  const ZAKAT_RATE = 0.025; // 2.5%

  useEffect(() => {
    const eligible = portfolioValue >= NISAB_THRESHOLD;
    setIsEligible(eligible);
    setZakatAmount(eligible ? portfolioValue * ZAKAT_RATE : 0);
  }, [portfolioValue]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value) || 0;
    setPortfolioValue(value);
  };

  const getHijriYear = () => {
    const gregorianYear = new Date().getFullYear();
    const hijriYear = Math.floor((gregorianYear - 622) * 1.030684);
    return hijriYear;
  };

  return (
    <div
      style={{
        backgroundColor: 'var(--c-elevated)',
        borderRadius: '12px',
        padding: '32px',
        border: '1px solid var(--c-border)',
        maxWidth: '600px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <Calculator
          size={28}
          style={{ color: 'var(--c-gold)' }}
        />
        <h3
          style={{
            fontFamily: 'var(--font-grotesk)',
            fontSize: '20px',
            fontWeight: '600',
            color: 'var(--c-text)',
            margin: '0',
          }}
        >
          {isAr ? 'حاسبة الزكاة' : 'Zakat Calculator'}
        </h3>
      </div>

      <p
        style={{
          fontSize: '14px',
          color: 'var(--c-muted)',
          marginBottom: '20px',
          lineHeight: '1.6',
        }}
      >
        {isAr
          ? `الزكاة 2.5٪ من ثروتك تؤدى سنوياً. الحد الأدنى للزكاة (النصاب) هو حوالي ٢٨,٠٠٠ ريال سعودي (ما يعادل ٨٥ جراماً من الذهب).`
          : `Zakat is 2.5% of your wealth paid annually. The minimum threshold (Nisab) is approximately SAR 28,000 (equivalent to ~85g of gold).`}
      </p>

      <div style={{ marginBottom: '24px' }}>
        <label
          style={{
            display: 'block',
            fontSize: '14px',
            fontWeight: '500',
            color: 'var(--c-text)',
            marginBottom: '8px',
          }}
        >
          {isAr ? 'قيمة المحفظة (SAR)' : 'Portfolio Value (SAR)'}
        </label>
        <input
          type="number"
          value={portfolioValue || ''}
          onChange={handleInputChange}
          placeholder={isAr ? 'أدخل القيمة' : 'Enter amount'}
          style={{
            width: '100%',
            padding: '12px 16px',
            fontSize: '16px',
            backgroundColor: 'var(--c-surface)',
            border: '1px solid var(--c-border)',
            borderRadius: '8px',
            color: 'var(--c-text)',
            boxSizing: 'border-box',
          }}
        />
      </div>

      {portfolioValue > 0 && (
        <div
          style={{
            backgroundColor: 'var(--c-surface)',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '20px',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '8px',
            }}
          >
            <span style={{ fontSize: '14px', color: 'var(--c-muted)' }}>
              {isAr ? 'النصاب (الحد الأدنى)' : 'Nisab Threshold'}
            </span>
            <span style={{ fontSize: '14px', color: 'var(--c-text)', fontWeight: '500' }}>
              ٢٨,٠٠٠ SAR
            </span>
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              paddingBottom: '8px',
              borderBottom: '1px solid var(--c-border)',
            }}
          >
            <span style={{ fontSize: '14px', color: 'var(--c-muted)' }}>
              {isAr ? 'الحالة' : 'Status'}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {isEligible ? (
                <>
                  <CheckCircle size={16} style={{ color: 'var(--c-green)' }} />
                  <span style={{ fontSize: '14px', color: 'var(--c-green)', fontWeight: '500' }}>
                    {isAr ? 'مؤهل' : 'Eligible'}
                  </span>
                </>
              ) : (
                <>
                  <span style={{ fontSize: '12px', color: 'var(--c-muted)' }}>●</span>
                  <span style={{ fontSize: '14px', color: 'var(--c-muted)' }}>
                    {isAr ? 'أقل من النصاب' : 'Below Nisab'}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {isEligible && (
        <div
          style={{
            backgroundColor: 'rgba(212, 175, 55, 0.08)',
            borderLeft: '4px solid var(--c-gold)',
            borderRadius: '8px',
            padding: '20px',
            marginBottom: '20px',
          }}
        >
          <p style={{ fontSize: '12px', color: 'var(--c-muted)', margin: '0 0 12px 0' }}>
            {isAr
              ? `السنة الهجرية: ${getHijriYear()}`
              : `Islamic Year (Hijri): ${getHijriYear()}`}
          </p>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span style={{ fontSize: '12px', color: 'var(--c-muted)' }}>
              {isAr ? 'مبلغ الزكاة المستحقة' : 'Zakat Due'}
            </span>
            <span
              className="font-num"
              style={{
                fontSize: '32px',
                fontWeight: '700',
                color: 'var(--c-gold)',
              }}
            >
              {zakatAmount.toLocaleString('ar-SA', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
            <span style={{ fontSize: '14px', color: 'var(--c-muted)' }}>SAR</span>
          </div>
        </div>
      )}

      <p
        style={{
          fontSize: '12px',
          color: 'var(--c-muted)',
          margin: '0',
          lineHeight: '1.5',
        }}
      >
        {isAr
          ? '💡 يجب أن تكون أموالك مملوكة لسنة قمرية كاملة قبل دفع الزكاة. استشر مختص شرعي لتطبيق الأحكام وفقاً لمذهبك.'
          : '💡 Your wealth must be held for a complete lunar year before Zakat is due. Consult a Shariah scholar for personalized guidance.'}
      </p>
    </div>
  );
}
