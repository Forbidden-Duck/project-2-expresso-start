const apiRouter = require("express").Router();

const e = require("express");
const sqlite3 = require("sqlite3");
const db = new sqlite3.Database(process.env.TEST_DATABASE || "./database.sqlite");

apiRouter.param("menuId", (req, res, next, menuId) => {
    db.get(
        "SELECT * FROM Menu WHERE id = $menuId",
        { $menuId: menuId },
        (err, row) => {
            if (err) {
                next(err);
            } else if (!row) {
                res.sendStatus(404);
            } else {
                req.menu = row;
                next();
            }
        }
    );
});

apiRouter.use("/:menuId/menu-items", require("./menu-items"));

apiRouter.get("/", (req, res) => {
    db.all("SELECT * FROM Menu", (err, rows) => {
        if (err) {
            next(err);
        } else {
            res.status(200).json({ menus: rows });
        }
    });
});

apiRouter.get("/:menuId", (req, res) => {
    if (req.menu != undefined) {
        res.status(200).json({ menu: req.menu });
    }
});

const validateMenu = (req, res, next) => {
    const menu = req.body.menu;
    if (typeof menu.title === "undefined") {
        return res.sendStatus(400);
    }
    next();
};

apiRouter.post("/", validateMenu, (req, res) => {
    const menu = req.body.menu;
    db.run(
        "INSERT INTO Menu (title) VALUES ($title)",
        { $title: menu.title },
        function (err) {
            if (err) {
                next(err);
            } else {
                db.get(`SELECT * FROM Menu WHERE id = ${this.lastID}`, (err, row) => {
                    if (err) {
                        next(err);
                    } else if (!row) {
                        res.sendStatus(500);
                    } else {
                        res.status(201).json({ menu: row });
                    }
                });
            }
        }
    );
});

apiRouter.put("/:menuId", validateMenu, (req, res) => {
    const menu = req.body.menu;
    db.run(
        "UPDATE Menu SET title = $title WHERE id = $menuId",
        {
            $title: menu.title,
            $menuId: req.params.menuId
        },
        (err) => {
            if (err) {
                next(err);
            } else {
                db.get(`SELECT * FROM Menu WHERE id = ${req.params.menuId}`, (err, row) => {
                    if (err) {
                        next(err);
                    } else if (!row) {
                        res.sendStatus(500);
                    } else {
                        res.status(200).json({ menu: row });
                    }
                });
            }
        }
    );
});

apiRouter.delete("/:menuId", (req, res) => {
    db.all(
        `SELECT * FROM MenuItem WHERE menu_id = $menuId`,
        { $menuId: req.params.menuId },
        (err, rows) => {
            if (err) {
                next(err);
            } else if (rows.length > 0) {
                res.sendStatus(400);
            } else {
                db.run(
                    "DELETE FROM Menu WHERE id = $menuId",
                    { $menuId: req.params.menuId },
                    (err) => {
                        if (err) {
                            next(err);
                        } else {
                            res.sendStatus(204);
                        }
                    }
                );
            }
        }
    );
});

module.exports = apiRouter;