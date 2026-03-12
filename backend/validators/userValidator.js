const Joi = require("joi");

const userSchema = Joi.object({
  fullName: Joi.string().required().trim(),
  email: Joi.string().email().lowercase().trim(),
  phone: Joi.string().required().trim(),
  password: Joi.string().min(6).required(),
  role: Joi.string().valid("Farmer", "Vendor", "Wholesaler", "DeliveryPartner", "Admin", "Moderator").required(),
});

module.exports = {
  userSchema,
};
