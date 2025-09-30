import { Schema } from 'mongoose';

export const orderSchema = new Schema({
  orderId: { type: String, required: true, unique: true },
  clientUserId: { type: String },
  clientGuildId: { type: String },
  clientChannelId: { type: String },
  deliveryGuildId: { type: String },
  deliveryChannelId: { type: String },
  moderatorId: { type: String },
  status: { type: String, default: 'created' },
  createdAt: { type: Date, default: () => new Date() },
  updatedAt: { type: Date, default: () => new Date() }
});
