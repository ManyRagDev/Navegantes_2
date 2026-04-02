import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
console.log("__dirname is:", __dirname);
console.log("dist path should be:", path.join(__dirname, "dist"));
