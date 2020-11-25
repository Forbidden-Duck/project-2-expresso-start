const apiRouter = require("express").Router();

const sqlite3 = require("sqlite3");
const db = new sqlite3.Database(process.env.TEST_DATABASE || "./database.sqlite");

apiRouter.param("employeeId", (req, res, next, employeeId) => {
    db.get(
        "SELECT * FROM Employee WHERE id = $employeeId",
        { $employeeId: employeeId },
        (err, row) => {
            if (err) {
                next(err);
            } else if (!row) {
                res.sendStatus(404);
            } else {
                req.employee = row;
                next();
            }
        }
    );
});

apiRouter.use("/:employeeId/timesheets", require("./timesheets"));

apiRouter.get("/", (req, res) => {
    db.all("SELECT * FROM Employee WHERE is_current_employee = 1", (err, rows) => {
        if (err) {
            next(err);
        } else {
            res.status(200).json({ employees: rows });
        }
    });
});

apiRouter.get("/:employeeId", (req, res) => {
    if (req.employee != undefined) {
        res.status(200).json({ employee: req.employee });
    }
});

const validateEmployee = (req, res, next) => {
    const employee = req.body.employee;
    if (typeof employee.name === "undefined"
        || typeof employee.position === "undefined"
        || typeof employee.wage === "undefined") {
        return res.sendStatus(400);
    }
    employee.isCurrentEmployee = employee.isCurrentEmployee == 0 ? 0 : 1;
    next();
};

apiRouter.post("/", validateEmployee, (req, res) => {
    const employee = req.body.employee;
    db.run(
        "INSERT INTO Employee (name, position, wage, is_current_employee) " +
        "VALUES ($name, $position, $wage, $isCurrentEmployee)",
        {
            $name: employee.name,
            $position: employee.position,
            $wage: employee.wage,
            $isCurrentEmployee: employee.isCurrentEmployee
        },
        function (err) {
            if (err) {
                next(err);
            } else {
                db.get(`SELECT * FROM Employee WHERE id = ${this.lastID}`, (err, row) => {
                    if (err) {
                        next(err);
                    } else if (!row) {
                        res.sendStatus(500);
                    } else {
                        res.status(201).json({ employee: row });
                    }
                });
            }
        }
    );
});

apiRouter.put("/:employeeId", validateEmployee, (req, res) => {
    const employee = req.body.employee;
    db.run(
        "UPDATE Employee SET name = $name, position = $position, wage = $wage, " +
        "is_current_employee = $isCurrentEmployee WHERE id = $employeeId",
        {
            $name: employee.name,
            $position: employee.position,
            $wage: employee.wage,
            $isCurrentEmployee: employee.isCurrentEmployee,
            $employeeId: req.params.employeeId
        },
        (err) => {
            if (err) {
                next(err);
            } else {
                db.get(`SELECT * FROM Employee WHERE id = ${req.params.employeeId}`, (err, row) => {
                    if (err) {
                        next(err);
                    } else if (!row) {
                        res.sendStatus(500);
                    } else {
                        res.status(200).json({ employee: row });
                    }
                });
            }
        }
    );
});

apiRouter.delete("/:employeeId", (req, res) => {
    db.run(
        "UPDATE Employee SET is_current_employee = 0 WHERE id = $employeeId",
        { $employeeId: req.params.employeeId },
        (err) => {
            if (err) {
                next(err);
            } else {
                db.get(`SELECT * FROM Employee WHERE id = ${req.params.employeeId}`, (err, row) => {
                    if (err) {
                        next(err);
                    } else if (!row) {
                        res.sendStatus(500);
                    } else {
                        res.status(200).json({ employee: row });
                    }
                });
            }
        }
    );
});

module.exports = apiRouter;