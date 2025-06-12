import mongoose, { ObjectId } from 'mongoose';

export type ObjectIdType = ObjectId;
export type MongooseObjectId = mongoose.Types.ObjectId;

export interface ITokenResponse {
  token: string;
}

export interface ICommonResponse<T> {
  status: string;
  message?: string;
  data?: T;
}
