"use client";

/**
 * app/components/ProductCard.jsx
 * Full product section: image, price, color + size selectors, add-to-order CTA.
 * Writes to the shared cart state via the onAddToCart callback.
 *
 * Props:
 *   product      → product object from lib/products.js
 *   onAddToCart  → ({ cartItemId, productId, name, color, colorLabel, size, price }) => void
 *
 * Multi-variant behaviour: every "Add to Order" click appends a NEW cart line
 * identified by a UUID. The button resets after 1.5 s so the user can add
 * another variant (or the same one again) immediately.
 */

import { useState, useRef } from "react";
import { Package, Check, Minus, Plus } from "lucide-react";
import Image from "next/image";
import ColorSelector from "./ColorSelector";
import SizeSelector from "./SizeSelector";
import { formatPrice, isInStock } from "../../lib/products";

export default function ProductCard({ product, onAddToCart }) {
  const colorKeys = Object.keys(product.variants);

  const [selectedColor, setSelectedColor] = useState(colorKeys[0]);
  const [selectedSize, setSelectedSize] = useState(null);
  const [sizeError, setSizeError] = useState(false);
  const [added, setAdded] = useState(false);
  const touchStartX = useRef(null);

  // When color changes, clear size if the chosen size is OOS in new color
  const handleColorChange = (colorKey) => {
    setSelectedColor(colorKey);
    if (selectedSize && !isInStock(product, colorKey, selectedSize)) {
      setSelectedSize(null);
    }
    setAdded(false);
  };

  // Swipe gesture handlers — cycle through colorKeys
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(delta) < 50) return; // ignore small taps
    const currentIndex = colorKeys.indexOf(selectedColor);
    if (delta < 0) {
      // swipe left → next color
      const next = colorKeys[(currentIndex + 1) % colorKeys.length];
      handleColorChange(next);
    } else {
      // swipe right → previous color
      const prev =
        colorKeys[(currentIndex - 1 + colorKeys.length) % colorKeys.length];
      handleColorChange(prev);
    }
  };

  const handleSizeChange = (size) => {
    setSelectedSize(size);
    setSizeError(false);
    setAdded(false);
  };

  const handleAddToOrder = () => {
    if (!selectedSize) {
      setSizeError(true);
      return;
    }
    setSizeError(false);
    setAdded(true);

    onAddToCart({
      cartItemId: crypto.randomUUID(), // unique per add — allows duplicates
      productId: product.id,
      name: product.name,
      color: selectedColor,
      colorLabel: product.variants[selectedColor].label,
      size: selectedSize,
      price: product.price,
    });

    // Reset after 1.5 s so the user can add another variant immediately
    setTimeout(() => setAdded(false), 1500);
  };

  const stockMap = product.stock?.[selectedColor] ?? {};

  return (
    <article className="border-t border-gray-200">
      {/* ── Product Image ───────────────────────────── */}
      <div
        className={`
          w-full aspect-[3/4] max-w-lg mx-auto
          flex flex-col items-center justify-center
          relative overflow-hidden
          ${selectedColor === "black" ? "bg-[#111]" : "bg-[#F5F5F5]"}
          transition-colors duration-300
          cursor-grab active:cursor-grabbing
        `}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Grid texture */}
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(0deg,#888 0,#888 1px,transparent 1px,transparent 60px)," +
              "repeating-linear-gradient(90deg,#888 0,#888 1px,transparent 1px,transparent 60px)",
          }}
        />

        {product.variants[selectedColor].image ? (
          <Image
            src={product.variants[selectedColor].image}
            alt={`${product.name} in ${product.variants[selectedColor].label}`}
            fill
            priority
            quality={85}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover"
          />
        ) : (
          <div className="flex flex-col items-center gap-3 relative z-10">
            <Package
              size={68}
              strokeWidth={0.8}
              className={
                selectedColor === "black" ? "text-gray-700" : "text-gray-300"
              }
              aria-hidden="true"
            />
            <p
              className={`text-[10px] tracking-[0.22em] uppercase ${
                selectedColor === "black" ? "text-gray-600" : "text-gray-400"
              }`}
            >
              {product.variants[selectedColor].label} · {product.name}
            </p>
          </div>
        )}

        {/* Swipe dot indicators */}
        {colorKeys.length > 1 && (
          <div
            className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5 z-10"
            aria-hidden="true"
          >
            {colorKeys.map((key) => (
              <span
                key={key}
                className={`
                  block rounded-full transition-all duration-300
                  ${
                    key === selectedColor
                      ? "w-4 h-1.5 bg-white"
                      : "w-1.5 h-1.5 bg-white/40"
                  }
                `}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Product Info ────────────────────────────── */}
      <div className="max-w-lg mx-auto px-5 pt-9 pb-14 space-y-8">
        {/* Name + tagline */}
        <div>
          <p className="text-[10px] tracking-[0.22em] uppercase text-gray-400 mb-2">
            EMPRNTE Collection
          </p>
          <h2 className="text-[30px] font-black tracking-[-0.03em] text-black leading-none mb-2">
            {product.name}
          </h2>
          <p className="text-[13px] text-gray-500">{product.tagline}</p>
        </div>

        {/* Color selector */}
        <ColorSelector
          colors={colorKeys}
          selected={selectedColor}
          onChange={handleColorChange}
        />

        {/* Divider */}
        <div className="border-t border-gray-200" />

        {/* Price */}
        <div>
          <span className="text-[34px] font-black tracking-[-0.03em] text-black leading-none">
            {formatPrice(product.price)}
          </span>
        </div>

        {/* Size selector */}
        <SizeSelector
          sizes={product.sizes}
          selected={selectedSize}
          onChange={handleSizeChange}
          stockMap={stockMap}
          error={sizeError}
        />

        {/* Add to Order CTA */}
        <button
          type="button"
          onClick={handleAddToOrder}
          className={`
            w-full
            font-black text-[12px] tracking-[0.2em] uppercase
            py-[18px]
            flex items-center justify-center gap-3
            border-2
            transition-all duration-200
            active:scale-[0.99]
            ${
              added
                ? "bg-white text-black border-black"
                : "bg-black text-white border-black hover:bg-neutral-800"
            }
          `}
        >
          {added ? (
            <>
              <Check size={15} strokeWidth={2.5} aria-hidden="true" />
              Added to Order
            </>
          ) : (
            <>
              <Plus size={15} aria-hidden="true" />
              Add to Order
            </>
          )}
        </button>

        {/* Hint shown briefly after adding — resets with the button */}
        {added && (
          <p className="text-center text-[11px] text-gray-400">
            Pick another colour or size and add again to order more.
          </p>
        )}
      </div>
    </article>
  );
}
