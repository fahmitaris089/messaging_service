const mongoose = require("mongoose");

const contentSchema = new mongoose.Schema({
  message: { type: String, required: true },
  type: { type: String, required: true },
  slug: { type: String, required: true },
  title: { type: String },
  image: { type: String },
  brand_name: { type: String },
  service_uuid: { type: String },
  offer_uuid: { type: String },
  uuid: { type: String },
  number: { type: String },
  created_at: { type: Date, required: true },
  user_id: { type: String, required: true },
  status: { type: String, required: true },
});

const contactSchema = new mongoose.Schema({
  user_id: { type: String, required: true },
  type: { type: String, required: true },
  name: { type: String },
  email: { type: String },
  avatar: { type: String },
  company_uuid: { type: String },
  company_name: { type: String },
  brand_name: { type: String },
  brand_uuid: { type: String },
});

const chatSchema = new mongoose.Schema({
  type: { type: String, required: true },
  content: { type: [contentSchema], default: [] },
  contacts: { type: [contactSchema], default: [] },
});

module.exports = mongoose.model("Chat", chatSchema);
