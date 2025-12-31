const db = require("../database/db");

module.exports = () => {
    // Ambil semua produk yang statusnya 'open' langsung dari DB
    return db.prepare("SELECT * FROM products WHERE status = 'open'").all();
};