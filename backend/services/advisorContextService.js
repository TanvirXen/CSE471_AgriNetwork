const CropPlan = require("../models/CropPlan");
const FarmerListing = require("../models/FarmerListing");
const MarketInsight = require("../models/MarketInsight");
const MarketListing = require("../models/MarketListing");
const User = require("../models/User");

const STOPWORDS = new Set([
  "a",
  "an",
  "and",
  "are",
  "about",
  "available",
  "based",
  "best",
  "can",
  "current",
  "for",
  "from",
  "get",
  "how",
  "i",
  "in",
  "is",
  "market",
  "me",
  "my",
  "of",
  "on",
  "or",
  "our",
  "price",
  "regarding",
  "season",
  "should",
  "the",
  "their",
  "this",
  "to",
  "trend",
  "trends",
  "user",
  "users",
  "what",
  "which",
  "with",
  "your",
]);

const escapeRegex = (value = "") => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const formatNumber = (value) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;
  return parsed % 1 === 0 ? parsed.toString() : parsed.toFixed(2);
};

const compactText = (value = "", maxLength = 140) => {
  const normalized = String(value || "").replace(/\s+/g, " ").trim();
  if (!normalized) return "";
  return normalized.length > maxLength ? `${normalized.slice(0, maxLength - 3)}...` : normalized;
};

const extractKeywords = (message = "") =>
  Array.from(
    new Set(
      String(message || "")
        .toLowerCase()
        .match(/[a-z0-9]+/g) || []
    )
  )
    .filter((token) => token.length >= 3 && !STOPWORDS.has(token))
    .slice(0, 6);

const buildKeywordConditions = (fields, keywords) =>
  keywords.flatMap((keyword) =>
    fields.map((field) => ({
      [field]: { $regex: escapeRegex(keyword), $options: "i" },
    }))
  );

const pickPrimaryAddress = (user) =>
  user?.addresses?.find((address) => address?.isDefault) || user?.addresses?.[0] || null;

const summarizeUserProfile = (user) => {
  if (!user) {
    return ["User profile:", "- User profile not found."];
  }

  const address = pickPrimaryAddress(user);
  const categories = (user.profile?.productCategories || []).filter(Boolean).slice(0, 5);
  const lines = [
    "User profile:",
    `- Name: ${user.fullName || "Unknown"}`,
    `- Role: ${user.role || "Unknown"}`,
  ];

  if (address?.district || address?.division) {
    lines.push(`- Location: ${[address.district, address.division].filter(Boolean).join(", ")}`);
  }

  if (categories.length) {
    lines.push(`- Product categories: ${categories.join(", ")}`);
  }

  if (user.profile?.farmName || user.profile?.organizationName || user.profile?.shopName) {
    lines.push(
      `- Profile label: ${user.profile?.farmName || user.profile?.organizationName || user.profile?.shopName}`
    );
  }

  return lines;
};

const summarizeCropListings = (listings) => {
  if (!listings.length) {
    return ["Available crops in database:", "- No matching crop listings were found in the current database snapshot."];
  }

  return [
    "Available crops in database:",
    ...listings.map((listing) => {
      const price = formatNumber(listing.pricing?.unitPrice);
      const quantity = formatNumber(listing.quantity);
      const parts = [
        `${listing.productName || "Unknown crop"}${listing.variety ? ` (${listing.variety})` : ""}`,
        [listing.district, listing.region, listing.division].filter(Boolean).join(", "),
        quantity ? `${quantity} ${listing.quantityUnit || "kg"} available` : null,
        price ? `BDT ${price}/${listing.pricing?.unit || "kg"}` : null,
        listing.grade ? `grade ${listing.grade}` : null,
        listing.qualityNotes ? `quality: ${compactText(listing.qualityNotes, 60)}` : null,
      ].filter(Boolean);

      return `- ${parts.join(" | ")}`;
    }),
  ];
};

const summarizeMarketInsights = (insights) => {
  if (!insights.length) {
    return ["Market analysis from database:", "- No matching market insights were found in the current database snapshot."];
  }

  return [
    "Market analysis from database:",
    ...insights.map((insight) => {
      const latestPoint = Array.isArray(insight.priceHistory) && insight.priceHistory.length
        ? insight.priceHistory[insight.priceHistory.length - 1]
        : null;
      const parts = [
        `${insight.productName || "Unknown product"}${insight.variety ? ` (${insight.variety})` : ""}`,
        [insight.region, insight.season].filter(Boolean).join(", "),
        insight.priceTrend ? `price trend: ${insight.priceTrend}` : null,
        insight.demandLevel ? `demand: ${insight.demandLevel}` : null,
        insight.supplyLevel ? `supply: ${insight.supplyLevel}` : null,
        latestPoint?.averagePrice ? `latest avg price: BDT ${formatNumber(latestPoint.averagePrice)}` : null,
        insight.recommendation ? `recommendation: ${compactText(insight.recommendation, 70)}` : null,
      ].filter(Boolean);

      return `- ${parts.join(" | ")}`;
    }),
  ];
};

const summarizeMarketListings = (listings) => {
  if (!listings.length) {
    return ["Nearby market listings in database:", "- No matching farmer/vendor/market listings were found in the current database snapshot."];
  }

  return [
    "Nearby market listings in database:",
    ...listings.map((listing) => {
      const cropNames = Array.isArray(listing.crops) ? listing.crops.filter(Boolean).slice(0, 3).join(", ") : "";
      const parts = [
        listing.title || "Untitled listing",
        listing.type || null,
        cropNames || null,
        listing.district || listing.division || null,
        Number.isFinite(Number(listing.price)) && Number(listing.price) > 0
          ? `BDT ${formatNumber(listing.price)}${listing.unit ? `/${listing.unit}` : ""}`
          : null,
        listing.stockStatus ? `stock: ${listing.stockStatus}` : null,
        listing.isVerified ? "verified" : null,
      ].filter(Boolean);

      return `- ${parts.join(" | ")}`;
    }),
  ];
};

const summarizeCropPlans = (plans) => {
  if (!plans.length) {
    return ["User crop plans in database:", "- No saved crop plans were found for this user."];
  }

  return [
    "User crop plans in database:",
    ...plans.map((plan) => {
      const topRecommendations = (plan.recommendations || [])
        .slice(0, 3)
        .map((recommendation) => {
          const price = formatNumber(recommendation.expectedMarketPrice);
          return `${recommendation.cropName}${recommendation.variety ? ` (${recommendation.variety})` : ""}${
            price ? ` BDT ${price}` : ""
          }`;
        })
        .join(", ");

      const parts = [
        [plan.season, plan.district || plan.region].filter(Boolean).join(", "),
        plan.soilType ? `soil: ${plan.soilType}` : null,
        typeof plan.irrigationAvailable === "boolean" ? `irrigation: ${plan.irrigationAvailable ? "yes" : "no"}` : null,
        topRecommendations ? `recommended: ${topRecommendations}` : null,
      ].filter(Boolean);

      return `- ${parts.join(" | ")}`;
    }),
  ];
};

const runFirstNonEmpty = async (queries) => {
  for (const query of queries) {
    const results = await query();
    if (Array.isArray(results) && results.length) {
      return results;
    }
  }

  return [];
};

const buildDistrictRegex = (value) => new RegExp(`^${escapeRegex(value)}$`, "i");

const getAdvisorContext = async ({ userId, message }) => {
  const keywords = extractKeywords(message);
  const user = userId
    ? await User.findById(userId)
        .select("fullName role profile addresses")
        .lean()
    : null;

  const primaryAddress = pickPrimaryAddress(user);
  const district = primaryAddress?.district;
  const division = primaryAddress?.division;

  const cropBaseQuery = {
    categoryType: "Crop",
    quantity: { $gt: 0 },
    visibility: { $ne: "Hidden" },
    moderationStatus: { $ne: "Rejected" },
    status: { $ne: "Archived" },
  };
  const cropKeywordConditions = buildKeywordConditions(
    ["productName", "variety", "title", "district", "region", "division"],
    keywords
  );

  const cropListings = await runFirstNonEmpty([
    () =>
      cropKeywordConditions.length
        ? FarmerListing.find({ ...cropBaseQuery, $or: cropKeywordConditions })
            .select("productName variety district division region quantity quantityUnit pricing grade qualityNotes")
            .sort({ trustScore: -1, updatedAt: -1 })
            .limit(5)
            .lean()
        : Promise.resolve([]),
    () =>
      district
        ? FarmerListing.find({ ...cropBaseQuery, district: buildDistrictRegex(district) })
            .select("productName variety district division region quantity quantityUnit pricing grade qualityNotes")
            .sort({ updatedAt: -1 })
            .limit(5)
            .lean()
        : Promise.resolve([]),
    () =>
      division
        ? FarmerListing.find({ ...cropBaseQuery, division: buildDistrictRegex(division) })
            .select("productName variety district division region quantity quantityUnit pricing grade qualityNotes")
            .sort({ updatedAt: -1 })
            .limit(5)
            .lean()
        : Promise.resolve([]),
    () =>
      FarmerListing.find(cropBaseQuery)
        .select("productName variety district division region quantity quantityUnit pricing grade qualityNotes")
        .sort({ trustScore: -1, updatedAt: -1 })
        .limit(5)
        .lean(),
  ]);

  const marketInsightKeywordConditions = buildKeywordConditions(
    ["productName", "variety", "region", "season", "forecastSummary", "recommendation"],
    keywords
  );

  const marketInsights = await runFirstNonEmpty([
    () =>
      marketInsightKeywordConditions.length
        ? MarketInsight.find({ $or: marketInsightKeywordConditions })
            .select("productName variety region season demandLevel supplyLevel priceTrend recommendation priceHistory")
            .sort({ createdAt: -1, confidenceScore: -1 })
            .limit(4)
            .lean()
        : Promise.resolve([]),
    () =>
      district
        ? MarketInsight.find({ region: { $regex: escapeRegex(district), $options: "i" } })
            .select("productName variety region season demandLevel supplyLevel priceTrend recommendation priceHistory")
            .sort({ createdAt: -1, confidenceScore: -1 })
            .limit(4)
            .lean()
        : Promise.resolve([]),
    () =>
      MarketInsight.find({})
        .select("productName variety region season demandLevel supplyLevel priceTrend recommendation priceHistory")
        .sort({ createdAt: -1, confidenceScore: -1 })
        .limit(4)
        .lean(),
  ]);

  const marketListingKeywordConditions = buildKeywordConditions(["title", "crops", "district", "division"], keywords);

  const marketListings = await runFirstNonEmpty([
    () =>
      marketListingKeywordConditions.length
        ? MarketListing.find({ isActive: true, $or: marketListingKeywordConditions })
            .select("title crops price unit stockStatus type district division isVerified")
            .sort({ updatedAt: -1 })
            .limit(4)
            .lean()
        : Promise.resolve([]),
    () =>
      district
        ? MarketListing.find({ isActive: true, district: buildDistrictRegex(district) })
            .select("title crops price unit stockStatus type district division isVerified")
            .sort({ updatedAt: -1 })
            .limit(4)
            .lean()
        : Promise.resolve([]),
    () =>
      MarketListing.find({ isActive: true })
        .select("title crops price unit stockStatus type district division isVerified")
        .sort({ updatedAt: -1 })
        .limit(4)
        .lean(),
  ]);

  const userCropPlans = userId
    ? await CropPlan.find({ userId })
        .select("season region district soilType irrigationAvailable recommendations")
        .sort({ createdAt: -1 })
        .limit(2)
        .lean()
    : [];

  const sections = [
    "AgriNetwork database context snapshot:",
    ...summarizeUserProfile(user),
    ...summarizeCropListings(cropListings),
    ...summarizeMarketInsights(marketInsights),
    ...summarizeMarketListings(marketListings),
    ...summarizeCropPlans(userCropPlans),
  ];

  return sections.join("\n");
};

module.exports = { getAdvisorContext };
