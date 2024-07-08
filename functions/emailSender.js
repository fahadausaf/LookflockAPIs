const nodemailer = require('nodemailer');
const emailConfig = require('../emailConfig');

// Create a transporter object using the default SMTP transport
const transporter = nodemailer.createTransport(emailConfig);

// Function to send an email
const sendEmail = ({ to, subject, text }) => {
    return new Promise((resolve, reject) => {
        const mailOptions = {
            from: 'Lookflock',
            to,
            subject,
            text
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                return reject(error);
            }
            resolve(info.response);
        });
    });
};

module.exports = sendEmail;
