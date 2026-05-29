// screens.jsx — The Taproom · Pizza screens
import { useState, useEffect, useMemo, useRef } from 'react';

// ─────────────────────────────────────────────
// MENU DATA
// ─────────────────────────────────────────────
const MENU = [
  { id: 'garlic',    name: 'Garlic Bread',          price: 6,  tags: ['v'],  desc: 'Confit garlic & rosemary cream, parsley.' },
  { id: 'marinara',  name: 'Marinara',              price: 10, tags: ['ve'], desc: 'San Marzano, garlic, oregano, olive oil.' },
  { id: 'margherita',name: 'Margherita',            price: 12, tags: ['v'],  desc: 'San Marzano, fior di latte, basil, olive oil.' },
  { id: 'pepperoni', name: 'Pepperoni',             price: 13, tags: [],     desc: 'San Marzano, fior di latte, pepperoni, oregano.' },
  { id: 'diavola',   name: 'Diavola',               price: 14, tags: ['🌶'], desc: 'San Marzano, fior di latte, pepperoni, nduja, agrodolce peppers, hot honey, basil.' },
  { id: 'beef',      name: 'Beef Ragu',             price: 15, tags: [],     desc: 'San Marzano, fior di latte, slow-braised beef shin & cheek, Parmesan, basil.' },
  { id: 'mushroom',  name: 'Mushroom & Taleggio',   price: 14, tags: ['v'],  desc: 'Fior di latte, taleggio, roasted chestnut mushrooms, gorgonzola, Parmesan, sherry vinegar glaze.' },
  { id: 'potato',    name: 'Potato & Prosciutto',   price: 14, tags: [],     desc: 'Confit garlic & rosemary cream, thinly sliced potato, guindillas, prosciutto crudo, Parmesan.' },
  { id: 'tenderstem',name: 'Tenderstem & Vegan Nduja', price: 13, tags: ['ve'], desc: 'Pistachio pesto, tenderstem, vegan nduja, artichokes, olives, sun-blushed tomato, rocket.' },
  { id: 'prawn',     name: 'Prawn & Anchovy',         price: 16, tags: [],     desc: 'Olive oil & garlic, fior di latte, prawns, anchovy, salsa verde, lemon.' },
];

const CONDIMENTS = [
  { id: 'chilli-oil',    name: 'House Italian Chilli Oil', price: 0.50, eposId: 7665572 },
  { id: 'garlic-mayo',   name: 'House Garlic Mayo',        price: 0.50, eposId: 7665597 },
  { id: 'chilli-flakes', name: 'Chilli Flakes',            price: 0,    eposId: 7665604 },
  { id: 'parmesan',      name: 'Parmesan',                 price: 0.50, eposId: 7665609 },
];

const ALL_ITEMS = [...MENU, ...CONDIMENTS];

// ─────────────────────────────────────────────
// THEMES
// ─────────────────────────────────────────────
const THEMES = {
  poster: {
    bg: '#d8d2c4',
    paper: '#d8d2c4',
    surface: '#cec7b6',
    ink: '#2b1208',
    inkSoft: '#5a3e30',
    accent: '#3a1408',
    border: 'rgba(58,20,8,0.35)',
    headlineFont: '"Archivo Black", "Archivo", system-ui',
    bodyFont: '"DM Mono", monospace',
    buttonBg: '#3a1408',
    buttonText: '#e8dfca',
    paperTexture: true,
    name: 'Poster',
  },
  refined: {
    bg: '#f4ede0',
    paper: '#fbf6ec',
    surface: '#ffffff',
    ink: '#2b1208',
    inkSoft: '#74604f',
    accent: '#a83817',
    border: 'rgba(58,20,8,0.14)',
    headlineFont: '"Fraunces", Georgia, serif',
    bodyFont: '"Inter", system-ui',
    buttonBg: '#a83817',
    buttonText: '#fff',
    paperTexture: false,
    name: 'Refined',
  },
  minimal: {
    bg: '#fafaf7',
    paper: '#ffffff',
    surface: '#f4f3ee',
    ink: '#161513',
    inkSoft: '#73706b',
    accent: '#161513',
    border: 'rgba(0,0,0,0.08)',
    headlineFont: '"Archivo", system-ui, sans-serif',
    bodyFont: '"Inter", system-ui',
    buttonBg: '#161513',
    buttonText: '#fff',
    paperTexture: false,
    name: 'Minimal',
  },
};

// ─────────────────────────────────────────────
// SHARED ICONS (kept simple)
// ─────────────────────────────────────────────
const Icon = {
  basket: (c='currentColor') => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7h18l-2 12a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L3 7z"/><path d="M8 7l4-5 4 5"/></svg>
  ),
  chev: (c='currentColor') => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6"/></svg>
  ),
  back: (c='currentColor') => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 6l-6 6 6 6"/></svg>
  ),
  close: (c='currentColor') => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 6l12 12M18 6L6 18"/></svg>
  ),
  plus: (c='currentColor') => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="3" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
  ),
  minus: (c='currentColor') => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="3" strokeLinecap="round"><path d="M5 12h14"/></svg>
  ),
  check: (c='currentColor') => (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5L20 7"/></svg>
  ),
};

// ─────────────────────────────────────────────
// SPLASH SCREEN
// ─────────────────────────────────────────────
function Splash({ theme, onContinue }) {
  const t = THEMES[theme];
  return (
    <div style={{
      position: 'absolute', inset: 0,
      background: t.bg,
      display: 'flex', flexDirection: 'column',
      animation: 'fadeIn 0.4s ease',
    }} className={t.paperTexture ? 'paper-bg' : ''}>
      <div style={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'column', padding: '80px 28px 40px' }}>
        {/* coffee splash decoration top-left */}
        <div style={{ position: 'absolute', top: 90, left: 22, width: 90, color: t.accent, fontFamily: t.headlineFont, fontSize: 48, lineHeight: 0.8, opacity: 0.85 }}>
          <div style={{ fontSize: 36 }}>•</div>
          <div style={{ fontSize: 14, marginTop: -6, marginLeft: 14 }}>+ ••</div>
          <div style={{ fontSize: 14, marginTop: 4, marginLeft: -2 }}>~ • •</div>
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'flex-end', textAlign: 'right', position: 'relative', zIndex: 1 }}>
          <div style={{
            fontFamily: t.headlineFont, fontWeight: 900,
            fontSize: 88, lineHeight: 0.86,
            color: t.accent, letterSpacing: '-0.04em',
            animation: 'fadeUp 0.6s ease',
          }}>
            pop-up
          </div>
          <div style={{
            fontFamily: t.headlineFont, fontWeight: 900,
            fontSize: 96, lineHeight: 0.86,
            color: t.accent, letterSpacing: '-0.04em', marginTop: 4,
            animation: 'fadeUp 0.7s ease',
          }}>
            pizza
          </div>
          <div style={{
            fontFamily: t.bodyFont, fontSize: 18,
            color: t.accent, marginTop: 10,
            animation: 'fadeUp 0.8s ease',
          }}>
            eat in or takeaway
          </div>
        </div>

        <div style={{
          fontFamily: t.bodyFont, fontSize: 13, color: t.inkSoft,
          textAlign: 'center', marginBottom: 20, lineHeight: 1.6,
          animation: 'fadeUp 0.9s ease',
        }}>
          10" stone-baked sourdough · fired in our Gozney Dome<br/>
          <span style={{ opacity: 0.7 }}>San Marzano · fior di latte · live fire</span>
        </div>

        <button onClick={onContinue} style={{
          background: t.buttonBg, color: t.buttonText,
          border: 'none', borderRadius: theme === 'minimal' ? 12 : (theme === 'refined' ? 999 : 4),
          padding: '20px 24px', fontSize: 17, fontWeight: 700,
          fontFamily: t.bodyFont, cursor: 'pointer',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          letterSpacing: theme === 'poster' ? '0.02em' : 0,
          animation: 'fadeUp 1s ease',
        }}>
          <span>Start your order</span>
          {Icon.chev(t.buttonText)}
        </button>
        <div style={{ textAlign: 'center', marginTop: 12, fontFamily: t.bodyFont, fontSize: 11, color: t.inkSoft, opacity: 0.7, animation: 'fadeUp 1.1s ease' }}>
          friday & saturday · 3pm – 9pm · last order 8.30pm
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// PIZZA TILE (for grid layout)
// ─────────────────────────────────────────────
function PizzaPlaceholder({ size = 80, theme }) {
  const t = THEMES[theme];
  // Subtle striped placeholder per design system rules
  return (
    <div style={{
      width: size, height: size,
      borderRadius: '50%',
      background: `repeating-linear-gradient(45deg, ${t.surface}, ${t.surface} 4px, ${t.bg} 4px, ${t.bg} 8px)`,
      border: `1px solid ${t.border}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: '"DM Mono", monospace', fontSize: 9, color: t.inkSoft, opacity: 0.6,
      flexShrink: 0,
    }}>
      pizza
    </div>
  );
}

function TagBadge({ tag, theme }) {
  const t = THEMES[theme];
  if (!tag) return null;
  const isHot = tag === '🌶';
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: t.bodyFont, fontSize: 10, fontWeight: 600,
      color: isHot ? '#c1361b' : t.inkSoft,
      background: 'transparent',
      border: `1px solid ${isHot ? 'rgba(193,54,27,0.4)' : t.border}`,
      padding: '1px 6px', borderRadius: 3, letterSpacing: '0.05em',
      textTransform: isHot ? 'none' : 'uppercase',
    }}>
      {isHot ? '🌶 hot' : `(${tag})`}
    </span>
  );
}

// ─────────────────────────────────────────────
// MENU ROW (list layout — matches poster)
// ─────────────────────────────────────────────
function MenuRowList({ item, theme, qty, onAdd, onRemove }) {
  const t = THEMES[theme];
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', gap: 4,
      paddingBottom: 14,
    }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
          <span style={{
            fontFamily: t.bodyFont, fontWeight: 700, fontSize: 15,
            color: t.ink,
          }}>{item.name}</span>
          {item.tags.map(tg => <TagBadge key={tg} tag={tg} theme={theme} />)}
          <span style={{
            fontFamily: t.bodyFont, fontWeight: 500, fontSize: 14,
            color: t.inkSoft,
          }}>£{item.price}</span>
        </div>
        <QtyControl qty={qty} onAdd={onAdd} onRemove={onRemove} theme={theme} />
      </div>
      <div style={{
        fontFamily: t.bodyFont, fontSize: 12, color: t.inkSoft,
        lineHeight: 1.45, paddingRight: 20,
      }}>{item.desc}</div>
    </div>
  );
}

// ─────────────────────────────────────────────
// MENU CARD (cards layout)
// ─────────────────────────────────────────────
function MenuCard({ item, theme, qty, onAdd, onRemove }) {
  const t = THEMES[theme];
  return (
    <div style={{
      display: 'flex', gap: 14,
      padding: 14,
      background: t.paper,
      border: `1px solid ${t.border}`,
      borderRadius: theme === 'minimal' ? 14 : (theme === 'refined' ? 18 : 6),
    }}>
      <PizzaPlaceholder size={84} theme={theme} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, flexWrap: 'wrap' }}>
          <span style={{
            fontFamily: theme === 'refined' ? t.headlineFont : t.bodyFont,
            fontWeight: theme === 'refined' ? 600 : 700,
            fontSize: theme === 'refined' ? 19 : 16,
            color: t.ink,
          }}>{item.name}</span>
          {item.tags.map(tg => <TagBadge key={tg} tag={tg} theme={theme} />)}
        </div>
        <div style={{
          fontFamily: t.bodyFont, fontSize: 12, color: t.inkSoft,
          lineHeight: 1.4,
        }}>{item.desc}</div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 }}>
          <span style={{
            fontFamily: t.bodyFont, fontWeight: 700, fontSize: 15, color: t.ink,
          }}>£{item.price}</span>
          <QtyControl qty={qty} onAdd={onAdd} onRemove={onRemove} theme={theme} />
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// MENU GRID TILE (grid layout)
// ─────────────────────────────────────────────
function MenuGridTile({ item, theme, qty, onAdd, onRemove }) {
  const t = THEMES[theme];
  return (
    <div style={{
      background: t.paper,
      border: `1px solid ${t.border}`,
      borderRadius: theme === 'minimal' ? 14 : (theme === 'refined' ? 18 : 6),
      padding: 12,
      display: 'flex', flexDirection: 'column', gap: 8,
      position: 'relative',
    }}>
      <div style={{ display: 'flex', justifyContent: 'center', padding: '6px 0' }}>
        <PizzaPlaceholder size={86} theme={theme} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minHeight: 56 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, flexWrap: 'wrap' }}>
          <span style={{
            fontFamily: theme === 'refined' ? t.headlineFont : t.bodyFont,
            fontWeight: theme === 'refined' ? 600 : 700,
            fontSize: 14,
            color: t.ink, lineHeight: 1.15,
          }}>{item.name}</span>
          {item.tags.map(tg => <TagBadge key={tg} tag={tg} theme={theme} />)}
        </div>
        <span style={{ fontFamily: t.bodyFont, fontWeight: 600, fontSize: 13, color: t.inkSoft }}>£{item.price}</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <QtyControl qty={qty} onAdd={onAdd} onRemove={onRemove} theme={theme} compact />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// QTY CONTROL
// ─────────────────────────────────────────────
function QtyControl({ qty, onAdd, onRemove, theme, compact = false }) {
  const t = THEMES[theme];
  const radius = theme === 'minimal' ? 999 : (theme === 'refined' ? 999 : 4);
  const size = compact ? 28 : 32;

  if (!qty) {
    return (
      <button onClick={onAdd} style={{
        width: size, height: size, borderRadius: radius,
        background: t.buttonBg, color: t.buttonText,
        border: 'none', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        {Icon.plus(t.buttonText)}
      </button>
    );
  }
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 6,
      background: t.buttonBg,
      borderRadius: radius,
      padding: 2,
    }}>
      <button onClick={onRemove} style={{
        width: size - 4, height: size - 4, borderRadius: radius,
        background: 'transparent', color: t.buttonText,
        border: 'none', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {Icon.minus(t.buttonText)}
      </button>
      <span style={{
        color: t.buttonText, fontFamily: t.bodyFont, fontWeight: 700, fontSize: 14, minWidth: 14, textAlign: 'center',
      }}>{qty}</span>
      <button onClick={onAdd} style={{
        width: size - 4, height: size - 4, borderRadius: radius,
        background: 'transparent', color: t.buttonText,
        border: 'none', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {Icon.plus(t.buttonText)}
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────
// MENU SCREEN
// ─────────────────────────────────────────────
// ─────────────────────────────────────────────
// ADD-ONS SHEET
// ─────────────────────────────────────────────
function AddOnsSheet({ item, theme, onConfirm, onSkip }) {
  const t = THEMES[theme];
  const [sel, setSel] = useState({});
  const radius = theme === 'minimal' ? 14 : (theme === 'refined' ? 16 : 6);

  const toggle = (id) => setSel(s => ({ ...s, [id]: !s[id] }));
  const extraCost = CONDIMENTS.filter(c => sel[c.id]).reduce((s, c) => s + c.price, 0);

  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 20,
      background: 'rgba(0,0,0,0.45)',
      display: 'flex', alignItems: 'flex-end',
      animation: 'fadeIn 0.15s ease',
    }} onClick={onSkip}>
      <div onClick={e => e.stopPropagation()} style={{
        width: '100%',
        background: t.bg,
        borderRadius: '20px 20px 0 0',
        padding: '0 0 28px',
        animation: 'slideUp 0.25s ease',
        boxShadow: '0 -4px 30px rgba(0,0,0,0.18)',
      }} className={t.paperTexture ? 'paper-bg' : ''}>
        {/* drag handle */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 4px' }}>
          <div style={{ width: 36, height: 4, borderRadius: 99, background: t.border }} />
        </div>
        <div style={{ padding: '8px 20px 16px' }}>
          <div style={{
            fontFamily: t.headlineFont, fontWeight: 900,
            fontSize: theme === 'poster' ? 20 : 18,
            color: t.accent, letterSpacing: '-0.02em', marginBottom: 2,
          }}>add extras?</div>
          <div style={{ fontFamily: t.bodyFont, fontSize: 12, color: t.inkSoft }}>
            With your {item.name}
          </div>
        </div>
        <div style={{ borderTop: `1px solid ${t.border}` }}>
          {CONDIMENTS.map(c => {
            const checked = !!sel[c.id];
            return (
              <div key={c.id} onClick={() => toggle(c.id)} style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '14px 20px',
                borderBottom: `1px dashed ${t.border}`,
                cursor: 'pointer',
              }}>
                <div style={{
                  width: 24, height: 24, borderRadius: theme === 'minimal' ? 6 : 4,
                  border: `2px solid ${checked ? t.accent : t.border}`,
                  background: checked ? t.accent : 'transparent',
                  flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {checked && (
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={t.bg} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12l5 5L20 7"/>
                    </svg>
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: t.bodyFont, fontWeight: 700, fontSize: 14, color: t.ink }}>{c.name}</div>
                </div>
                <div style={{
                  fontFamily: t.bodyFont, fontWeight: 700, fontSize: 13,
                  color: c.price === 0 ? t.inkSoft : t.accent,
                }}>
                  {c.price === 0 ? 'free' : `+£${c.price.toFixed(2)}`}
                </div>
              </div>
            );
          })}
        </div>
        <div style={{ padding: '16px 20px 0', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button onClick={() => onConfirm(sel)} style={{
            width: '100%', padding: '15px',
            background: t.buttonBg, color: t.buttonText,
            border: 'none', borderRadius: radius,
            fontFamily: t.bodyFont, fontWeight: 700, fontSize: 15,
            cursor: 'pointer',
          }}>
            {Object.values(sel).some(Boolean)
              ? `Add to order${extraCost > 0 ? ` · +£${extraCost.toFixed(2)}` : ''}`
              : 'Add to order'}
          </button>
          <button onClick={onSkip} style={{
            width: '100%', padding: '11px',
            background: 'transparent', color: t.inkSoft,
            border: 'none',
            fontFamily: t.bodyFont, fontSize: 13,
            cursor: 'pointer',
          }}>Skip extras</button>
        </div>
      </div>
    </div>
  );
}

function OrderHistoryDrawer({ theme, orderHistory, table, onClose }) {
  const t = THEMES[theme];
  const sessionTotal = orderHistory.reduce((s, o) => s + o.total, 0);
  const radius = theme === 'minimal' ? 14 : (theme === 'refined' ? 16 : 6);
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 20, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'flex-end', animation: 'fadeIn 0.15s ease' }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ width: '100%', background: t.bg, borderRadius: '20px 20px 0 0', maxHeight: '80%', display: 'flex', flexDirection: 'column', animation: 'slideUp 0.25s ease', boxShadow: '0 -4px 30px rgba(0,0,0,0.18)' }} className={t.paperTexture ? 'paper-bg' : ''}>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 4px' }}>
          <div style={{ width: 36, height: 4, borderRadius: 99, background: t.border }} />
        </div>
        <div style={{ padding: '8px 20px 14px', display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', borderBottom: `1px solid ${t.border}` }}>
          <div style={{ fontFamily: t.headlineFont, fontWeight: 900, fontSize: theme === 'poster' ? 20 : 18, color: t.accent, letterSpacing: '-0.02em' }}>your orders</div>
          <div style={{ fontFamily: t.bodyFont, fontSize: 12, color: t.inkSoft }}>Table {String(table || '').padStart(2,'0')}</div>
        </div>
        <div style={{ overflowY: 'auto', flex: 1 }}>
          {orderHistory.map((order, idx) => (
            <div key={idx} style={{ padding: '14px 20px', borderBottom: `1px dashed ${t.border}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
                <div style={{ fontFamily: t.bodyFont, fontWeight: 700, fontSize: 13, color: t.ink }}>Round {idx + 1} · #{order.orderNum}</div>
                <div style={{ fontFamily: t.bodyFont, fontWeight: 700, fontSize: 13, color: t.accent }}>£{order.total.toFixed(2)}</div>
              </div>
              {order.lines.map((l, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontFamily: t.bodyFont, fontSize: 12, color: t.inkSoft, lineHeight: 1.7 }}>
                  <span>{l.label}</span><span>{l.price}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
        <div style={{ padding: '14px 20px 28px', borderTop: `1px solid ${t.border}`, background: t.bg }} className={t.paperTexture ? 'paper-bg' : ''}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 }}>
            <div style={{ fontFamily: t.bodyFont, fontWeight: 700, fontSize: 14, color: t.inkSoft }}>Session total</div>
            <div style={{ fontFamily: t.headlineFont, fontWeight: 900, fontSize: 22, color: t.accent, letterSpacing: '-0.02em' }}>£{sessionTotal.toFixed(2)}</div>
          </div>
          <button onClick={onClose} style={{ width: '100%', padding: '13px', background: t.buttonBg, color: t.buttonText, border: 'none', borderRadius: radius, fontFamily: t.bodyFont, fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>Close</button>
        </div>
      </div>
    </div>
  );
}

function Menu({ theme, layout, cart, setCart, onCheckout, table, showTable, orderHistory }) {
  const t = THEMES[theme];
  const [pendingAdd, setPendingAdd] = useState(null);
  const [showHistory, setShowHistory] = useState(false);

  const totalQty = cart.length;
  const totalPrice = useMemo(() =>
    cart.reduce((sum, line) => {
      const item = MENU.find(m => m.id === line.itemId);
      const condTotal = line.condiments.reduce((cs, cid) => {
        const cond = CONDIMENTS.find(c => c.id === cid);
        return cs + (cond ? cond.price : 0);
      }, 0);
      return sum + (item ? item.price : 0) + condTotal;
    }, 0),
    [cart]
  );

  const add = (id) => setPendingAdd(id);

  const remove = (id) => setCart(c => {
    const idx = c.map(l => l.itemId).lastIndexOf(id);
    if (idx < 0) return c;
    return c.filter((_, i) => i !== idx);
  });

  const confirmAddOns = (sel) => {
    const condiments = CONDIMENTS.filter(c => sel[c.id]).map(c => c.id);
    setCart(c => [...c, { lineId: Date.now() + Math.random(), itemId: pendingAdd, condiments }]);
    setPendingAdd(null);
  };

  const skipAddOns = () => {
    setCart(c => [...c, { lineId: Date.now() + Math.random(), itemId: pendingAdd, condiments: [] }]);
    setPendingAdd(null);
  };

  return (
    <div style={{
      position: 'absolute', inset: 0, overflow: 'hidden',
      display: 'flex', flexDirection: 'column',
      background: t.bg,
    }} className={t.paperTexture ? 'paper-bg' : ''}>

      {/* HEADER */}
      <div style={{
        position: 'relative', zIndex: 2,
        padding: '66px 24px 14px',
        background: t.bg,
        borderBottom: `1px solid ${t.border}`,
      }} className={t.paperTexture ? 'paper-bg' : ''}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <div>
            <div style={{
              fontFamily: t.headlineFont, fontSize: theme === 'poster' ? 30 : 22, lineHeight: 0.85, fontWeight: 900,
              color: t.accent, letterSpacing: '-0.03em',
            }}>the taproom</div>
            <div style={{
              fontFamily: t.bodyFont, fontSize: 11, fontWeight: 700, letterSpacing: '0.18em',
              color: t.inkSoft, marginTop: 5, textTransform: 'uppercase',
            }}>· pizza ·</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            {orderHistory && orderHistory.length > 0 && (
              <button onClick={() => setShowHistory(true)} style={{
                background: 'transparent', border: `1.5px solid ${t.border}`,
                borderRadius: theme === 'minimal' ? 10 : (theme === 'refined' ? 12 : 4),
                padding: '6px 10px', cursor: 'pointer',
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                gap: 1,
              }}>
                <div style={{ fontFamily: t.bodyFont, fontSize: 9, fontWeight: 700, color: t.inkSoft, textTransform: 'uppercase', letterSpacing: '0.1em' }}>orders</div>
                <div style={{ fontFamily: t.headlineFont, fontWeight: 900, fontSize: 16, color: t.accent, letterSpacing: '-0.03em', lineHeight: 1 }}>{orderHistory.length}</div>
              </button>
            )}
            {showTable && (
              <div style={{
                padding: '8px 14px 10px',
                background: t.accent, color: t.bg,
                borderRadius: theme === 'minimal' ? 12 : (theme === 'refined' ? 14 : 4),
                textAlign: 'center',
                boxShadow: theme === 'poster' ? '3px 3px 0 rgba(0,0,0,0.15)' : 'none',
              }}>
                <div style={{
                  fontFamily: t.bodyFont, fontSize: 9.5, fontWeight: 700,
                  textTransform: 'uppercase', letterSpacing: '0.14em',
                  opacity: 0.85, marginBottom: 2,
                }}>your table</div>
                <div style={{
                  fontFamily: t.headlineFont, fontWeight: 900,
                  fontSize: 28, letterSpacing: '-0.04em', lineHeight: 1,
                }}>{String(table).padStart(2, '0')}</div>
              </div>
            )}
          </div>
        </div>
        <div style={{
          marginTop: 10, fontFamily: t.bodyFont, fontSize: 11.5, color: t.inkSoft,
        }}>
          order &amp; pay from your table · thu & fri 3pm–9pm · sat 12pm–9pm
        </div>
      </div>

      {/* SCROLLABLE BODY */}
      <div style={{ flex: 1, overflowY: 'auto', position: 'relative' }} className={t.paperTexture ? 'paper-bg' : ''}>
        <div style={{ padding: '16px 22px 140px', position: 'relative' }}>
          {layout === 'list' && (
            <>
              <div style={{
                fontFamily: t.bodyFont, fontSize: 11.5, color: t.inkSoft,
                lineHeight: 1.5, marginBottom: 18, paddingBottom: 14,
                borderBottom: `1px dashed ${t.border}`,
              }}>
                10" stone-baked sourdough fired in our Gozney Dome.<br/>
                San Marzano tomatoes & fresh fior di latte for that authentic Neapolitan flavour.
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {MENU.map(item => (
                  <MenuRowList key={item.id} item={item} theme={theme}
                    qty={cart.filter(l => l.itemId === item.id).length}
                    onAdd={() => add(item.id)} onRemove={() => remove(item.id)} />
                ))}
              </div>
            </>
          )}

          {layout === 'cards' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {MENU.map(item => (
                <MenuCard key={item.id} item={item} theme={theme}
                  qty={cart.filter(l => l.itemId === item.id).length}
                  onAdd={() => add(item.id)} onRemove={() => remove(item.id)} />
              ))}
            </div>
          )}

          {layout === 'grid' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {MENU.map(item => (
                <MenuGridTile key={item.id} item={item} theme={theme}
                  qty={cart.filter(l => l.itemId === item.id).length}
                  onAdd={() => add(item.id)} onRemove={() => remove(item.id)} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* CART BAR */}
      {totalQty > 0 && (
        <div style={{
          position: 'absolute', left: 16, right: 16, bottom: 24,
          zIndex: 5,
          animation: 'fadeUp 0.3s ease',
        }}>
          <button onClick={onCheckout} style={{
            width: '100%',
            background: t.buttonBg, color: t.buttonText,
            border: 'none',
            borderRadius: theme === 'minimal' ? 14 : (theme === 'refined' ? 999 : 6),
            padding: '14px 18px', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            fontFamily: t.bodyFont, fontWeight: 700, fontSize: 15,
            boxShadow: '0 8px 24px rgba(0,0,0,0.22)',
          }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{
                background: 'rgba(255,255,255,0.18)',
                padding: '2px 9px', borderRadius: 999, fontSize: 13,
              }}>{totalQty}</span>
              View basket
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              £{totalPrice.toFixed(2)}
              {Icon.chev(t.buttonText)}
            </span>
          </button>
        </div>
      )}

      {/* ORDER HISTORY DRAWER */}
      {showHistory && (
        <OrderHistoryDrawer
          theme={theme}
          orderHistory={orderHistory || []}
          table={table}
          onClose={() => setShowHistory(false)}
        />
      )}

      {/* ADD-ONS SHEET */}
      {pendingAdd && (() => {
        const item = MENU.find(m => m.id === pendingAdd);
        return (
          <AddOnsSheet
            item={item}
            theme={theme}
            onConfirm={confirmAddOns}
            onSkip={skipAddOns}
          />
        );
      })()}
    </div>
  );
}

// ─────────────────────────────────────────────
// CART / CHECKOUT — in-app payment with tipping
// ─────────────────────────────────────────────
function Cart({ theme, cart, setCart, onBack, onPay, table, showTable, tipPct, setTipPct, tipPrompt, payMethod, setPayMethod }) {
  const t = THEMES[theme];

  const lineTotal = (line) => {
    const item = MENU.find(m => m.id === line.itemId);
    const condTotal = line.condiments.reduce((s, cid) => {
      const cond = CONDIMENTS.find(c => c.id === cid);
      return s + (cond ? cond.price : 0);
    }, 0);
    return (item ? item.price : 0) + condTotal;
  };
  const subtotal = Math.round(cart.reduce((s, line) => s + lineTotal(line), 0) * 100) / 100;
  const tip = tipPrompt ? Math.round((subtotal * (tipPct/100)) * 100) / 100 : 0;
  const total = Math.round((subtotal + tip) * 100) / 100;

  const removeLine = (lineId) => setCart(c => c.filter(l => l.lineId !== lineId));

  const radius = theme === 'minimal' ? 14 : (theme === 'refined' ? 16 : 6);

  const PayBtn = ({ id, label, sub, icon }) => {
    const sel = payMethod === id;
    return (
      <button onClick={() => setPayMethod(id)} style={{
        width: '100%', textAlign: 'left',
        background: sel ? t.surface : 'transparent',
        border: `1.5px solid ${sel ? t.accent : t.border}`,
        borderRadius: radius,
        padding: '12px 14px', cursor: 'pointer',
        display: 'flex', alignItems: 'center', gap: 12,
        fontFamily: t.bodyFont,
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: theme === 'poster' ? 4 : 8,
          background: id === 'apple' ? '#000' : (id === 'google' ? '#fff' : t.accent),
          color: id === 'google' ? '#202124' : '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 700, fontSize: 14,
          border: id === 'google' ? '1px solid rgba(0,0,0,0.15)' : 'none',
          fontFamily: '-apple-system, system-ui, sans-serif',
        }}>{icon}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: t.ink }}>{label}</div>
          <div style={{ fontSize: 11, color: t.inkSoft }}>{sub}</div>
        </div>
        <div style={{
          width: 18, height: 18, borderRadius: 999,
          border: `2px solid ${sel ? t.accent : t.border}`,
          background: sel ? t.accent : 'transparent',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {sel && <div style={{ width: 6, height: 6, borderRadius: 999, background: '#fff' }} />}
        </div>
      </button>
    );
  };

  const TipChip = ({ pct, label }) => {
    const sel = tipPct === pct;
    return (
      <button onClick={() => setTipPct(pct)} style={{
        flex: 1, height: 44,
        background: sel ? t.accent : 'transparent',
        color: sel ? t.bg : t.ink,
        border: `1.5px solid ${sel ? t.accent : t.border}`,
        borderRadius: radius,
        fontFamily: t.bodyFont, fontWeight: 700, fontSize: 13,
        cursor: 'pointer',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        gap: 1,
      }}>
        <span style={{ fontSize: 13 }}>{label}</span>
        {pct > 0 && (
          <span style={{ fontSize: 10, opacity: 0.75, fontWeight: 500 }}>
            +£{((subtotal * pct/100)).toFixed(2)}
          </span>
        )}
      </button>
    );
  };

  return (
    <div style={{
      position: 'absolute', inset: 0,
      background: t.bg,
      display: 'flex', flexDirection: 'column',
      animation: 'fadeIn 0.25s ease',
    }} className={t.paperTexture ? 'paper-bg' : ''}>

      {/* HEADER */}
      <div style={{
        padding: '66px 18px 14px', display: 'flex', alignItems: 'center', gap: 10,
        borderBottom: `1px solid ${t.border}`, position: 'relative', zIndex: 2,
        background: t.bg,
      }} className={t.paperTexture ? 'paper-bg' : ''}>
        <button onClick={onBack} style={{
          background: 'transparent', border: 'none', cursor: 'pointer',
          color: t.ink, padding: 6, display: 'flex',
        }}>{Icon.back(t.ink)}</button>
        <div style={{ flex: 1,
          fontFamily: t.headlineFont, fontSize: theme === 'poster' ? 26 : 20,
          fontWeight: 900, color: t.accent, letterSpacing: '-0.02em',
        }}>your order</div>
        {showTable && (
          <div style={{
            padding: '4px 10px 5px',
            background: t.accent, color: t.bg,
            borderRadius: theme === 'minimal' ? 8 : (theme === 'refined' ? 999 : 3),
            fontFamily: t.bodyFont, fontSize: 11, fontWeight: 700,
            display: 'flex', alignItems: 'center', gap: 5,
          }}>
            <span style={{ opacity: 0.8, fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase' }}>tbl</span>
            <span style={{ fontFamily: t.headlineFont, fontWeight: 900, fontSize: 14, letterSpacing: '-0.02em' }}>{String(table).padStart(2, '0')}</span>
          </div>
        )}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', position: 'relative' }} className={t.paperTexture ? 'paper-bg' : ''}>
        <div style={{ padding: '18px 18px 24px' }}>

          {/* DINE-IN NOTICE */}
          <div style={{
            background: t.paper, border: `1px solid ${t.border}`, borderRadius: radius,
            padding: '12px 14px', marginBottom: 14,
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              background: t.accent, color: t.bg,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: t.headlineFont, fontWeight: 900, fontSize: 16,
              flexShrink: 0,
            }}>{String(table).padStart(2, '0')}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: t.bodyFont, fontWeight: 700, fontSize: 13, color: t.ink }}>Dine in · delivered to your table</div>
              <div style={{ fontFamily: t.bodyFont, fontSize: 11.5, color: t.inkSoft, marginTop: 2 }}>~15 min from the oven</div>
            </div>
          </div>

          {/* ITEMS */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 18 }}>
            {cart.map((line, idx) => {
              const item = MENU.find(m => m.id === line.itemId);
              if (!item) return null;
              const lineConds = line.condiments.map(cid => CONDIMENTS.find(c => c.id === cid)).filter(Boolean);
              return (
                <div key={line.lineId} style={{ borderBottom: `1px dashed ${t.border}`, paddingBottom: 10, marginBottom: 4 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingTop: 10 }}>
                    <PizzaPlaceholder size={44} theme={theme} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: t.bodyFont, fontWeight: 700, fontSize: 14, color: t.ink }}>{item.name}</div>
                      <div style={{ fontFamily: t.bodyFont, fontSize: 12, color: t.inkSoft }}>£{item.price.toFixed(2)}</div>
                    </div>
                    <div style={{ fontFamily: t.bodyFont, fontWeight: 700, fontSize: 14, color: t.ink, minWidth: 44, textAlign: 'right' }}>
                      £{lineTotal(line).toFixed(2)}
                    </div>
                    <button onClick={() => removeLine(line.lineId)} style={{
                      background: 'transparent', border: `1.5px solid ${t.border}`,
                      borderRadius: 999, width: 28, height: 28,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer', color: t.inkSoft, flexShrink: 0,
                    }}>
                      {Icon.minus(t.inkSoft)}
                    </button>
                  </div>
                  {lineConds.length > 0 && (
                    <div style={{ marginLeft: 56, marginTop: 4, display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {lineConds.map(c => (
                        <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', fontFamily: t.bodyFont, fontSize: 12, color: t.inkSoft }}>
                          <span>+ {c.name}</span>
                          <span>{c.price === 0 ? 'free' : '+£' + c.price.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* TIP */}
          {tipPrompt && (
            <div style={{ marginBottom: 18 }}>
              <div style={{ fontFamily: t.bodyFont, fontSize: 11.5, fontWeight: 700, color: t.inkSoft, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Add a tip · goes to the team</div>
              <div style={{ display: 'flex', gap: 6 }}>
                <TipChip pct={0}  label="None" />
                <TipChip pct={5}  label="5%" />
                <TipChip pct={10} label="10%" />
                <TipChip pct={15} label="15%" />
                <TipChip pct={20} label="20%" />
              </div>
            </div>
          )}

          {/* PAYMENT */}
          <div style={{ fontFamily: t.bodyFont, fontSize: 11.5, fontWeight: 700, color: t.inkSoft, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Pay with</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <PayBtn id="apple"  label="Apple Pay"  sub="Face ID · saved card" icon="" />
            <PayBtn id="google" label="Google Pay" sub="Saved card" icon="G" />
            <PayBtn id="card"   label="Card"       sub="Visa, Mastercard, Amex" icon="••" />
          </div>

          {/* TOTAL BREAKDOWN */}
          <div style={{ marginTop: 22, paddingTop: 16, borderTop: `1px solid ${t.border}`, fontFamily: t.bodyFont }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
              <span style={{ color: t.inkSoft }}>Subtotal</span>
              <span style={{ color: t.ink, fontWeight: 600 }}>£{subtotal.toFixed(2)}</span>
            </div>
            {tipPrompt && tipPct > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginTop: 4 }}>
                <span style={{ color: t.inkSoft }}>Tip ({tipPct}%)</span>
                <span style={{ color: t.ink, fontWeight: 600 }}>£{tip.toFixed(2)}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 8 }}>
              <span style={{ fontSize: 16, color: t.ink, fontWeight: 700 }}>Total</span>
              <span style={{ fontSize: 22, color: t.accent, fontWeight: 800, fontFamily: t.headlineFont, letterSpacing: '-0.02em' }}>£{total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* PAY BUTTON */}
      <div style={{ padding: '12px 18px 22px', borderTop: `1px solid ${t.border}`, background: t.bg, position: 'relative', zIndex: 2 }} className={t.paperTexture ? 'paper-bg' : ''}>
        <button onClick={onPay} style={{
          width: '100%',
          background: payMethod === 'apple' ? '#000' : (payMethod === 'google' ? '#202124' : t.buttonBg),
          color: '#fff',
          border: 'none', borderRadius: theme === 'minimal' ? 14 : (theme === 'refined' ? 999 : 6),
          padding: '16px', cursor: 'pointer',
          fontFamily: t.bodyFont, fontWeight: 700, fontSize: 16,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}>
          {payMethod === 'apple' && <span style={{ fontSize: 18 }}></span>}
          {payMethod === 'google' && <span style={{ fontSize: 13, fontWeight: 700 }}>G</span>}
          {payMethod === 'apple' ? 'Pay' : payMethod === 'google' ? 'Pay' : 'Pay'} £{total.toFixed(2)}
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// SUBMITTING (transient)
// ─────────────────────────────────────────────
function Paying({ theme, payMethod }) {
  const t = THEMES[theme];
  const msg = payMethod === 'apple' ? 'Authorising with Face ID…'
            : payMethod === 'google' ? 'Authorising with Google Pay…'
            : 'Processing your card…';
  return (
    <div style={{
      position: 'absolute', inset: 0,
      background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 18,
      animation: 'fadeIn 0.2s ease', zIndex: 30,
    }}>
      <div style={{
        width: 56, height: 56, borderRadius: 999,
        border: '4px solid rgba(255,255,255,0.2)', borderTopColor: '#fff',
        animation: 'spin 0.9s linear infinite',
      }}/>
      <div style={{ color: '#fff', fontFamily: t.bodyFont, fontWeight: 600, fontSize: 14 }}>{msg}</div>
    </div>
  );
}

// ─────────────────────────────────────────────
// RECEIPT — EposNow till receipt animation
// ─────────────────────────────────────────────
function Receipt({ theme, cart, table, tipPct, payMethod, orderNum, onNew }) {
  const t = THEMES[theme];
  const lineTotal = (line) => {
    const item = MENU.find(m => m.id === line.itemId);
    const condTotal = line.condiments.reduce((s, cid) => {
      const cond = CONDIMENTS.find(c => c.id === cid);
      return s + (cond ? cond.price : 0);
    }, 0);
    return (item ? item.price : 0) + condTotal;
  };
  const subtotal = Math.round(cart.reduce((s, line) => s + lineTotal(line), 0) * 100) / 100;
  const tip = Math.round((subtotal * (tipPct/100)) * 100) / 100;
  const total = Math.round((subtotal + tip) * 100) / 100;
  const totalQty = cart.length;

  const now = new Date();
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const MM = String(now.getMonth()+1).padStart(2, '0');
  const yyyy = now.getFullYear();

  const lines = useMemo(() => {
    const ls = [];
    ls.push({ k: 'logo' });
    ls.push({ k: 'meta', l: 'The Taproom · St. Ives' });
    ls.push({ k: 'meta', l: '23 Bridge St · PE27 5EH' });
    ls.push({ k: 'meta', l: '01480 492255' });
    ls.push({ k: 'rule' });
    ls.push({ k: 'kv', l: 'Order #', r: orderNum || '247' });
    ls.push({ k: 'kv', l: 'Table',   r: String(table).padStart(2, '0') });
    ls.push({ k: 'kv', l: 'Time',    r: dd+'/'+MM+'/'+String(yyyy).slice(2)+' '+hh+':'+mm });
    ls.push({ k: 'kv', l: 'Source',  r: 'EposNow Dine-in' });
    ls.push({ k: 'rule' });
    cart.forEach(line => {
      const item = MENU.find(m => m.id === line.itemId);
      if (!item) return;
      ls.push({ k: 'item', l: '1× '+item.name, r: '£'+item.price.toFixed(2) });
      line.condiments.forEach(cid => {
        const cond = CONDIMENTS.find(c => c.id === cid);
        if (!cond) return;
        ls.push({ k: 'addon', l: '  + '+cond.name, r: cond.price === 0 ? 'free' : '+£'+cond.price.toFixed(2) });
      });
    });
    ls.push({ k: 'rule' });
    ls.push({ k: 'kv', l: 'Subtotal', r: '£'+subtotal.toFixed(2) });
    if (tipPct > 0) ls.push({ k: 'kv', l: 'Tip '+tipPct+'%', r: '£'+tip.toFixed(2) });
    ls.push({ k: 'total', l: 'PAID', r: '£'+total.toFixed(2) });
    ls.push({ k: 'rule' });
    const payLabel = payMethod === 'apple' ? 'Apple Pay · •• 4242'
                   : payMethod === 'google' ? 'Google Pay · •• 7331'
                   : 'Card · Visa •• 4242';
    ls.push({ k: 'meta', l: payLabel });
    ls.push({ k: 'meta', l: 'Auth: ABX'+Math.floor(10000 + Math.random()*89999) });
    ls.push({ k: 'spacer' });
    ls.push({ k: 'msg', l: 'Thanks! Your order is on its way.' });
    ls.push({ k: 'msg', l: 'Tag @taproomstives — free pizza on us' });
    return ls;
  }, [orderNum, table, totalQty, tipPct, payMethod, cart.length, subtotal, tip, total]);

  // Reveal lines one by one for the printing animation
  const [printedLines, setPrintedLines] = useState(0);
  useEffect(() => {
    let i = 0;
    const tt = setInterval(() => {
      i += 1;
      setPrintedLines(i);
      if (i >= lines.length) clearInterval(tt);
    }, 80);
    return () => clearInterval(tt);
  }, [lines.length]);

  const visible = lines.slice(0, printedLines);

  // Receipt line renderers
  const renderLine = (line, i) => {
    if (line.k === 'logo') return (
        <div key={i} style={{ textAlign: 'center', fontFamily: '"Archivo Black", sans-serif', padding: '4px 0 8px' }}>
          <div style={{ fontSize: 18, fontWeight: 900, color: '#1a1310', lineHeight: 0.95, letterSpacing: '-0.03em' }}>THE TAPROOM</div>
          <div style={{ fontFamily: '"DM Mono", monospace', fontSize: 9, fontWeight: 700, letterSpacing: '0.18em', color: '#1a1310', marginTop: 4, opacity: 0.8 }}>· PIZZA ·</div>
        </div>
    );
    if (line.k === 'meta') return (
      <div key={i} style={{ textAlign: 'center', fontFamily: '"DM Mono", monospace', fontSize: 10.5, color: '#3a3530', lineHeight: 1.4 }}>{line.l}</div>
    );
    if (line.k === 'rule') return (
      <div key={i} style={{ borderTop: '1px dashed #1a1310', margin: '8px 0' }} />
    );
    if (line.k === 'kv') return (
      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontFamily: '"DM Mono", monospace', fontSize: 11, color: '#1a1310', padding: '1px 0' }}>
        <span style={{ opacity: 0.85, flexShrink: 0 }}>{line.l}</span>
        <span style={{ fontWeight: 600, whiteSpace: 'nowrap', textAlign: 'right' }}>{line.r}</span>
      </div>
    );
    if (line.k === 'item') return (
      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontFamily: '"DM Mono", monospace', fontSize: 11.5, color: '#1a1310', padding: '2px 0', gap: 8 }}>
        <span style={{ flex: 1, minWidth: 0 }}>{line.l}</span>
        <span style={{ fontWeight: 600, whiteSpace: 'nowrap', flexShrink: 0 }}>{line.r}</span>
      </div>
    );
    if (line.k === 'addon') return (
      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontFamily: '"DM Mono", monospace', fontSize: 10.5, color: '#5a4e46', padding: '1px 0', gap: 8 }}>
        <span style={{ flex: 1, minWidth: 0 }}>{line.l}</span>
        <span style={{ whiteSpace: 'nowrap', flexShrink: 0 }}>{line.r}</span>
      </div>
    );
    if (line.k === 'total') return (
      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', fontFamily: '"Archivo Black", sans-serif', fontSize: 18, color: '#1a1310', padding: '6px 0', letterSpacing: '-0.02em' }}>
        <span>{line.l}</span>
        <span>{line.r}</span>
      </div>
    );
    if (line.k === 'msg') return (
      <div key={i} style={{ textAlign: 'center', fontFamily: '"DM Mono", monospace', fontSize: 10.5, color: '#3a3530', lineHeight: 1.5, marginTop: 2 }}>{line.l}</div>
    );
    if (line.k === 'spacer') return <div key={i} style={{ height: 10 }} />;
    return null;
  };

  const radius = theme === 'minimal' ? 14 : (theme === 'refined' ? 18 : 6);

  const saveReceipt = () => {
    const now = new Date();
    const dateStr = String(now.getDate()).padStart(2,'0') + '/' +
                    String(now.getMonth()+1).padStart(2,'0') + '/' +
                    String(now.getFullYear()).slice(2) + ' ' +
                    String(now.getHours()).padStart(2,'0') + ':' +
                    String(now.getMinutes()).padStart(2,'0');
    const payLabel = payMethod === 'apple' ? 'Apple Pay · •• 4242'
                   : payMethod === 'google' ? 'Google Pay · •• 7331'
                   : 'Card · Visa •• 4242';
    let itemsHtml = '';
    cart.forEach(line => {
      const item = MENU.find(m => m.id === line.itemId);
      if (!item) return;
      itemsHtml += '<div class="item"><span>1\xd7 ' + item.name + '</span><span>\xa3' + item.price.toFixed(2) + '</span></div>';
      line.condiments.forEach(cid => {
        const cond = CONDIMENTS.find(c => c.id === cid);
        if (!cond) return;
        itemsHtml += '<div class="addon"><span>\xa0\xa0+ ' + cond.name + '</span><span>' + (cond.price === 0 ? 'free' : '+\xa3' + cond.price.toFixed(2)) + '</span></div>';
      });
    });
    const tipRow = tipPct > 0 ? '<div class="kv"><span>Tip ' + tipPct + '%</span><span class="r">\xa3' + tip.toFixed(2) + '</span></div>' : '';
    const html = '<!DOCTYPE html><html><head><meta charset="utf-8"><title>The Taproom Receipt #' + (orderNum||'') + '</title>' +
      '<link href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500;700&family=Archivo+Black&display=swap" rel="stylesheet">' +
      '<style>body{font-family:"DM Mono",monospace;max-width:300px;margin:0 auto;padding:32px 20px;color:#1a1310;background:#fefbf2;}' +
      '.hd{text-align:center;margin-bottom:14px;}.hd-name{font-family:"Archivo Black",sans-serif;font-size:18px;letter-spacing:-0.03em;}' +
      '.hd-sub{font-size:9px;letter-spacing:0.18em;opacity:0.7;margin-top:3px;}.meta{text-align:center;font-size:10.5px;line-height:1.5;color:#3a3530;}' +
      'hr{border:none;border-top:1px dashed #1a1310;margin:9px 0;}' +
      '.kv{display:flex;justify-content:space-between;font-size:11px;padding:1px 0;}.r{font-weight:600;}' +
      '.item{display:flex;justify-content:space-between;font-size:11.5px;padding:2px 0;}' +
      '.addon{display:flex;justify-content:space-between;font-size:10.5px;color:#5a4e46;padding:1px 0;}' +
      '.total{display:flex;justify-content:space-between;font-family:"Archivo Black",sans-serif;font-size:17px;padding:6px 0;letter-spacing:-0.02em;}' +
      '.msg{text-align:center;font-size:10.5px;color:#3a3530;line-height:1.5;margin-top:2px;}' +
      '@media print{body{padding:16px;}}</style></head><body>' +
      '<div class="hd"><div class="hd-name">THE TAPROOM</div><div class="hd-sub">\xb7 PIZZA \xb7</div></div>' +
      '<div class="meta">The Taproom \xb7 St. Ives</div><div class="meta">23 Bridge St \xb7 PE27 5EH</div><div class="meta">01480 492255</div>' +
      '<hr>' +
      '<div class="kv"><span>Order #</span><span class="r">' + (orderNum||'') + '</span></div>' +
      '<div class="kv"><span>Table</span><span class="r">' + String(table).padStart(2,'0') + '</span></div>' +
      '<div class="kv"><span>Time</span><span class="r">' + dateStr + '</span></div>' +
      '<hr>' + itemsHtml + '<hr>' +
      '<div class="kv"><span>Subtotal</span><span class="r">\xa3' + subtotal.toFixed(2) + '</span></div>' +
      tipRow +
      '<div class="total"><span>PAID</span><span>\xa3' + total.toFixed(2) + '</span></div>' +
      '<hr><div class="meta">' + payLabel + '</div>' +
      '<div class="msg">Thanks! Your order is on its way.</div>' +
      '<div class="msg">Tag @taproomstives — free pizza on us</div>' +
      '</body></html>';
    const win = window.open('', '_blank');
    if (win) {
      win.document.write(html);
      win.document.close();
      setTimeout(() => win.print(), 500);
    }
  };

  return (
    <div style={{
      position: 'absolute', inset: 0,
      background: t.bg,
      display: 'flex', flexDirection: 'column',
      animation: 'fadeIn 0.3s ease',
    }} className={t.paperTexture ? 'paper-bg' : ''}>

      {/* Header */}
      <div style={{
        padding: '72px 24px 14px', textAlign: 'center', position: 'relative', zIndex: 2,
      }}>
        <div style={{
          width: 56, height: 56, margin: '0 auto 12px',
          borderRadius: 999,
          background: t.accent, color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          animation: 'pulse 1.6s ease infinite',
        }}>{Icon.check('#fff')}</div>
        <div style={{
          fontFamily: t.headlineFont, fontSize: theme === 'poster' ? 30 : 24,
          fontWeight: 900, color: t.accent, letterSpacing: '-0.025em', lineHeight: 1,
        }}>{theme === 'poster' ? 'paid · order in' : 'Paid · order in'}</div>
        <div style={{
          fontFamily: t.bodyFont, fontSize: 11.5, color: t.inkSoft, marginTop: 6,
          textTransform: 'uppercase', letterSpacing: '0.1em',
        }}>sent to EposNow · table {String(table).padStart(2, '0')}</div>
      </div>

      {/* Printer slot */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 32px 24px', position: 'relative', zIndex: 1 }}>
        <div style={{
          background: '#2a221c',
          borderRadius: `${radius}px ${radius}px 0 0`,
          padding: '6px 12px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', gap: 5 }}>
            <span style={{ width: 7, height: 7, borderRadius: 999, background: '#5b6e5b' }} />
            <span style={{ width: 7, height: 7, borderRadius: 999, background: '#3a2e25' }} />
            <span style={{ width: 7, height: 7, borderRadius: 999, background: '#3a2e25' }} />
          </div>
          <div style={{ fontFamily: '"DM Mono", monospace', fontSize: 9, color: '#a89a85', letterSpacing: '0.1em' }}>EPOSNOW · TILL 1</div>
          <div style={{ fontFamily: '"DM Mono", monospace', fontSize: 9, color: '#a89a85' }}>{printedLines < lines.length ? '●' : '○'}</div>
        </div>

        {/* paper tear top */}
        <div style={{
          background: 'linear-gradient(180deg, #2a221c 0, #2a221c 6px, #fefbf2 6px)',
          paddingTop: 6,
          position: 'relative',
        }}>
          <div style={{
            background: '#fefbf2',
            padding: '14px 18px 4px',
            boxShadow: 'inset 0 8px 12px -8px rgba(0,0,0,0.18), 0 6px 16px rgba(0,0,0,0.12)',
            position: 'relative',
          }}>
            <div style={{ minHeight: 320 }}>
              {visible.map((l, i) => renderLine(l, i))}
              {printedLines < lines.length && (
                <div style={{
                  height: 14,
                  borderTop: '2px solid #1a1310',
                  marginTop: 4,
                  animation: 'pulse 0.8s ease infinite',
                }} />
              )}
            </div>
            {/* jagged paper bottom */}
            <svg width="100%" height="10" viewBox="0 0 200 10" preserveAspectRatio="none" style={{ display: 'block', marginTop: 8 }}>
              <path d="M0 0 L200 0 L200 4 L195 8 L188 4 L181 8 L174 4 L167 8 L160 4 L153 8 L146 4 L139 8 L132 4 L125 8 L118 4 L111 8 L104 4 L97 8 L90 4 L83 8 L76 4 L69 8 L62 4 L55 8 L48 4 L41 8 L34 4 L27 8 L20 4 L13 8 L6 4 L0 8 Z" fill="#fefbf2" />
            </svg>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div style={{ padding: '12px 18px 22px', borderTop: `1px solid ${t.border}`, background: t.bg, position: 'relative', zIndex: 2 }} className={t.paperTexture ? 'paper-bg' : ''}>
        <button onClick={saveReceipt} style={{
          width: '100%',
          background: 'transparent', color: t.accent,
          border: `1.5px solid ${t.accent}`,
          borderRadius: theme === 'minimal' ? 14 : (theme === 'refined' ? 999 : 6),
          padding: '12px', cursor: 'pointer',
          fontFamily: t.bodyFont, fontWeight: 700, fontSize: 14,
          marginBottom: 8,
        }}>Save / print receipt</button>
        <button onClick={onNew} style={{
          width: '100%',
          background: t.buttonBg, color: t.buttonText,
          border: 'none', borderRadius: theme === 'minimal' ? 14 : (theme === 'refined' ? 999 : 6),
          padding: '14px', cursor: 'pointer',
          fontFamily: t.bodyFont, fontWeight: 700, fontSize: 15,
        }}>Order another round</button>
        <div style={{
          textAlign: 'center', marginTop: 10,
          fontFamily: t.bodyFont, fontSize: 11, color: t.inkSoft,
        }}>
          allergens? please ask your server
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// EXPORT
// ─────────────────────────────────────────────
export { MENU, CONDIMENTS, ALL_ITEMS, THEMES, Menu, Cart, Paying, Receipt, Icon };
