const apiRouter = require("express").Router({ mergeParams: true });

const sqlite3 = require("sqlite3");
const db = new sqlite3.Database(process.env.TEST_DATABASE || "./database.sqlite");

apiRouter.param("menuItemId", (req, res, next, menuItemId) => {
    db.get(
        "SELECT * FROM MenuItem WHERE id = $menuItemId",
        { $menuItemId: menuItemId },
        (err, row) => {
            if (err) {
                next(err);
            } else if (!row) {
                res.sendStatus(404);
            } else {
                req.menuItem = row;
                next();
            }
        }
    );
});

apiRouter.get("/", (req, res) => {
    db.all(
        "SELECT * FROM MenuItem WHERE menu_id = $menuId",
        { $menuId: req.params.menuId },
        (err, rows) => {
            if (err) {
                next(err);
            } else {
                res.status(200).json({ menuItems: rows });
            }
        }
    );
});

const validateMenuItem = (req, res, next) => {
    const menuItem = req.body.menuItem;
    if (typeof menuItem.name === "undefined"
        || typeof menuItem.description === "undefined"
        || typeof menuItem.inventory === "undefined"
        || typeof menuItem.price === "undefined") {
        return res.sendStatus(400);
    }
    db.get(`SELECT * FROM Menu WHERE id = ${req.params.menuId}`, (err, row) => {
        if (err) {
            next(err);
        } else if (!row) {
            res.sendStatus(400);
        } else {
            next();
        }
    });
};

apiRouter.post("/", validateMenuItem, (req, res) => {
    const menuItem = req.body.menuItem;
    db.run(
        "INSERT INTO MenuItem (name, description, inventory, price, menu_id) " +
        "VALUES ($name, $description, $inventory, $price, $menuId)",
        {
            $name: menuItem.name,
            $description: menuItem.description,
            $inventory: menuItem.inventory,
            $price: menuItem.price,
            $menuId: req.params.menuId
        },
        function (err) {
            if (err) {
                next(err);
            } else {
                db.get(`SELECT * FROM MenuItem WHERE id = ${this.lastID}`, (err, row) => {
                    if (err) {
                        next(err);
                    } else if (!row) {
                        res.sendStatus(500);
                    } else {
                        res.status(201).json({ menuItem: row });
                    }
                });
            }
        }
    );
});

apiRouter.put("/:menuItemId", validateMenuItem, (req, res) => {
    const menuItem = req.body.menuItem;
    db.run(
        "UPDATE MenuItem SET name = $name, description = $description, inventory = $inventory, " +
        "price = $price WHERE id = $menuItemId",
        {
            $name: menuItem.name,
            $description: menuItem.description,
            $inventory: menuItem.inventory,
            $price: menuItem.price,
            $menuItemId: req.params.menuItemId
        },
        (err) => {
            if (err) {
                next(err);
            } else {
                db.get(`SELECT * FROM MenuItem WHERE id = ${req.params.menuItemId}`, (err, row) => {
                    if (err) {
                        next(err);
                    } else if (!row) {
                        res.sendStatus(500);
                    } else {
                        res.status(200).json({ menuItem: row });
                    }
                });
            }
        }
    );
});

apiRouter.delete("/:menuItemId", (req, res) => {
    db.run(
        "DELETE FROM MenuItem WHERE id = $menuItemId",
        { $menuItemId: req.params.menuItemId },
        (err) => {
            if (err) {
                next(err);
            } else {
                res.sendStatus(204);
            }
        }
    );
});

module.exports = apiRouter;