// app.jsx — Pizza Pop-up · in-house QR ordering
import { useState } from 'react';
import { MENU, CONDIMENTS, THEMES, Menu, Cart, Paying, Receipt } from './screens.jsx';
import { IOSDevice } from './ios.jsx';
import { useTweaks, TweaksPanel, TweakSection, TweakRadio, TweakToggle, TweakButton } from './tweaks-panel.jsx';

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "theme": "poster",
  "layout": "list",
  "showTable": true,
  "tipPrompt": true,
  "qrDesign": "slice"
}/*EDITMODE-END*/;

function readTable() {
  const m = new URL(location.href).searchParams.get('t');
  const n = m ? parseInt(m, 10) : NaN;
  return (Number.isFinite(n) && n >= 1 && n <= 30) ? n : 7;
}

function App() {
  const [tweaks, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [table] = useState(readTable);
  const [screen, setScreen] = useState('menu');
  const [cart, setCart] = useState([]);
  const [tipPct, setTipPct] = useState(10);
  const [payMethod, setPayMethod] = useState('apple');
  const [orderNum, setOrderNum] = useState(null);
  const [orderHistory, setOrderHistory] = useState([]);

  const theme = tweaks.theme;
  const t = THEMES[theme];

  const handlePay = () => {
    setScreen('paying');
    setTimeout(() => {
      const num = String(100 + Math.floor(Math.random() * 800));
      setOrderNum(num);
      setScreen('done');

      // Save this order to session history
      const lineTotal = (line) => {
        const item = MENU.find(m => m.id === line.itemId);
        const condTotal = line.condiments.reduce((s, cid) => {
          const cond = CONDIMENTS.find(c => c.id === cid);
          return s + (cond ? cond.price : 0);
        }, 0);
        return (item ? item.price : 0) + condTotal;
      };
      const subtotal = Math.round(cart.reduce((s, line) => s + lineTotal(line), 0) * 100) / 100;
      const tip = Math.round((subtotal * (tipPct / 100)) * 100) / 100;
      const total = Math.round((subtotal + tip) * 100) / 100;
      const lines = cart.map(line => {
        const item = MENU.find(m => m.id === line.itemId);
        const extras = line.condiments.map(cid => CONDIMENTS.find(c => c.id === cid)).filter(Boolean);
        const label = '1× ' + (item ? item.name : line.itemId) + (extras.length ? ' (+' + extras.map(c => c.name).join(', ') + ')' : '');
        return { label, price: '£' + lineTotal(line).toFixed(2) };
      });
      if (tipPct > 0) lines.push({ label: 'Tip ' + tipPct + '%', price: '£' + tip.toFixed(2) });
      setOrderHistory(h => [...h, { orderNum: num, total, lines }]);
    }, 1800);
  };

  const handleNewOrder = () => {
    setCart([]);
    setTipPct(10);
    setOrderNum(null);
    setScreen('menu');
    // Keep email and optIn so they don't have to re-enter for the next round
  };

  return (
    <>
      <IOSDevice width={402} height={874} dark={false}>
        <div style={{ position: 'absolute', inset: 0, background: t.bg, overflow: 'hidden' }}>
          {screen === 'menu' && (
            <Menu
              theme={theme} layout={tweaks.layout}
              table={table} showTable={tweaks.showTable}
              cart={cart} setCart={setCart}
              onCheckout={() => setScreen('cart')}
              orderHistory={orderHistory}
            />
          )}
          {(screen === 'cart' || screen === 'paying') && (
            <Cart
              theme={theme} cart={cart} setCart={setCart}
              table={table} showTable={tweaks.showTable}
              tipPct={tipPct} setTipPct={setTipPct} tipPrompt={tweaks.tipPrompt}
              payMethod={payMethod} setPayMethod={setPayMethod}
              onBack={() => setScreen('menu')}
              onPay={handlePay}
            />
          )}
          {screen === 'paying' && <Paying theme={theme} payMethod={payMethod} />}
          {screen === 'done' && (
            <Receipt
              theme={theme} cart={cart}
              table={table} tipPct={tipPct} payMethod={payMethod}
              orderNum={orderNum}
              onNew={handleNewOrder}
            />
          )}
        </div>
      </IOSDevice>

      <TweaksPanel title="Tweaks">
        <TweakSection title="Visual theme">
          <TweakRadio
            value={tweaks.theme}
            onChange={v => setTweak('theme', v)}
            options={[
              { value: 'poster',  label: 'Poster' },
              { value: 'refined', label: 'Refined' },
              { value: 'minimal', label: 'Minimal' },
            ]}
          />
        </TweakSection>

        <TweakSection title="Menu layout">
          <TweakRadio
            value={tweaks.layout}
            onChange={v => setTweak('layout', v)}
            options={[
              { value: 'list',  label: 'List' },
              { value: 'cards', label: 'Cards' },
              { value: 'grid',  label: 'Grid' },
            ]}
          />
        </TweakSection>

        <TweakSection title="Table number">
          <TweakToggle value={tweaks.showTable} onChange={v => setTweak('showTable', v)} label="Show on every screen" />
          <div style={{ fontSize: 11, color: '#888', marginTop: 6, lineHeight: 1.4 }}>
            Currently scanned: <b>Table {table}</b>. Try <code>?t=12</code> in the URL.
          </div>
        </TweakSection>

        <TweakSection title="Tipping prompt">
          <TweakToggle value={tweaks.tipPrompt} onChange={v => setTweak('tipPrompt', v)} label="Show tip selector at checkout" />
        </TweakSection>

        <TweakSection title="Jump to screen">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            <TweakButton label="Menu" onClick={() => setScreen('menu')} />
            <TweakButton label="Cart (sample)" onClick={() => {
              if (cart.length === 0) {
                setCart([
                { lineId: 1, itemId: 'margherita', condiments: ['parmesan'] },
                { lineId: 2, itemId: 'diavola', condiments: ['chilli-oil', 'chilli-flakes'] },
                { lineId: 3, itemId: 'garlic', condiments: [] },
                { lineId: 4, itemId: 'garlic', condiments: [] },
              ]);
              }
              setScreen('cart');
            }} />
            <TweakButton label="Paying" onClick={() => {
              if (cart.length === 0) {
                setCart([
                { lineId: 1, itemId: 'margherita', condiments: ['parmesan'] },
                { lineId: 2, itemId: 'diavola', condiments: ['chilli-oil', 'chilli-flakes'] },
                { lineId: 3, itemId: 'garlic', condiments: [] },
                { lineId: 4, itemId: 'garlic', condiments: [] },
              ]);
              }
              setScreen('paying');
            }} />
            <TweakButton label="Receipt" onClick={() => {
              if (cart.length === 0) {
                setCart([
                { lineId: 1, itemId: 'margherita', condiments: ['parmesan'] },
                { lineId: 2, itemId: 'diavola', condiments: ['chilli-oil', 'chilli-flakes'] },
                { lineId: 3, itemId: 'garlic', condiments: [] },
                { lineId: 4, itemId: 'garlic', condiments: [] },
              ]);
              }
              setOrderNum('247');
              setScreen('done');
            }} />
          </div>
        </TweakSection>

        <TweakSection title="QR codes for tables">
          <a href="QR Codes.html" target="_blank" rel="noopener" style={{
            display: 'block', textAlign: 'center', textDecoration: 'none',
            background: '#1a1714', color: '#e87545',
            padding: '10px 12px', borderRadius: 8,
            fontFamily: 'system-ui', fontSize: 13, fontWeight: 600,
            border: '1px solid rgba(232,117,69,0.3)',
          }}>Open QR sheet ↗</a>
          <div style={{ fontSize: 10, color: '#888', marginTop: 6, lineHeight: 1.4 }}>
            Print 30 table QR codes in pizza/slice/plain styles.
          </div>
        </TweakSection>
      </TweaksPanel>
    </>
  );
}

export default App;
