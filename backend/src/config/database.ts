import mongoose from "mongoose";

export const connectDB = async () => {
    try {
        const mongoURI = process.env.MONGODB_URI as string;
        if(!mongoURI){
            throw new Error("MONGODB_URI is not defined in the environment variables");
        }
        // using bun we don't need to use .env package.
        const connection = await mongoose.connect(mongoURI);
        console.log(`Connected to MongoDB: ${connection.connection.host}`);
    } catch (error) {
        console.error(`Error connecting to MongoDB: ${error}`);
        process.exit(1); // exit with failure
        // status code 1 means failure
        // status code 0 means success
    }
}