import { useCallback, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/features/auth';
import { toErrorMessage } from '@/shared/utils/helpers';
import * as passApi from '../api/pass';
import { loadRazorpay } from '../api/razorpayScript';
import type { CheckoutProof, ProductId } from '../types';
import { passKeys } from './queryKeys';

type Phase = 'idle' | 'opening' | 'paying' | 'confirming';

/**
 * Buy a pass: server creates the order (price comes from the server), Razorpay
 * Checkout takes the payment, and the server verifies the proof before anything
 * unlocks. If verification hiccups after a real payment we say so plainly, because
 * the signed webhook will still grant the pass.
 */
export function usePassCheckout() {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const [phase, setPhase] = useState<Phase>('idle');
  // A second tap while Checkout is up must not start a second order.
  const busy = useRef(false);

  const finish = useCallback(() => {
    busy.current = false;
    setPhase('idle');
  }, []);

  const confirm = useCallback(
    async (proof: CheckoutProof, boost: boolean) => {
      setPhase('confirming');
      try {
        const next = await passApi.confirmPayment(proof);
        queryClient.setQueryData(passKeys.me, next);
        toast.success(boost ? 'Boosts added.' : 'Spark Pass is on. Enjoy.');
      } catch {
        // Paid, but we could not confirm in the browser. The webhook will grant it.
        toast("Payment received. It can take a minute to show up.", { duration: 7000 });
        void queryClient.invalidateQueries({ queryKey: passKeys.me });
      } finally {
        finish();
      }
    },
    [queryClient, finish]
  );

  const buy = useCallback(
    async (planId: ProductId) => {
      const boost = planId.startsWith('boost');
      if (busy.current) return;
      busy.current = true;
      setPhase('opening');
      try {
        const [order, Razorpay] = await Promise.all([passApi.createOrder(planId), loadRazorpay()]);
        const checkout = new Razorpay({
          key: order.keyId,
          order_id: order.orderId,
          amount: order.amountPaise,
          currency: order.currency,
          name: 'Whisper Wave',
          description: boost ? 'Boost' : 'Spark Pass',
          theme: { color: '#d4aa5a' },
          prefill: user ? { name: user.name, email: user.email } : undefined,
          handler: (proof) => void confirm(proof, boost),
          modal: { ondismiss: finish, confirm_close: true },
        });
        checkout.on('payment.failed', (res) =>
          toast.error(res.error?.description ?? 'Payment failed. You were not charged.')
        );
        setPhase('paying');
        checkout.open();
      } catch (err) {
        toast.error(toErrorMessage(err));
        finish();
      }
    },
    [user, confirm, finish]
  );

  return { buy, phase, busy: phase !== 'idle' };
}
