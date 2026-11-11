import type { RazorpayConstructor } from '../types';

const SCRIPT_SRC = 'https://checkout.razorpay.com/v1/checkout.js';

declare global {
  interface Window {
    Razorpay?: RazorpayConstructor;
  }
}

let loading: Promise<RazorpayConstructor> | null = null;

/**
 * Load Razorpay Checkout on demand (only when someone taps Buy), once. A failed
 * load clears the cache so the next tap can try again instead of failing forever.
 */
export const loadRazorpay = (): Promise<RazorpayConstructor> => {
  if (window.Razorpay) return Promise.resolve(window.Razorpay);
  loading ??= new Promise<RazorpayConstructor>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = SCRIPT_SRC;
    script.async = true;
    script.onload = () =>
      window.Razorpay ? resolve(window.Razorpay) : reject(new Error('Checkout did not load'));
    script.onerror = () => reject(new Error('Checkout did not load'));
    document.head.appendChild(script);
  }).catch((err: unknown) => {
    loading = null;
    document.querySelector(`script[src="${SCRIPT_SRC}"]`)?.remove();
    throw err;
  });
  return loading;
};
