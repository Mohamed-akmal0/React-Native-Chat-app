import mongoose, { Schema, type Document } from "mongoose";

export interface IMessage extends Document {
  chatId: mongoose.Types.ObjectId;
  senderId: mongoose.Types.ObjectId;
  text: string;
  createdAt: Date;
  updatedAt: Date;
  cipherText: string;
  nonce: string
}

const MessageSchema = new Schema<IMessage>(
  {
    chatId: { type: Schema.Types.ObjectId, ref: "Chat", required: true },
    senderId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    // text: { type: String, required: false, trim: true}, // trim is added to remove the extra spaces from the message.
    cipherText: {type: String, required: true},
    nonce: {type: String, required: true}
  },
  { timestamps: true },
);

//we can do indexing for faster queries
MessageSchema.index({chatId: 1, createdAt: 1}); // this will index the chatId and createdAt fields.
// 1 is for ascending order and -1 is for descending order.

const Message = mongoose.model<IMessage>("Message", MessageSchema);

export default Message;
