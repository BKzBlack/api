const cors = require("cors");
const express = require("express");
const mysql = require("mysql2/promise");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
// const session = require("express-session");
const bcrypt = require("bcrypt");

const app = express();
app.use(express.json());
app.use(
    cors({
        credentials: true,
        origin: ["https://union.jairak.dev"],
    }),
);
app.use(cookieParser());

// app.use(
//     session({
//         secret: "secret",
//         resave: false,
//         saveUninitialized: true,
//     }),
// );

const port = 3000;
const secret = "mysecret";

let conn = null;

// function init connection mysql
const initMySQL = async () => {
    conn = await mysql.createConnection({
        host: '119.59.120.138',
        user: 'jairakdi_union',
        password: 'unip@ss',
        database: 'jairakdi_union'
    });
};

/* เราจะแก้ไข code ที่อยู่ตรงกลาง */

// Listen
app.listen(port, async () => {
    await initMySQL();
    // console.log("Server started at port 8000");
});

app.post("/api/register", async (req, res) => {
    const { email, password } = req.body;

    const [rows] = await conn.query("SELECT * FROM md_reg WHERE md_reg_email = ?", email);
    if (rows.length) {
        return res.status(400).send({ message: "Email is already registered" });
    }

    // Hash the password
    const hash = await bcrypt.hash(password, 10);
    // 10 = salt (การสุ่มค่าเพื่อเพิ่มความซับซ้อนในการเข้ารหัส)
    // และมันจะถูกนำมาใช้ตอน compare

    // Store the user data
    const prefix = 'นาย';
    const fullname = 'Natthaphon Nokhamla';
    const tel = '0654142421';
    const platform = 82;
    const consent1 = 1;
    const consent2 = 1;
    const consent3 = 1;

    const userData = {
        md_reg_masterkey: 'reg',
        md_reg_register: 'สมัครเอง',
        md_reg_prefix: prefix,
        md_reg_fullname: fullname,
        md_reg_email: email,
        md_reg_tel: tel,
        md_reg_platform: platform,
        md_reg_password: hash,
        md_reg_consent1: consent1,
        md_reg_consent2: consent2,
        md_reg_consent3: consent3,
        md_reg_status: 'Disable'
    };

    try {
        const result = await conn.query("INSERT INTO md_reg SET ?", userData);
    } catch (error) {
        console.error(error);
        res.status(400).json({
            message: "insert fail",
            error,
        });
    }

    res.status(201).send({ message: "User registered successfully" });
});

app.post("/api/login", async (req, res) => {
    const { email, password } = req.body;
    try {
        const [result] = await conn.query("SELECT * from md_reg WHERE md_reg_email = ?", email);
        const user = result[0];
        const match = await bcrypt.compare(password, user.md_reg_password);
        if (!match) {
            return res.status(400).send({ message: "Invalid email or password" });
        }

        // const token = jwt.sign({ email, role: "admin" }, secret, { expiresIn: "1h" });
        // res.cookie("token", token, {
        //     maxAge: 300000,
        //     secure: true,
        //     httpOnly: true,
        //     sameSite: "none",
        // });

        // ใส่ข้อมูล user เก็บคู่กับ session ไว้
        // console.log("get session", req.sessionID);
        // req.session.user = user;
        // req.session.userId = user.md_reg_id;
        // console.log(user);
        // res.send({ message: "Login successful" });
        res.status(200).send({ message: "Login successful" });
    } catch (err) {
        console.error(err);
        res.status(500).send({ message: "Server error" });
    }
});

// const authenticateToken = (req, res, next) => {
//     try {
//         if (!req.session.userId) {
//             return res.sendStatus(401);
//         }
//         req.user = req.session.user;
//         next();
//     } catch (error) {
//         return res.sendStatus(403);
//     }
// };

app.get("/api/users", async (req, res) => {
    try {
        if (!req.session.userId) {
            throw { message: 'Auth fail' }
        }
        console.log(req.session);
        // Get the users

        const [results] = await conn.query("SELECT * FROM md_reg WHERE md_reg_id = ?", req.session.userId);
        const users = results.map((row) => row.md_reg_email);

        res.json({
            users: results
        })
    } catch (err) {
        console.error(err);
        res.status(500).send({ message: "Server error" });
    }
});
