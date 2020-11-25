const apiRouter = require("express").Router();

apiRouter.use("/employees", require("./employees"));
apiRouter.use("/menus", require("./menus"));

module.exports = apiRouter;