import { Document } from "mongoose";

export const removePassword = (doc: Document) => {
  const obj = doc.toObject();
  if ('password' in obj) {
    delete obj.password;
  }
  return obj;
};
