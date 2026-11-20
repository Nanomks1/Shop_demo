/* ============================================================
   icons.js — أيقونات الأقسام وشريط التنقل (مفرّغة ثنائية Duotone 24×24 حرة بهالة ناعمة)
   الألوان في CIH تتكيّف تلقائياً مع الثيمات الأربع عبر style.css.
   الطبقات: du (ظل داخلي ناعم) · st (خط أساسي) · fl (نقطة/تفصيل ممتلئ)
   ============================================================ */
const CI = {
  /* الهواتف: هاتفان متجاوران */
  cphone: '<rect class="du" x="4" y="4.5" width="10.5" height="15.5" rx="2.4"/><rect class="st" x="9" y="2.5" width="11" height="17.5" rx="2.6"/><path class="st" d="M9 5H6.5A2.5 2.5 0 0 0 4 7.5v10A2.5 2.5 0 0 0 6.5 20H12"/><line class="st" x1="12.8" y1="5.5" x2="16.2" y2="5.5"/><circle class="fl" cx="14.5" cy="16.8" r="1.1"/>',
  /* الأنتي كاس: لوح زجاج حامي مع لمعة ونجمة */
  cglass: '<rect class="du" x="5" y="2.5" width="14" height="19" rx="3"/><rect class="st" x="5" y="2.5" width="14" height="19" rx="3"/><path class="st" d="M8.8 9.5l6.4-3.2M8.8 13.8l6.4-3.2"/><path class="fl" d="M16.5 14l.85 1.75 1.75.85-1.75.85-.85 1.75-.85-1.75-1.75-.85 1.75-.85z"/>',
  /* البوشيط: ظهر بوشيط بحواف حماية ونافذة كاميرا */
  ccase: '<rect class="du" x="5.8" y="3" width="12.4" height="18" rx="3"/><rect class="st" x="5.8" y="3" width="12.4" height="18" rx="3"/><path class="st" d="M4.2 6.8V5A2.5 2.5 0 0 1 6.7 2.5h1.8M19.8 6.8V5a2.5 2.5 0 0 0-2.5-2.5h-1.8M4.2 17.2V19a2.5 2.5 0 0 0 2.5 2.5h1.8M19.8 17.2V19a2.5 2.5 0 0 1-2.5 2.5h-1.8"/><rect class="st" x="8.2" y="5.5" width="4.6" height="4.6" rx="1.2"/>',
  /* الإكسسوارات: رأس شاحن ببرق وكابل ملتف */
  cacc: '<rect class="du" x="4.5" y="5.5" width="10.5" height="10" rx="2.5"/><rect class="st" x="4.5" y="5.5" width="10.5" height="10" rx="2.5"/><path class="st" d="M7.5 5.5V2.8M12 5.5V2.8"/><path class="st" d="M9.8 15.5v2.3a3 3 0 0 0 6 0v-6.3a2.4 2.4 0 0 1 4.8 0v3"/><path class="fl" d="M10.3 7.6L8 10.8h2l-.5 2.6 2.5-3.2h-2z"/>',
  /* التعبئة: شريحة SIM مع أبراج التغطية */
  ctopup: '<path class="du" d="M5 4h7.5L17 8.5V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"/><path class="st" d="M5 4h7.5L17 8.5V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"/><rect class="st" x="6.5" y="11" width="6.5" height="6" rx="1.2"/><path class="st" d="M19.5 19v-4.2M22 19v-7.8"/>',
  /* طلبات الزبائن: زبون مع فقاعة طلب (+) */
  creq: '<circle class="du" cx="8.2" cy="7.8" r="3.2"/><circle class="st" cx="8.2" cy="7.8" r="3.2"/><path class="du" d="M2.6 19.5c0-3 2.5-5.2 5.6-5.2s5.6 2.2 5.6 5.2"/><path class="st" d="M2.6 19.5c0-3 2.5-5.2 5.6-5.2s5.6 2.2 5.6 5.2"/><path class="du" d="M14.2 4.2h5.3a2 2 0 0 1 2 2v3.6a2 2 0 0 1-2 2h-2.6l-2.4 2.1v-2.1a2 2 0 0 1-1.8-2V6.2a2 2 0 0 1 1.5-2z"/><path class="st" d="M14.2 4.2h5.3a2 2 0 0 1 2 2v3.6a2 2 0 0 1-2 2h-2.6l-2.4 2.1v-2.1a2 2 0 0 1-1.8-2V6.2a2 2 0 0 1 1.5-2z"/><path class="st" d="M16.8 6.5v3M15.3 8h3"/>',
  /* شراء مستعمل: هاتف داخل دائرة استبدال (روپريز) */
  cused: '<rect class="du" x="7.5" y="5" width="9" height="14" rx="2.2"/><rect class="st" x="7.5" y="5" width="9" height="14" rx="2.2"/><path class="st" d="M3.2 10.5A8.8 8.8 0 0 1 18.5 5.8"/><path class="st" d="M18.8 3.2v3h-3"/><path class="st" d="M20.8 13.5A8.8 8.8 0 0 1 5.5 18.2"/><path class="st" d="M5.2 20.8v-3h3"/>',
  /* الديون: دفتر الحسابات (الكريدي) */
  cdebt: '<rect class="du" x="5.5" y="3" width="14" height="18" rx="2.5"/><rect class="st" x="5.5" y="3" width="14" height="18" rx="2.5"/><path class="st" d="M3.5 7h3M3.5 12h3M3.5 17h3"/><path class="fl" d="M14 3v6.5l-2-1.4-2 1.4V3z"/><line class="st" x1="9.5" y1="14.8" x2="15.5" y2="14.8"/>',
  /* شريط التنقل السفلي */
  chome: '<path class="du" d="M4.5 10.2L12 3.8l7.5 6.4v8.8a1.8 1.8 0 0 1-1.8 1.8H6.3a1.8 1.8 0 0 1-1.8-1.8z"/><path class="st" d="M3 10.8L12 3.2l9 7.6"/><path class="st" d="M5 9.8v9.2a1.8 1.8 0 0 0 1.8 1.8h10.4A1.8 1.8 0 0 0 19 19V9.8"/><rect class="st" x="9.5" y="13.5" width="5" height="7.3" rx="1.2"/>',
  crepair: '<circle class="du" cx="12" cy="12" r="8"/><path class="st" d="M14.7 6.3a3.8 3.8 0 0 0-5.2 5.2l-5.3 5.3a1.6 1.6 0 0 0 2.3 2.3l5.3-5.3a3.8 3.8 0 0 0 5.2-5.2l-2.2 2.2-2.3-2.3z"/><path class="st" d="M5 5l3.5 3.5M15.5 15.5L19 19"/>',
  creport: '<rect class="du" x="5" y="4" width="14" height="17" rx="2.5"/><rect class="st" x="5" y="4" width="14" height="17" rx="2.5"/><rect class="st" x="9" y="2.5" width="6" height="3" rx="1"/><path class="st" d="M8.2 10.5l1.3 1.3 2.5-2.5M8.2 15.5l1.3 1.3 2.5-2.5"/><path class="st" d="M14 10.5h2.2M14 15.5h2.2"/>',
  cmore: '<line class="st" x1="4" y1="7" x2="20" y2="7"/><line class="st" x1="4" y1="12" x2="20" y2="12"/><line class="st" x1="4" y1="17" x2="20" y2="17"/><circle class="du" cx="9" cy="7" r="2.3"/><circle class="st" cx="9" cy="7" r="2.3"/><circle class="du" cx="15" cy="12" r="2.3"/><circle class="st" cx="15" cy="12" r="2.3"/><circle class="du" cx="10" cy="17" r="2.3"/><circle class="st" cx="10" cy="17" r="2.3"/>'
};
/* ألوان الأقسام الصافية (يتكيف سطوعها تلقائياً مع النهار والليل) */
const CIH = { cphone: '#3b82f6', cglass: '#06b6d4', ccase: '#8b5cf6', cacc: '#10b981', ctopup: '#f97316', creq: '#ec4899', cused: '#eab308', cdebt: '#f43f5e', chome: '#10b981', crepair: '#8b5cf6', creport: '#f59e0b', cmore: '#64748b' };
/* ---------- أيقونات إضافية للعرض المضغوط والبيع السريع والروپريز ---------- */
Object.assign(IC, {
  rows: '<line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>',
  cards: '<rect x="3" y="3" width="18" height="7" rx="1.5"/><rect x="3" y="14" width="18" height="7" rx="1.5"/>',
  zap: '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>',
  swap: '<path d="m16 3 4 4-4 4"/><path d="M20 7H4"/><path d="m8 21-4-4 4-4"/><path d="M4 17h16"/>'
});