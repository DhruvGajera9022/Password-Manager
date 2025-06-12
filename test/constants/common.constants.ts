import mongoose from 'mongoose';
const { ObjectId } = mongoose.Types;

export const expectObjectId = expect.any(ObjectId);
export const expectString = expect.any(String);
export const expectDate = expect.any(Date);
