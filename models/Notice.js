const mongoose = require('mongoose');
const User = require('./User');
const Schema = mongoose.Schema;
const noticeSchema = Schema(
  {
    author: { type: mongoose.ObjectId, ref: User },
    title: { type: String, required: true },
    content: { type: String, required: true },
    views: { type: Number, default: 0 },
  },
  { timestamps: true },
);

noticeSchema.methods.toJSON = function () {
  const obj = this._doc;
  delete obj.__v;
  delete obj.updatedAt;
  return obj;
};

const Notice = mongoose.model('Notice', noticeSchema);
module.exports = Notice;
