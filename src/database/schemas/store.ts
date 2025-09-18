import { Schema } from "mongoose";
import { t } from "../utils.js";

export const storeSchema = new Schema(
    {
        nameid: t.string,
        title: t.string,
        des: t.string,
        itens: [t.itens]
    }
);