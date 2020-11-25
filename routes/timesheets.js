const apiRouter = require("express").Router({ mergeParams: true });

const sqlite3 = require("sqlite3");
const db = new sqlite3.Database(process.env.TEST_DATABASE || "./database.sqlite");

apiRouter.param("timesheetId", (req, res, next, timesheetId) => {
    db.get(
        "SELECT * FROM Timesheet WHERE id = $timesheetId",
        { $timesheetId: timesheetId },
        (err, row) => {
            if (err) {
                next(err);
            } else if (!row) {
                res.sendStatus(404);
            } else {
                req.timestamp = row;
                next();
            }
        }
    );
});

apiRouter.get("/", (req, res) => {
    db.all(
        "SELECT * FROM Timesheet WHERE employee_id = $employeeId",
        { $employeeId: req.params.employeeId },
        (err, row) => {
            if (err) {
                next(err);
            } else {
                res.status(200).json({ timesheets: row });
            }
        }
    );
});

const validateTimesheet = (req, res, next) => {
    const timesheet = req.body.timesheet;
    if (typeof timesheet.hours === "undefined"
        || typeof timesheet.rate === "undefined"
        || typeof timesheet.date === "undefined") {
        return res.sendStatus(400);
    }
    db.get(`SELECT * FROM Employee WHERE id = ${req.params.employeeId}`, (err, row) => {
        if (err) {
            next(err);
        } else if (!row) {
            res.sendStatus(400);
        } else {
            next();
        }
    });
};

apiRouter.post("/", validateTimesheet, (req, res) => {
    const timesheet = req.body.timesheet;
    db.run(
        "INSERT INTO Timesheet (hours, rate, date, employee_id) " +
        "VALUES ($hours, $rate, $date, $employeeId)",
        {
            $hours: timesheet.hours,
            $rate: timesheet.rate,
            $date: timesheet.date,
            $employeeId: req.params.employeeId
        },
        function (err) {
            if (err) {
                next(err);
            } else {
                db.get(`SELECT * FROM Timesheet WHERE id = ${this.lastID}`, (err, row) => {
                    if (err) {
                        next(err);
                    } else if (!row) {
                        res.sendStatus(500);
                    } else {
                        res.status(201).json({ timesheet: row });
                    }
                });
            }
        }
    );
});

apiRouter.put("/:timesheetId", validateTimesheet, (req, res) => {
    const timesheet = req.body.timesheet;
    db.run(
        "UPDATE Timesheet SET hours = $hours, rate = $rate, date = $date " +
        "WHERE id = $timesheetId",
        {
            $hours: timesheet.hours,
            $rate: timesheet.rate,
            $date: timesheet.date,
            $timesheetId: req.params.timesheetId
        },
        (err) => {
            if (err) {
                next(err);
            } else {
                db.get(`SELECT * FROM Timesheet WHERE id = ${req.params.timesheetId}`, (err, row) => {
                    if (err) {
                        next(err);
                    } else if (!row) {
                        res.sendStatus(500);
                    } else {
                        res.status(200).json({ timesheet: row });
                    }
                });
            }
        }
    );
});

apiRouter.delete("/:timesheetId", (req, res) => {
    db.run(
        "DELETE FROM Timesheet WHERE id = $timesheetId",
        {
            $timesheetId: req.params.timesheetId
        },
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