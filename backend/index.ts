import app from "./src/app";
import { connectDB } from "./src/config/database";

const PORT = process.env.PORT || 3000;

connectDB().then(() => {
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    })
}).catch((error) => {
    console.error(`Error connecting to MongoDB: ${error}`);
    process.exit(1); // exit with failure
    // status code 1 means failure
    // status code 0 means success
});
