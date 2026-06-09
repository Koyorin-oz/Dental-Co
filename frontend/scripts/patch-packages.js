// Patches @alloc/quick-lru to be compatible with Node.js v24 and Turbopack.
// @alloc/quick-lru@5.2.0 is missing "type", "main", and "exports" fields
// which causes Turbopack's sandboxed evaluator to throw "Invalid package config".
const fs = require("fs");
const path = require("path");

const pkgPath = path.join(
  __dirname,
  "..",
  "node_modules",
  "@alloc",
  "quick-lru",
  "package.json"
);

if (!fs.existsSync(pkgPath)) {
  console.log("patch-packages: @alloc/quick-lru not found, skipping");
  process.exit(0);
}

const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));

if (!pkg.type) {
  pkg.type = "commonjs";
  pkg.main = "./index.js";
  pkg.exports = { ".": "./index.js" };
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, "\t"));
  console.log("patch-packages: patched @alloc/quick-lru for Node.js v24 compatibility");
} else {
  console.log("patch-packages: @alloc/quick-lru already patched, skipping");
}
