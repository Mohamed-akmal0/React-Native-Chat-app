import mongoose, { Schema, type Document } from "mongoose";

export interface IMessage extends Document {
  chatId: mongoose.Types.ObjectId;
  senderId: mongoose.Types.ObjectId;
  text: string;
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema = new Schema<IMessage>(
  {
    chatId: { type: Schema.Types.ObjectId, ref: "Chat", required: true },
    senderId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    text: { type: String, required: true, trim: true }, // trim is added to remove the extra spaces from the message.
  },
  { timestamps: true },
);

//we can do indexing for faster queries
MessageSchema.index({chatId: 1, createdAt: 1}); // this will index the chatId and createdAt fields.
// 1 is for ascending order and -1 is for descending order.

const Message = mongoose.model<IMessage>("Message", MessageSchema);

export default Message;
