const User = require("../models/User");
const jwt = require("jsonwebtoken");

const ALLOWED_ROLES = User.schema.path("role").enumValues || [];

const ROLE_ALIAS_MAP = {
  customer: "Customer",
  farmer: "Farmer",
  vendor: "Vendor",
  wholesaler: "Wholesaler",
  deliverypartner: "DeliveryPartner",
  delivery_partner: "DeliveryPartner",
  admin: "Admin",
  moderator: "Moderator",
};

const resolveRole = (role) => {
  if (typeof role !== "string") return null;

  const trimmed = role.trim();
  if (!trimmed) return null;

  const alias = ROLE_ALIAS_MAP[trimmed.toLowerCase().replace(/\s+/g, "")];
  if (alias && ALLOWED_ROLES.includes(alias)) return alias;

  const caseInsensitiveMatch = ALLOWED_ROLES.find(
    (allowedRole) => allowedRole.toLowerCase() === trimmed.toLowerCase()
  );
  return caseInsensitiveMatch || null;
};

// @route   POST api/auth/register
// @desc    Register user
// @access  Public
exports.register = async (req, res) => {
  const { fullName, phone, password, role } = req.body;

  try {
    let user = await User.findOne({ phone });

    if (user) {
      return res.status(400).json({ message: "User already exists with this phone number" });
    }

    const normalizedRole = resolveRole(role);
    if (!normalizedRole) {
      return res.status(400).json({
        message: `Invalid role. Allowed roles: ${ALLOWED_ROLES.join(", ")}`,
      });
    }

    user = new User({
      fullName,
      phone,
      passwordHash: password, // Pre-save hook will hash this
      role: normalizedRole,
    });

    await user.save();

    const payload = {
      user: {
        id: user.id,
        role: user.role,
      },
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
      (err, token) => {
        if (err) throw err;
        res.json({ token, user: { id: user.id, fullName: user.fullName, role: user.role } });
      }
    );
  } catch (err) {
    console.error(err.message);
    if (err.name === "ValidationError" && err.errors?.role) {
      return res.status(400).json({ message: err.errors.role.message });
    }
    res.status(500).json({ message: "Server error" });
  }
};

// @route   POST api/auth/login
// @desc    Authenticate user & get token
// @access  Public
exports.login = async (req, res) => {
  const { phone, password } = req.body;

  try {
    let user = await User.findOne({ phone });

    if (!user) {
      return res.status(400).json({ message: "Invalid Credentials" });
    }

    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid Credentials" });
    }

    const payload = {
      user: {
        id: user.id,
        role: user.role,
      },
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
      (err, token) => {
        if (err) throw err;
        res.json({ token, user: { id: user.id, fullName: user.fullName, role: user.role } });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Server error" });
  }
};

// @route   GET api/auth/me
// @desc    Get current user
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-passwordHash");
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Server Error" });
  }
};
