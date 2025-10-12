const express = require("express");
const cors = require("cors");
const swaggerUi = require("swagger-ui-express");
const fs = require("fs");

const app = express();
app.use(cors());
app.use(express.json());

// --- Seed data so id=1 exists for your PUT/DELETE tests ---
function seedProducts() {
    return [
        {
            id: 1,
            title: "Demo Headphones",
            description: "Wireless over-ear headphones with ANC",
            category: "audio",
            price: 199,
            discountPercentage: 10.5,
            rating: 4.3,
            stock: 42,
            tags: ["audio", "wireless", "anc"],
            brand: "AcoustiCo",
            sku: "AC-HP-001",
            weight: 350,
            dimensions: { width: 18, height: 22, depth: 8 },
            warrantyInformation: "1 year limited warranty",
            shippingInformation: "Ships in 2-3 business days",
            availabilityStatus: "In Stock",
            reviews: [
                {
                    rating: 5,
                    comment: "Great sound!",
                    date: "2025-09-01",
                    reviewerName: "Alex",
                    reviewerEmail: "alex@example.com",
                },
            ],
            returnPolicy: "30-day return policy",
            minimumOrderQuantity: 1,
            meta: {
                createdAt: "2025-09-01T10:00:00Z",
                updatedAt: "2025-09-10T10:00:00Z",
                barcode: "000000000001",
                qrCode: "http://localhost:3000/products/1",
            },
            images: ["https://picsum.photos/seed/1/400/300"],
            thumbnail: "https://picsum.photos/seed/1/200/150",
        },
        {
            id: 2,
            title: "Studio Mic",
            description: "USB condenser microphone",
            category: "audio",
            price: 129,
            discountPercentage: 5.0,
            rating: 4.5,
            stock: 20,
            tags: ["audio", "usb", "mic"],
            brand: "Vocalis",
            sku: "VO-MIC-002",
            weight: 250,
            dimensions: { width: 6, height: 15, depth: 6 },
            warrantyInformation: "2 years",
            shippingInformation: "Ships next day",
            availabilityStatus: "In Stock",
            reviews: [],
            returnPolicy: "15-day return policy",
            minimumOrderQuantity: 1,
            meta: {
                createdAt: "2025-09-02T10:00:00Z",
                updatedAt: "2025-09-11T10:00:00Z",
                barcode: "000000000002",
                qrCode: "http://localhost:3000/products/2",
            },
            images: ["https://picsum.photos/seed/2/400/300"],
            thumbnail: "https://picsum.photos/seed/2/200/150",
        },
    ];
}

let products = seedProducts();

function sendJson(res, body, status = 200) {
    res.status(status);
    res.set("Content-Type", "application/json; charset=utf-8");
    res.send(JSON.stringify(body));
}

// --- Utility: reset data before running tests ---
app.post("/__reset", (req, res) => {
    products = seedProducts();
    sendJson(res, { ok: true, total: products.length });
});

// --- API matching your collection's flow ---
app.get("/products", (req, res) => {
    const limit = Math.max(0, parseInt(req.query.limit || "5", 10));
    const list = products.slice(6, limit);
    sendJson(res, { products: list, total: products.length, skip: 0, limit });
});

app.get("/products/:id", (req, res) => {
    const id = Number(req.params.id);
    const p = products.find((x) => x.id === id);
    if (!p) return sendJson(res, { message: "Not found" }, 404);
    sendJson(res, p);
});

app.post("/products/add", (req, res) => {
    const { title, price } = req.body || {};
    const now = new Date().toISOString();
    const nextId = (products.reduce((m, p) => Math.max(m, p.id), 0) || 0) + 1;

    // Non-empty defaults to make schema tests pass
    const newProd = {
        id: nextId,
        title: String(title ?? "Untitled product"),
        description: "N/A",
        category: "general",
        price: Number(price ?? 0),
        discountPercentage: 0,
        rating: 0,
        stock: 0,
        tags: ["new"],
        brand: "Generic",
        sku: `SKU-${nextId}`,
        weight: 0,
        dimensions: { width: 0, height: 0, depth: 0 },
        warrantyInformation: "N/A",
        shippingInformation: "N/A",
        availabilityStatus: "In Stock",
        reviews: [],
        returnPolicy: "N/A",
        minimumOrderQuantity: 1,
        meta: {
            createdAt: now,
            updatedAt: now,
            barcode: String(nextId).padStart(12, "0"),
            qrCode: `http://localhost:3000/products/${nextId}`,
        },
        images: [`https://picsum.photos/seed/${nextId}/400/300`],
        thumbnail: `https://picsum.photos/seed/${nextId}/200/150`,
    };

    products.push(newProd);
    sendJson(res, newProd, 201);
});

app.put("/products/:id", (req, res) => {
    const id = Number(req.params.id);
    const idx = products.findIndex((x) => x.id === id);
    if (idx === -1) return sendJson(res, { message: "Not found" }, 404);

    const updated = {
        ...products[idx],
        ...req.body,
        meta: { ...products[idx].meta, updatedAt: new Date().toISOString() },
    };
    products[idx] = updated;
    sendJson(res, updated);
});

app.delete("/products/:id", (req, res) => {
    const id = Number(req.params.id);
    const idx = products.findIndex((x) => x.id === id);
    if (idx === -1) return sendJson(res, { message: "Not found" }, 404);
    products.splice(idx, 1);
    sendJson(res, { ok: true });
});

// --- Swagger UI ---
const swaggerDoc = JSON.parse(fs.readFileSync("./swagger.json", "utf8"));
app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDoc));

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`API listening on http://localhost:${PORT} (Swagger: /docs)`);
});
