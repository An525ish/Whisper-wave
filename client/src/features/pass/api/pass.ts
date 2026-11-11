import { api } from '@/shared/lib/api/client';
import type { ApiSuccess } from '@/shared/types';
import type { CheckoutProof, CreatedOrder, Entitlements, PlansData, ProductId } from '../types';

type Wrapped<T> = ApiSuccess<T> & { data: T };

export const getPlans = async (): Promise<PlansData> =>
  (await api.get<Wrapped<PlansData>>('/payments/plans')).data;

export const getEntitlements = async (): Promise<Entitlements> =>
  (await api.get<Wrapped<Entitlements>>('/payments/me')).data;

export const createOrder = async (planId: ProductId): Promise<CreatedOrder> =>
  (await api.post<Wrapped<CreatedOrder>>('/payments/order', { planId })).data;

export const confirmPayment = async (proof: CheckoutProof): Promise<Entitlements> =>
  (await api.post<Wrapped<Entitlements>>('/payments/confirm', proof)).data;

export const activateBoost = async (): Promise<Entitlements> =>
  (await api.post<Wrapped<Entitlements>>('/payments/boost/activate', {})).data;
