import mongoose, { InferSchemaType, model } from "mongoose";
import { storeSchema } from "./schemas/store.js";
import { logger } from "#base";
import { env } from "#env";
import chalk from "chalk";

try {
   logger.log(chalk.blue("Connecting to MongoDB..."));
   await mongoose.connect(env.MONGO_URI, { 
      dbName: env.DATABASE_NAME || "database" 
   });
   logger.success(chalk.green("MongoDB connected"));
} catch(err){
   logger.error(err);
   process.exit(1);
}

export const db = {
   store: model("store", storeSchema, "stores"),
};
export type StoreSchema = InferSchemaType<typeof storeSchema>;