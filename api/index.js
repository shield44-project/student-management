require("dotenv").config();
const app = require("../src/app");
const connectDB = require("../src/config/db");
if (require.main === module) {
  connectDB().then(() => app.listen(process.env.PORT || 5000, () => console.log(`Student Management running at http://localhost:${process.env.PORT || 5000}`))).catch(error => { console.error(error.message); process.exit(1); });
}
module.exports = app;
