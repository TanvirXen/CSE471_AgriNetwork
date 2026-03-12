const Joi = require("joi");

const listingSchema = Joi.object({
  title: Joi.string().required().trim(),
  productName: Joi.string().required().trim(),
  categoryType: Joi.string().valid("Crop", "Fish", "Poultry", "Livestock").required(),
  quantity: Joi.number().min(0).required(),
  unitPrice: Joi.number().min(0).required(),
});

module.exports = {
  listingSchema,
};
