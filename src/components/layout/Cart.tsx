'use client';

import { Fragment, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, MinusIcon, PlusIcon, TagIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';
import Link from 'next/link';

import { useCartStore } from '@/lib/store/cart-store';
import { useWishlistStore } from '@/lib/store/wishlist-store';
import { formatPrice } from '@/lib/utils/index';
import { toast } from 'react-hot-toast';
import { api } from '@/lib/services/api';

export default function Cart() {
  const { 
    items, 
    isOpen,
    totalPrice,
    subtotalPrice,
    discountAmount,
    taxAmount,
    appliedCoupon,
    toggleCart, 
    updateQuantity, 
    removeItem,
    applyCoupon,
    removeCoupon
  } = useCartStore();
  const { addToWishlist } = useWishlistStore();
  
  const [couponCode, setCouponCode] = useState('');
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-[60]" onClose={toggleCart}>
        <Transition.Child
          as={Fragment}
          enter="ease-in-out duration-500"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in-out duration-500"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
              <Transition.Child
                as={Fragment}
                enter="transform transition ease-in-out duration-500 sm:duration-700"
                enterFrom="translate-x-full"
                enterTo="translate-x-0"
                leave="transform transition ease-in-out duration-500 sm:duration-700"
                leaveFrom="translate-x-0"
                leaveTo="translate-x-full"
              >
                <Dialog.Panel className="pointer-events-auto w-screen max-w-md">
                  <div className="flex h-full flex-col overflow-y-scroll bg-white shadow-xl">
                    <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-6">
                      <div className="flex items-start justify-between">
                        <Dialog.Title className="text-lg font-medium text-gray-900">
                          Shopping cart
                        </Dialog.Title>
                        <div className="ml-3 flex h-7 items-center">
                          <button
                            type="button"
                            className="-m-2 p-2 text-gray-400 hover:text-gray-500"
                            onClick={toggleCart}
                          >
                            <span className="sr-only">Close panel</span>
                            <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                          </button>
                        </div>
                      </div>

                      <div className="mt-8">
                        <div className="flow-root">
                          {items.length === 0 ? (
                            <div className="text-center py-12">
                              <div className="text-gray-500 mb-4">Your cart is empty</div>
                              <Link
                                href="/shop"
                                className="inline-block bg-gray-900 border border-gray-900 text-white px-8 py-4 rounded-none text-xs font-bold uppercase tracking-widest hover:bg-white hover:text-gray-900 transition-colors"
                                onClick={toggleCart}
                              >
                                Continue Shopping
                              </Link>
                            </div>
                          ) : (
                            <ul role="list" className="-my-6 divide-y divide-gray-200">
                              {items.map((item) => (
                                <li key={item.productId} className="flex py-6">
                                  <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-none border border-gray-100">
                                    <Image
                                      src={item.product.images[0]?.src || '/images/placeholder.svg'}
                                      alt={item.product.images[0]?.alt || item.product.name}
                                      width={96}
                                      height={96}
                                      className="h-full w-full object-cover object-center"
                                    />
                                  </div>

                                  <div className="ml-4 flex flex-1 flex-col">
                                    <div>
                                      <div className="flex justify-between text-base font-medium text-gray-900">
                                        <h3>
                                          <Link 
                                            href={`/products/${item.product.slug}`}
                                            onClick={toggleCart}
                                            className="hover:text-[var(--ring)]"
                                          >
                                            {item.product.name}
                                          </Link>
                                        </h3>
                                        <p className="ml-4">{formatPrice(item.product.price)}</p>
                                      </div>
                                      {item.product.compareAtPrice && item.product.compareAtPrice > item.product.price && (
                                        <p className="text-sm text-gray-500 line-through">
                                          {formatPrice(item.product.compareAtPrice)}
                                        </p>
                                      )}
                                    </div>
                                    <div className="flex flex-1 items-end justify-between text-sm">
                                      <div className="flex items-center space-x-2">
                                        <button
                                          onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                                          className="flex h-8 w-8 items-center justify-center rounded-none border border-gray-200 hover:border-gray-900 transition-colors"
                                        >
                                          <MinusIcon className="h-4 w-4" />
                                        </button>
                                        <span className="text-gray-900 px-2 text-xs uppercase tracking-widest">Qty {item.quantity}</span>
                                        <button
                                          onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                                          className="flex h-8 w-8 items-center justify-center rounded-none border border-gray-200 hover:border-gray-900 transition-colors"
                                        >
                                          <PlusIcon className="h-4 w-4" />
                                        </button>
                                      </div>

                                      <div className="flex space-x-4">
                                        <button
                                          type="button"
                                          onClick={async () => {
                                            addToWishlist(item.product);
                                            removeItem(item.productId);
                                            // Mirror to server wishlist for authenticated users (silently ignore errors)
                                            try { await api.wishlist.add(item.productId); } catch {}
                                            toast.success('Saved for later');
                                          }}
                                          className="font-medium text-gray-700 hover:text-gray-900"
                                        >
                                          Save for later
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => removeItem(item.productId)}
                                          className="font-medium text-xs uppercase tracking-widest text-gray-500 hover:text-gray-900"
                                        >
                                          Remove
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </div>
                    </div>

                    {items.length > 0 && (
                      <div className="border-t border-gray-200 px-4 py-6 sm:px-6">
                        {/* Coupon Code Section */}
                        <div className="mb-4">
                          {!appliedCoupon ? (
                            <div className="space-y-2">
                              <label htmlFor="coupon" className="block text-sm font-medium text-gray-700">
                                Have a coupon code?
                              </label>
                              <div className="flex space-x-2">
                                <input
                                  type="text"
                                  id="coupon"
                                  value={couponCode}
                                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                                  placeholder="Enter code"
                                  className="flex-1 px-3 py-2 border border-gray-200 rounded-none text-xs uppercase tracking-widest focus:outline-none focus:ring-0 focus:border-gray-900"
                                />
                                <button
                                  onClick={async () => {
                                    if (!couponCode.trim()) return;
                                    setIsApplyingCoupon(true);
                                    const result = await applyCoupon(couponCode.trim());
                                    if (result.success) {
                                      toast.success(result.message);
                                      setCouponCode('');
                                    } else {
                                      toast.error(result.message);
                                    }
                                    setIsApplyingCoupon(false);
                                  }}
                                  disabled={!couponCode.trim() || isApplyingCoupon}
                                  className="px-4 py-2 border border-gray-900 bg-gray-900 text-white text-[10px] uppercase tracking-widest font-bold rounded-none hover:bg-white hover:text-gray-900 disabled:bg-gray-200 disabled:border-gray-200 disabled:text-gray-400 transition-colors"
                                >
                                  {isApplyingCoupon ? 'Applying...' : 'Apply'}
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between bg-stone-50 border border-gray-200 rounded-none p-3">
                              <div className="flex items-center space-x-2">
                                <TagIcon className="h-4 w-4 text-gray-900" />
                                <span className="text-xs uppercase tracking-widest text-gray-900 font-bold">
                                  Coupon {appliedCoupon} applied
                                </span>
                              </div>
                              <button
                                onClick={() => {
                                  removeCoupon();
                                  toast.success('Coupon removed');
                                }}
                                className="text-sm text-green-600 hover:text-green-700 font-medium"
                              >
                                Remove
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Price Breakdown */}
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Subtotal</span>
                            <span>{formatPrice(subtotalPrice)}</span>
                          </div>
                          {discountAmount > 0 && (
                            <div className="flex justify-between text-green-600">
                              <span>Discount ({appliedCoupon})</span>
                              <span>-{formatPrice(discountAmount)}</span>
                            </div>
                          )}
                          <div className="flex justify-between">
                            <span className="text-gray-600">Tax (GST 18%)</span>
                            <span>{formatPrice(taxAmount)}</span>
                          </div>
                          <div className="border-t border-gray-200 pt-2">
                            <div className="flex justify-between text-base font-medium text-gray-900">
                              <span>Total</span>
                              <span>{formatPrice(totalPrice)}</span>
                            </div>
                          </div>
                        </div>
                        
                        <p className="mt-2 text-xs text-gray-500">
                          Shipping calculated at checkout.
                        </p>
                        
                        <div className="mt-6">
                          <Link
                            href="/checkout"
                            className="flex items-center justify-center rounded-none border border-gray-900 bg-gray-900 px-6 py-4 text-xs font-bold uppercase tracking-widest text-white hover:bg-white hover:text-gray-900 transition-colors"
                            onClick={toggleCart}
                          >
                            Checkout
                          </Link>
                        </div>
                        
                        <div className="mt-6 flex justify-center text-center text-sm text-gray-500">
                          <p>
                            or{' '}
                            <button
                              type="button"
                              className="font-medium text-gray-900 hover:text-gray-500 underline underline-offset-4 decoration-1 text-xs uppercase"
                              onClick={toggleCart}
                            >
                              Continue Shopping
                              <span aria-hidden="true"> &rarr;</span>
                            </button>
                          </p>
                        </div>
                        
                        {/* Available Coupons Hint */}
                        {!appliedCoupon && (
                          <div className="mt-4 text-center">
                            <details className="text-xs text-gray-500">
                              <summary className="cursor-pointer hover:text-gray-700">
                                Available offers
                              </summary>
                              <div className="mt-2 space-y-1 text-left">
                                <div>• WELCOME10: 10% off on orders above ₹500</div>
                                <div>• SAVE200: ₹200 off on orders above ₹1000</div>
                                <div>• FREESHIP: Free shipping above ₹799</div>
                                <div>• NEWUSER15: 15% off on orders above ₹1500</div>
                              </div>
                            </details>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
