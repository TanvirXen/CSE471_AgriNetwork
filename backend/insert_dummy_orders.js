const mongoose = require("mongoose");
require("dotenv").config();
const Order = require("./models/Order");
const User = require("./models/User");

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/AgriTest";

const getRandomStatus = () => {
    const statuses = [
        "Pending", "Confirmed", "Shipped", "OutForDelivery", "Delivered", "Cancelled"
    ];
    return statuses[Math.floor(Math.random() * statuses.length)];
};

const dummyItems = [
    { name: "Premium Sona Moong Dal", variety: "Sona", grade: "A", price: 120 },
    { name: "BRRI Dhan 28 Rice", variety: "BRRI 28", grade: "Premium", price: 65 },
    { name: "Organic Red Tomatoes", variety: "Roma", grade: "A", price: 45 },
    { name: "Farm Fresh Deshi Eggs", variety: "Deshi", grade: "A", price: 15 },
    { name: "Tosha Jute Bales", variety: "Tosha", grade: "Premium", price: 85 }
];

async function insertDummyOrders() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log("Connected to MongoDB:", MONGO_URI);

        await Order.deleteMany({});
        console.log("Cleared existing orders.");

        // We need fake users or to use existing. To avoid user validation issues, we will just create random ObjectIds
        // but if User schema is enforced in populate we might need real users. Let's create dummy users.
        let buyer = await User.findOne({ email: "buyer_test_order@agro.com" });
        if (!buyer) {
            buyer = await User.create({
                fullName: "Test Buyer",
                email: "buyer_test_order@agro.com",
                passwordHash: "dummy",
                phone: "01700000001",
                role: "Customer",
                status: "Active"
            });
        }

        let seller = await User.findOne({ email: "seller_test_order@agro.com" });
        if (!seller) {
            seller = await User.create({
                fullName: "Test Seller",
                email: "seller_test_order@agro.com",
                passwordHash: "dummy",
                phone: "01700000002",
                role: "Farmer",
                status: "Active"
            });
        }

        const generateOrder = (statusOverride, idSuffix) => {
            const status = statusOverride || getRandomStatus();
            const items = Array.from({ length: Math.floor(Math.random() * 3) + 1 }).map(() => {
                const item = dummyItems[Math.floor(Math.random() * dummyItems.length)];
                const quantity = Math.floor(Math.random() * 50) + 10;
                return {
                    listingId: new mongoose.Types.ObjectId(),
                    productName: item.name,
                    variety: item.variety,
                    grade: item.grade,
                    quantity: quantity,
                    unit: "kg",
                    unitPrice: item.price,
                    subtotal: item.price * quantity
                };
            });

            const itemsTotal = items.reduce((sum, i) => sum + i.subtotal, 0);
            const deliveryFee = 150;
            const platformFee = itemsTotal * 0.05;
            const grandTotal = itemsTotal + deliveryFee + platformFee;

            const datePlaced = new Date(Date.now() - Math.floor(Math.random() * 10000000000));

            const order = {
                orderNumber: "ORD-" + idSuffix,
                buyerId: buyer._id,
                sellerId: seller._id,
                items,
                pricing: {
                    itemsTotal,
                    deliveryFee,
                    platformFee,
                    escrowFee: 0,
                    discount: 0,
                    grandTotal
                },
                status: status,
                deliveryAddress: {
                    contactName: "Test Buyer",
                    phone: "01700000001",
                    fullAddress: "123 Farm Road, Dhaka",
                    district: "Dhaka",
                    division: "Dhaka"
                },
                timeline: [
                    { status: "Pending", note: "Order placed.", timestamp: datePlaced }
                ],
                createdAt: datePlaced
            };

            // Build realistic timeline for delivered order
            if (["Confirmed", "Shipped", "OutForDelivery", "Delivered"].includes(status)) {
                order.timeline.push({ status: "Confirmed", note: "Seller confirmed stock.", timestamp: new Date(datePlaced.getTime() + 86400000) });
            }
            if (["Shipped", "OutForDelivery", "Delivered"].includes(status)) {
                order.timeline.push({ status: "Shipped", note: "Handed over to carrier.", timestamp: new Date(datePlaced.getTime() + 86400000 * 2) });
            }
            if (["OutForDelivery", "Delivered"].includes(status)) {
                order.timeline.push({ status: "OutForDelivery", note: "Out for delivery.", timestamp: new Date(datePlaced.getTime() + 86400000 * 3) });
            }
            if (status === "Delivered") {
                order.timeline.push({ status: "Delivered", note: "Successfully received.", timestamp: new Date(datePlaced.getTime() + 86400000 * 4) });
                order.deliveredAt = new Date(datePlaced.getTime() + 86400000 * 4);
                order.completedAt = order.deliveredAt;
            }

            if (status === "Cancelled") {
                order.timeline.push({ status: "Cancelled", note: "Out of stock.", timestamp: new Date(datePlaced.getTime() + 86400000) });
                order.cancellationRequested = true;
                order.cancellationReason = "Out of stock on seller end.";
            }

            return order;
        };

        const staticOrders = [
            generateOrder("Pending", "9001"),
            generateOrder("Confirmed", "9002"),
            generateOrder("Shipped", "9003"),
            generateOrder("OutForDelivery", "9004"),
            generateOrder("Delivered", "9005"),
            generateOrder("Cancelled", "9006"),
            generateOrder("Pending", "9007"),
            generateOrder("Confirmed", "9008"),
            generateOrder("Shipped", "9009"),
            generateOrder("Delivered", "9010")
        ];

        await Order.insertMany(staticOrders);
        console.log("Inserted 10 diverse orders successfully.");

        process.exit(0);
    } catch (err) {
        console.error("Error inserting orders:", err);
        process.exit(1);
    }
}

insertDummyOrders();
