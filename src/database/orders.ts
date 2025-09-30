import mongoose from 'mongoose';
import { orderSchema } from './schemas/order.js';

const OrderModel = mongoose.models.order || mongoose.model('order', orderSchema, 'orders');

export async function createOrder(data: {
  orderId: string;
  clientUserId?: string | null;
  clientGuildId?: string | null;
  clientChannelId?: string | null;
  deliveryGuildId?: string | null;
  deliveryChannelId?: string | null;
  status?: string;
}) {
  const doc = new OrderModel({
    orderId: data.orderId,
    clientUserId: data.clientUserId || null,
    clientGuildId: data.clientGuildId || null,
    clientChannelId: data.clientChannelId || null,
    deliveryGuildId: data.deliveryGuildId || null,
    deliveryChannelId: data.deliveryChannelId || null,
    status: data.status || 'created'
  });
  await doc.save();
  return doc.toObject();
}

export async function getOrderById(orderId: string) {
  const doc = await OrderModel.findOne({ orderId }).lean();
  return doc;
}

export async function updateOrder(orderId: string, update: Record<string, any>) {
  update.updatedAt = new Date();
  const doc = await OrderModel.findOneAndUpdate({ orderId }, { $set: update }, { new: true, upsert: false }).lean();
  return doc;
}

export async function setOrderModerator(orderId: string, moderatorId: string) {
  return updateOrder(orderId, { moderatorId });
}
