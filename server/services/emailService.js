const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

async function sendAppointmentReminder(email, userName, specialistName, appointmentDate, appointmentTime) {
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: email,
    subject: `Appointment Reminder: ${specialistName}`,
    html: `
      <h2>Appointment Reminder</h2>
      <p>Hello ${userName},</p>
      <p>This is a reminder about your upcoming appointment with <strong>${specialistName}</strong>.</p>
      <p>
        <strong>Date:</strong> ${appointmentDate}<br>
        <strong>Time:</strong> ${appointmentTime}
      </p>
      <p>If you need to reschedule, please log into your Asha account.</p>
      <p>
        Best regards,<br>
        Asha (आशा) Support Team
      </p>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Appointment reminder sent to ${email}`);
    return true;
  } catch (err) {
    console.error('Error sending reminder email:', err);
    return false;
  }
}

async function sendWelcomeEmail(email, userName) {
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: email,
    subject: 'Welcome to Asha (आशा) - Autism Support Platform',
    html: `
      <h2>Welcome to Asha!</h2>
      <p>Hello ${userName},</p>
      <p>Welcome to Asha, your trusted companion for autism support and resources in Nepal.</p>
      <p>With Asha, you can:</p>
      <ul>
        <li>Find verified autism specialists and support centers</li>
        <li>Book appointments and receive reminders</li>
        <li>Connect with other families in our support community</li>
        <li>Track your child's daily routine</li>
        <li>Access valuable awareness materials and resources</li>
      </ul>
      <p>Get started by exploring our <strong>Find Help</strong> section to discover specialists near you.</p>
      <p>
        Best regards,<br>
        Asha (आशा) Support Team
      </p>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Welcome email sent to ${email}`);
    return true;
  } catch (err) {
    console.error('Error sending welcome email:', err);
    return false;
  }
}

module.exports = { sendAppointmentReminder, sendWelcomeEmail };
