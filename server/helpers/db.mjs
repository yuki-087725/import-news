import mongoose from "mongoose";
import env from "dotenv";
env.config();

await mongoose.connect(process.env.MONGO_URI);

export default mongoose;
