const fs = require("fs");
const path = require("path");

module.exports = () => {
    const filePath = path.join(__dirname, "../data/products.json");
    const products = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    return products.filter(p => p.status === "open");
};
