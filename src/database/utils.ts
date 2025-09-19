import { Schema } from "mongoose";

export const p = {
   string: { type: String, required: true },
   number: { type: Number, required: true },
   boolean: { type: Boolean, required: true },
   date: { type: Date, required: true }
};

export const t = Object.assign(p, {
   itens: new Schema({
    name: p.string,
    title: p.string,
    value: p.number,
    des: p.string,
    emoji: p.string,
    stock: p.number
})
});