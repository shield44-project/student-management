const r = require("express").Router();
const c = require("../controllers/studentController");
const { protect, adminOnly } = require("../middleware/auth");

r.use(protect);

r.get("/stats", c.stats);
r.get("/me/profile", c.myProfile);
r.get("/export.csv", adminOnly, c.exportCsv);
r.get("/", c.list);
r.get("/:id", c.getOne);

r.post("/", adminOnly, c.create);
r.put("/:id", adminOnly, c.update);
r.delete("/:id", adminOnly, c.remove);

module.exports = r;
