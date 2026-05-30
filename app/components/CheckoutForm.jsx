'use client';

/**
 * app/components/CheckoutForm.jsx
 * COD-only checkout form.
 * Receives the cart array from the parent page and includes it in the POST body.
 *
 * Props:
 *   cart         → Array<{ cartItemId, productId, name, colorLabel, size, price }>
 *   onRemoveItem → (cartItemId: string) => void
 */

import { useState }   from 'react';
import { CheckCircle, Package, User, Phone, MapPin, ChevronRight, Trash2 } from 'lucide-react';
import { formatPrice } from '../../lib/products';

const INPUT_BASE =
  'w-full px-4 py-3.5 text-[14px] text-black bg-white ' +
  'border border-black placeholder-gray-300 ' +
  'outline-none focus:border-[2px] focus:border-black ' +
  'transition-all duration-100';

const LABEL_BASE =
  'block text-[10px] font-black tracking-[0.18em] uppercase text-black mb-2';

export default function CheckoutForm({ cart, onRemoveItem }) {
  const [form, setForm] = useState({
    name:    '',
    phone:   '',
    wilaya:  '',
    commune: '',
  });
  const [status,   setStatus]   = useState('idle'); // idle | loading | success | error
  const [errorMsg, setErrorMsg] = useState('');

  const total     = cart.reduce((sum, item) => sum + item.price, 0);
  const cartEmpty = cart.length === 0;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (cartEmpty) return;

    setStatus('loading');
    setErrorMsg('');

    try {
      const res = await fetch('/api/orders', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer: { ...form },
          items:    cart.map(({ productId, name, colorLabel, size, price }) => ({
            productId, name, color: colorLabel, size, price,
          })),
          total,
          payment: 'cash_on_delivery',
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.message ?? 'Something went wrong. Please try again.');
      }

      setStatus('success');
    } catch (err) {
      setStatus('error');
      setErrorMsg(err.message);
    }
  };

  /* ── Success screen ── */
  if (status === 'success') {
    return (
      <section id="order-form" className="max-w-lg mx-auto px-5 py-20">
        <div className="bg-black text-white px-8 py-12 text-center">
          <CheckCircle size={44} strokeWidth={1.2} className="mx-auto mb-7" aria-hidden="true" />
          <h2 className="text-[22px] font-black tracking-[-0.02em] uppercase mb-4">
            Order Confirmed!
          </h2>
          <p className="text-[14px] text-gray-300 leading-[1.75] mb-8">
            Thank you, <strong className="text-white">{form.name}</strong>. Your order has
            been received. We will call{' '}
            <strong className="text-white">{form.phone}</strong> shortly to confirm delivery
            to <strong className="text-white">{form.commune}, {form.wilaya}</strong>.
          </p>

          {/* Order summary in success */}
          <div className="border border-gray-700 divide-y divide-gray-700 text-left mb-7">
            {cart.map((item) => (
              <div key={item.cartItemId} className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className="text-[12px] font-bold text-white">{item.name}</p>
                  <p className="text-[11px] text-gray-500">
                    {item.colorLabel} · {item.size}
                  </p>
                </div>
                <p className="text-[12px] font-black text-white">
                  {formatPrice(item.price)}
                </p>
              </div>
            ))}
            <div className="flex items-center justify-between px-5 py-3">
              <p className="text-[11px] tracking-[0.14em] uppercase text-gray-400">Total</p>
              <p className="text-[14px] font-black text-white">{formatPrice(total)}</p>
            </div>
          </div>

          <p className="text-[10px] text-gray-600 tracking-[0.2em] uppercase">
            Payment: Cash on Delivery
          </p>
        </div>
      </section>
    );
  }

  /* ── Form ── */
  return (
    <section id="order-form" className="border-t border-gray-200 bg-white">
      <div className="max-w-lg mx-auto px-5 py-16">

        {/* Header */}
        <p className="text-[10px] tracking-[0.22em] uppercase text-gray-400 mb-2">
          Final step
        </p>
        <h2 className="text-[28px] font-black tracking-[-0.03em] text-black mb-2">
          Your Order.
        </h2>
        <p className="text-[13px] text-gray-500 leading-[1.7] mb-10">
          Review your selection, fill in your details, and confirm.
          Pay only when your order arrives.
        </p>

        {/* ── Order Summary ── */}
        {cartEmpty ? (
          <div className="border border-dashed border-gray-300 px-6 py-10 text-center mb-10">
            <Package size={28} strokeWidth={1} className="mx-auto mb-3 text-gray-300" aria-hidden="true" />
            <p className="text-[12px] text-gray-400 leading-relaxed">
              Your order is empty. Scroll up and add a product first.
            </p>
          </div>
        ) : (
          <div className="border border-black mb-10">
            {/* Items */}
            <div className="divide-y divide-gray-200">
              {cart.map((item) => (
                <div key={item.cartItemId} className="flex items-center justify-between px-5 py-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-bold text-black truncate">{item.name}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      {item.colorLabel} · Size {item.size}
                    </p>
                  </div>
                  <div className="flex items-center gap-4 ml-4 shrink-0">
                    <p className="text-[13px] font-black text-black">
                      {formatPrice(item.price)}
                    </p>
                    {onRemoveItem && (
                      <button
                        type="button"
                        onClick={() => onRemoveItem(item.cartItemId)}
                        aria-label={`Remove ${item.name} (${item.colorLabel}, ${item.size}) from order`}
                        className="text-gray-300 hover:text-black transition-colors"
                      >
                        <Trash2 size={14} strokeWidth={1.5} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Total */}
            <div className="border-t border-black flex items-center justify-between px-5 py-4 bg-black">
              <p className="text-[10px] tracking-[0.18em] uppercase text-gray-400 font-bold">
                Total to Pay on Delivery
              </p>
              <p className="text-[16px] font-black text-white">
                {formatPrice(total)}
              </p>
            </div>
          </div>
        )}

        {/* ── Customer Form ── */}
        <form onSubmit={handleSubmit} noValidate className="space-y-6">

          {/* Full Name */}
          <div>
            <label htmlFor="name" className={LABEL_BASE}>Full Name</label>
            <div className="relative">
              <User
                size={14} strokeWidth={1.5}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none"
                aria-hidden="true"
              />
              <input
                id="name" name="name" type="text" required
                autoComplete="name"
                placeholder="Your full name"
                value={form.name}
                onChange={handleChange}
                className={`${INPUT_BASE} pl-10`}
              />
            </div>
          </div>

          {/* Phone */}
          <div>
            <label htmlFor="phone" className={LABEL_BASE}>Phone Number</label>
            <div className="relative">
              <Phone
                size={14} strokeWidth={1.5}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none"
                aria-hidden="true"
              />
              <input
                id="phone" name="phone" type="tel" required
                autoComplete="tel"
                placeholder="05XX XX XX XX"
                value={form.phone}
                onChange={handleChange}
                className={`${INPUT_BASE} pl-10`}
              />
            </div>
          </div>

          {/* Wilaya + Commune */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="wilaya" className={LABEL_BASE}>Wilaya</label>
              <div className="relative">
                <MapPin
                  size={14} strokeWidth={1.5}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none"
                  aria-hidden="true"
                />
                <input
                  id="wilaya" name="wilaya" type="text" required
                  placeholder="e.g. Oran"
                  value={form.wilaya}
                  onChange={handleChange}
                  className={`${INPUT_BASE} pl-9`}
                />
              </div>
            </div>
            <div>
              <label htmlFor="commune" className={LABEL_BASE}>Commune</label>
              <div className="relative">
                <MapPin
                  size={14} strokeWidth={1.5}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none"
                  aria-hidden="true"
                />
                <input
                  id="commune" name="commune" type="text" required
                  placeholder="Your city"
                  value={form.commune}
                  onChange={handleChange}
                  className={`${INPUT_BASE} pl-9`}
                />
              </div>
            </div>
          </div>

          {/* Error */}
          {status === 'error' && (
            <div role="alert" className="border border-black px-4 py-3 flex items-start gap-3">
              <span className="text-[11px] font-black tracking-wide uppercase text-black shrink-0">Error</span>
              <span className="text-[12px] text-gray-600">{errorMsg}</span>
            </div>
          )}

          {/* COD notice */}
          <div className="border border-gray-200 bg-[#F9F9F9] p-4 flex items-start gap-3">
            <Package size={15} strokeWidth={1.5} className="text-black shrink-0 mt-0.5" aria-hidden="true" />
            <p className="text-[12px] text-gray-500 leading-[1.65]">
              <strong className="text-black font-bold">Cash on Delivery only.</strong>{' '}
              No card required. You pay when the courier hands you your package.
            </p>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={status === 'loading' || cartEmpty}
            aria-busy={status === 'loading'}
            className={`
              w-full font-black text-[12px] tracking-[0.2em] uppercase
              py-[20px]
              flex items-center justify-center gap-3
              border-2 border-black
              transition-all duration-150 active:scale-[0.99] mt-2
              ${cartEmpty
                ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                : status === 'loading'
                  ? 'bg-black text-white opacity-60 cursor-not-allowed'
                  : 'bg-black text-white hover:bg-neutral-800'
              }
            `}
          >
            {status === 'loading' ? (
              <>
                <span
                  className="inline-block w-[14px] h-[14px] border-2 border-white border-t-transparent rounded-full animate-spin"
                  aria-hidden="true"
                />
                Processing…
              </>
            ) : (
              <>
                Confirm My Order
                <ChevronRight size={15} aria-hidden="true" />
              </>
            )}
          </button>

          {cartEmpty && (
            <p className="text-center text-[11px] text-gray-400">
              Add at least one product above before confirming.
            </p>
          )}

          <p className="text-center text-[11px] text-gray-400 leading-[1.6]">
            By confirming you agree to our terms of service.
            <br />Your personal data is kept strictly private.
          </p>
        </form>
      </div>
    </section>
  );
}
