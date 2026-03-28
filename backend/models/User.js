const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const AddressSchema = new mongoose.Schema(
  {
    label: {
      type: String,
      enum: ["Home", "Farm", "Warehouse", "Office", "Other"],
      default: "Other",
    },
    contactName: { type: String, trim: true },
    phone: { type: String, trim: true },
    division: { type: String, trim: true },
    district: { type: String, trim: true },
    upazila: { type: String, trim: true },
    unionName: { type: String, trim: true },
    village: { type: String, trim: true },
    fullAddress: { type: String, trim: true },
    postalCode: { type: String, trim: true },
    coordinates: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number], // [lng, lat]
        default: [0, 0],
      },
    },
    isDefault: { type: Boolean, default: false },
  },
  { _id: false }
);

const UserProfileSchema = new mongoose.Schema(
  {
    avatar: { type: String, trim: true },
    coverPhoto: { type: String, trim: true },
    bio: { type: String, trim: true, maxlength: 1000 },
    organizationName: { type: String, trim: true },
    shopName: { type: String, trim: true },
    farmName: { type: String, trim: true },
    tradeLicenseNo: { type: String, trim: true },
    productCategories: [{ type: String, trim: true }],
    nidNumber: { type: String, trim: true },
    nidNumberMasked: { type: String, trim: true },
    nidPhotos: {
      front: { type: String, trim: true },
      back: { type: String, trim: true },
    },
    dateOfBirth: { type: Date },
    gender: {
      type: String,
      enum: ["Male", "Female", "Other", "Prefer not to say"],
    },
    preferredLanguage: { type: String, default: "bn" },
    profileCompletion: { type: Number, default: 0, min: 0, max: 100 },
    badges: [{ type: String, trim: true }],
    trustScore: { type: Number, default: 0, min: 0, max: 100 },
    averageRating: { type: Number, default: 0, min: 0, max: 5 },
    totalReviews: { type: Number, default: 0, min: 0 },
    totalCompletedTransactions: { type: Number, default: 0, min: 0 },
  },
  { _id: false }
);

const UserSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true, index: true },
    email: { type: String, trim: true, lowercase: true, sparse: true, index: true },
    phone: { type: String, required: true, trim: true, unique: true, index: true },
    passwordHash: { type: String, required: true },

    role: {
      type: String,
      required: true,
<<<<<<< HEAD
      enum: ["Customer", "Farmer", "Vendor", "Wholesaler", "DeliveryPartner", "Admin", "Moderator"],
=======
      enum: ["Farmer", "Vendor", "Wholesaler", "DeliveryPartner", "Admin", "Moderator"],
>>>>>>> upstream/main
      index: true,
    },

    subRoles: [{ type: String, trim: true }],

    status: {
      type: String,
      enum: ["Pending", "Active", "Suspended", "Blocked", "Deleted"],
      default: "Pending",
      index: true,
    },

    authProvider: {
      type: String,
      enum: ["local", "google", "facebook", "apple"],
      default: "local",
    },

    isEmailVerified: { type: Boolean, default: false },
    isPhoneVerified: { type: Boolean, default: false },

    profile: { type: UserProfileSchema, default: () => ({}) },

    addresses: { type: [AddressSchema], default: [] },

    currentLocation: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number],
        default: [0, 0],
      },
      updatedAt: { type: Date },
    },

    profileVisibility: {
      type: String,
      enum: ["Public", "Private", "MarketplaceOnly"],
      default: "Public",
    },

    adminNotes: { type: String, trim: true },
    deletedAt: { type: Date },

    linkedProfiles: [
      {
        role: {
          type: String,
          enum: ["Farmer", "Vendor", "Wholesaler", "DeliveryPartner"],
        },
        profileLabel: { type: String, trim: true },
        isActive: { type: Boolean, default: true },
      },
    ],

    lastLoginAt: { type: Date },
    deviceInfo: [{ type: String, trim: true }],
  },
  { timestamps: true }
);

UserSchema.pre("save", async function (next) {
  if (!this.isModified("passwordHash")) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
    next();
  } catch (err) {
    next(err);
  }
});

UserSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.passwordHash);
};

UserSchema.index({ "currentLocation.coordinates": "2dsphere" });
UserSchema.index({ fullName: "text", phone: "text", email: "text", "profile.organizationName": "text" });

module.exports = mongoose.model("User", UserSchema);
