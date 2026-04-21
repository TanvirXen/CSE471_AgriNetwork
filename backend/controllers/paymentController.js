const Payment = require("../models/Payment");
const User = require("../models/User");
const sslCommerzService = require("../services/sslCommerzService");

const MIN_TOP_UP_AMOUNT = 10;
const MAX_TOP_UP_AMOUNT = 500000;
const PROFILE_PATH = "/dashboard/profile";

const normalizeAmount = (value) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return NaN;
  return Math.round(parsed * 100) / 100;
};

const buildTransactionId = () =>
  `WTU${Date.now()}${Math.random().toString(36).slice(2, 8)}`.slice(0, 30);

const getRequestPayload = (req) => ({
  ...req.query,
  ...req.body,
});

const getSafeUrl = (value) => {
  if (!value) return null;

  try {
    const parsedUrl = new URL(value);
    return parsedUrl.toString().replace(/\/+$/, "");
  } catch (_err) {
    return null;
  }
};

const buildAbsoluteUrl = (baseUrl, pathname) => new URL(pathname, `${baseUrl}/`).toString();

const getFrontendBaseUrl = (req, payment) =>
  getSafeUrl(payment?.gatewayResponse?.frontendBaseUrl) ||
  getSafeUrl(process.env.FRONTEND_URL) ||
  getSafeUrl(req.headers.origin);

const getBackendBaseUrl = (req) =>
  getSafeUrl(process.env.BACKEND_PUBLIC_URL) || `${req.protocol}://${req.get("host")}`;

const buildProfileRedirectUrl = (frontendBaseUrl, status, payment) => {
  const redirectUrl = new URL(buildAbsoluteUrl(frontendBaseUrl, PROFILE_PATH));
  redirectUrl.searchParams.set("wallet", status);

  if (payment?.sslTranId) {
    redirectUrl.searchParams.set("tran_id", payment.sslTranId);
  }

  return redirectUrl.toString();
};

const buildGatewayResponse = (payment, key, payload) => {
  const existingGatewayResponse =
    payment.gatewayResponse && typeof payment.gatewayResponse === "object" ? payment.gatewayResponse : {};

  return {
    ...existingGatewayResponse,
    [key]: payload,
  };
};

const isSuccessfulValidation = (validationResponse, payment) => {
  const validationStatus = String(validationResponse?.status || "").toUpperCase();
  const validatedAmount = normalizeAmount(validationResponse?.amount);
  const expectedAmount = normalizeAmount(payment.amount);

  return (
    ["VALID", "VALIDATED"].includes(validationStatus) &&
    validationResponse?.tran_id === payment.sslTranId &&
    Math.abs(validatedAmount - expectedAmount) < 0.01 &&
    String(validationResponse?.currency || "").toUpperCase() === "BDT"
  );
};

const markPaymentForReview = async (payment, callbackPayload, validationResponse, sourceKey) => {
  payment.paymentStatus = "Pending";
  payment.gatewayResponse = buildGatewayResponse(payment, sourceKey, {
    callbackPayload,
    validationResponse,
    reviewRequired: true,
    processedAt: new Date().toISOString(),
  });
  payment.sslValId = validationResponse?.val_id || payment.sslValId;
  payment.sslStoreAmount = normalizeAmount(validationResponse?.store_amount) || payment.sslStoreAmount;
  payment.sslSessionKey = callbackPayload?.sessionkey || payment.sslSessionKey;
  await payment.save();
};

const creditWalletBalance = async (payment, callbackPayload, validationResponse, sourceKey) => {
  const paidAt = new Date();
  const nextGatewayResponse = buildGatewayResponse(payment, sourceKey, {
    callbackPayload,
    validationResponse,
    processedAt: paidAt.toISOString(),
  });

  const updatedPayment = await Payment.findOneAndUpdate(
    { _id: payment._id, paymentStatus: { $ne: "Paid" } },
    {
      $set: {
        paymentStatus: "Paid",
        paidAt,
        sslValId: validationResponse?.val_id || payment.sslValId,
        sslStoreAmount: normalizeAmount(validationResponse?.store_amount) || payment.sslStoreAmount,
        sslSessionKey: callbackPayload?.sessionkey || payment.sslSessionKey,
        gatewayResponse: nextGatewayResponse,
      },
    },
    { new: true }
  );

  if (updatedPayment) {
    await User.findByIdAndUpdate(payment.payerId, {
      $inc: { walletBalance: payment.amount },
    });

    return { credited: true, payment: updatedPayment };
  }

  const existingPayment = await Payment.findById(payment._id);
  return { credited: false, payment: existingPayment };
};

const updateFailedPayment = async (payment, callbackPayload, statusKey) => {
  if (!payment || payment.paymentStatus === "Paid") return;

  payment.paymentStatus = statusKey === "cancelled" ? "Cancelled" : "Failed";
  payment.gatewayResponse = buildGatewayResponse(payment, statusKey, {
    callbackPayload,
    processedAt: new Date().toISOString(),
  });
  await payment.save();
};

const handleBrowserRedirect = (req, res, status, payment) => {
  const frontendBaseUrl = getFrontendBaseUrl(req, payment);

  if (!frontendBaseUrl) {
    return res.status(200).send(`Payment ${status}`);
  }

  return res.redirect(303, buildProfileRedirectUrl(frontendBaseUrl, status, payment));
};

exports.initiateWalletTopUp = async (req, res) => {
  const amount = normalizeAmount(req.body?.amount);

  if (!Number.isFinite(amount) || amount < MIN_TOP_UP_AMOUNT || amount > MAX_TOP_UP_AMOUNT) {
    return res.status(400).json({
      message: `Amount must be between ${MIN_TOP_UP_AMOUNT} and ${MAX_TOP_UP_AMOUNT} BDT.`,
    });
  }

  if (!sslCommerzService.isConfigured()) {
    return res.status(500).json({
      message: "SSLCommerz is not configured on the server.",
    });
  }

  try {
    const user = await User.findById(req.user.id).select("-passwordHash");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const frontendBaseUrl = getFrontendBaseUrl(req);
    if (!frontendBaseUrl) {
      return res.status(500).json({ message: "Unable to resolve frontend URL for payment redirect." });
    }

    const backendBaseUrl = getBackendBaseUrl(req);
    const transactionId = buildTransactionId();
    const primaryAddress = user.addresses?.[0] || {};

    const payment = await Payment.create({
      payerId: user._id,
      transactionType: "WalletTopUp",
      provider: "SSLCommerz",
      amount,
      currency: "BDT",
      sslTranId: transactionId,
      paymentStatus: "Pending",
      gatewayResponse: {
        frontendBaseUrl,
      },
    });

    try {
      const sslSession = await sslCommerzService.initiateSession({
        total_amount: amount.toFixed(2),
        currency: "BDT",
        tran_id: transactionId,
        success_url: buildAbsoluteUrl(backendBaseUrl, "/api/payments/sslcommerz/success"),
        fail_url: buildAbsoluteUrl(backendBaseUrl, "/api/payments/sslcommerz/fail"),
        cancel_url: buildAbsoluteUrl(backendBaseUrl, "/api/payments/sslcommerz/cancel"),
        ipn_url: buildAbsoluteUrl(backendBaseUrl, "/api/payments/sslcommerz/ipn"),
        shipping_method: "NO",
        product_name: "AgriNetwork Wallet Top Up",
        product_category: "top up",
        product_profile: "non-physical-goods",
        cus_name: user.fullName || "AgriNetwork User",
        cus_email: user.email || "customer@example.com",
        cus_add1: primaryAddress.fullAddress || "Dhaka",
        cus_city: primaryAddress.district || "Dhaka",
        cus_state: primaryAddress.division || "Dhaka",
        cus_postcode: primaryAddress.postalCode || "1207",
        cus_country: "Bangladesh",
        cus_phone: user.phone || "01700000000",
        ship_name: user.fullName || "AgriNetwork User",
        ship_add1: primaryAddress.fullAddress || "Dhaka",
        ship_city: primaryAddress.district || "Dhaka",
        ship_state: primaryAddress.division || "Dhaka",
        ship_postcode: primaryAddress.postalCode || "1207",
        ship_country: "Bangladesh",
        value_a: String(user._id),
        value_b: "WalletTopUp",
        value_c: String(payment._id),
      });

      const gatewayUrl =
        sslSession?.GatewayPageURL || sslSession?.redirectGatewayURL || sslSession?.directPaymentURL;

      if (!gatewayUrl) {
        throw new Error("SSLCommerz did not return a hosted gateway URL.");
      }

      payment.paymentStatus = "Initiated";
      payment.sslSessionKey = sslSession?.sessionkey || sslSession?.sessionKey || payment.sslSessionKey;
      payment.sslStoreAmount = normalizeAmount(sslSession?.store_amount) || payment.sslStoreAmount;
      payment.gatewayResponse = buildGatewayResponse(payment, "initiate", sslSession);
      await payment.save();

      return res.json({
        paymentId: payment._id,
        tranId: transactionId,
        gatewayUrl,
      });
    } catch (err) {
      payment.paymentStatus = "Failed";
      payment.gatewayResponse = buildGatewayResponse(payment, "initiateError", {
        message: err.message,
        processedAt: new Date().toISOString(),
      });
      await payment.save();
      throw err;
    }
  } catch (err) {
    console.error("Wallet top up initiation failed:", err.message);
    return res.status(500).json({
      message: "Unable to start SSLCommerz payment session.",
    });
  }
};

exports.handleSuccessfulWalletPayment = async (req, res) => {
  const callbackPayload = getRequestPayload(req);

  try {
    const payment = await Payment.findOne({ sslTranId: callbackPayload.tran_id });

    if (!payment) {
      return handleBrowserRedirect(req, res, "error");
    }

    const validationResponse = await sslCommerzService.validatePayment({
      valId: callbackPayload.val_id,
      tranId: callbackPayload.tran_id,
    });

    if (!isSuccessfulValidation(validationResponse, payment)) {
      await updateFailedPayment(payment, callbackPayload, "failed");
      return handleBrowserRedirect(req, res, "failed", payment);
    }

    if (String(validationResponse?.risk_level || "0") === "1") {
      await markPaymentForReview(payment, callbackPayload, validationResponse, "successReview");
      return handleBrowserRedirect(req, res, "review", payment);
    }

    await creditWalletBalance(payment, callbackPayload, validationResponse, "success");
    return handleBrowserRedirect(req, res, "success", payment);
  } catch (err) {
    console.error("Wallet success callback failed:", err.message);
    return handleBrowserRedirect(req, res, "error");
  }
};

exports.handleFailedWalletPayment = async (req, res) => {
  const callbackPayload = getRequestPayload(req);

  try {
    const payment = await Payment.findOne({ sslTranId: callbackPayload.tran_id });
    await updateFailedPayment(payment, callbackPayload, "failed");
    return handleBrowserRedirect(req, res, "failed", payment);
  } catch (err) {
    console.error("Wallet failure callback failed:", err.message);
    return handleBrowserRedirect(req, res, "failed");
  }
};

exports.handleCancelledWalletPayment = async (req, res) => {
  const callbackPayload = getRequestPayload(req);

  try {
    const payment = await Payment.findOne({ sslTranId: callbackPayload.tran_id });
    await updateFailedPayment(payment, callbackPayload, "cancelled");
    return handleBrowserRedirect(req, res, "cancelled", payment);
  } catch (err) {
    console.error("Wallet cancel callback failed:", err.message);
    return handleBrowserRedirect(req, res, "cancelled");
  }
};

exports.handleWalletPaymentIpn = async (req, res) => {
  const callbackPayload = getRequestPayload(req);

  try {
    const payment = await Payment.findOne({ sslTranId: callbackPayload.tran_id });

    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    if (String(callbackPayload.status || "").toUpperCase() !== "VALID") {
      await updateFailedPayment(payment, callbackPayload, "failed");
      return res.status(200).json({ status: "ignored" });
    }

    const validationResponse = await sslCommerzService.validatePayment({
      valId: callbackPayload.val_id,
      tranId: callbackPayload.tran_id,
    });

    if (!isSuccessfulValidation(validationResponse, payment)) {
      await updateFailedPayment(payment, callbackPayload, "failed");
      return res.status(400).json({ status: "invalid" });
    }

    if (String(validationResponse?.risk_level || "0") === "1") {
      await markPaymentForReview(payment, callbackPayload, validationResponse, "ipnReview");
      return res.status(200).json({ status: "review" });
    }

    await creditWalletBalance(payment, callbackPayload, validationResponse, "ipn");
    return res.status(200).json({ status: "ok" });
  } catch (err) {
    console.error("Wallet IPN processing failed:", err.message);
    return res.status(500).json({ status: "error" });
  }
};
