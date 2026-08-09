import app from "./src/app";
import { connectDB } from "./src/config/database";
import { createServer } from "http";
import { initializeSocket } from "./src/utils/socket";

const PORT = process.env.PORT || 3000;

const httpServer = createServer(app);

initializeSocket(httpServer);

connectDB().then(() => {
    httpServer.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    })
}).catch((error) => {
    console.error(`Error connecting to MongoDB: ${error}`);
    process.exit(1); // exit with failure
    // status code 1 means failure
    // status code 0 means success
});
