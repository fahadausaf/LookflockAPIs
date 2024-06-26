const router = require("express").Router();
const nodemailer = require('nodemailer');
const { emailConfig } = require('../emailConfig');

const transporter = nodemailer.createTransport(emailConfig);

router.post('/', async (req, res) => {
    const { to, subject, text, html } = req.body;

    const mailOptions = {
        from: "Lookflock <muhammadasad98980@gmail.com>",
        to,
        subject,
        text,
        html
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        res.status(200).send({ message: 'Email sent', info });
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
});

module.exports = router;