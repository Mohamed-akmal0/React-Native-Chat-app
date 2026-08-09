import express from "express";
import authRoutes from "./routes/authRoutes";
import userRoutes from "./routes/userRoutes";
import chatRoutes from "./routes/chatRoutes";
import messageRoutes from "./routes/messageRoutes";
import { clerkMiddleware } from "@clerk/express";
import { errorHandler } from "./middleware/errorHandler";

const app = express();

app.use(express.json()); // pareses incoming json request bodies and makes them available in req.body

app.use(clerkMiddleware()); // this middleware is used to authenticate the requests

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/chats", chatRoutes);
app.use("/api/v1/messages", messageRoutes);

//error handler must come after all the routes and other middlewares so they can catch errors passes with next(err)
// or thrown inside the async handlers.
app.use(errorHandler);

export default app;
