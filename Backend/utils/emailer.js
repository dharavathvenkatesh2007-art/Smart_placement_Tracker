import nodemailer from 'nodemailer';
import { config } from 'dotenv';

config();

let transporter = null;

// Initialize Transporter
async function getTransporter() {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT || 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (host && user && pass) {
    console.log(`Email Service: Using SMTP server ${host}:${port}`);
    transporter = nodemailer.createTransport({
      host,
      port: parseInt(port),
      secure: port == 465, // true for 465, false for other ports
      auth: { user, pass }
    });
  } else {
    try {
      console.log('Email Service: SMTP credentials not set. Creating Ethereal Test Account...');
      const testAccount = await nodemailer.createTestAccount();
      console.log(`Email Service: Ethereal test account created successfully: ${testAccount.user}`);
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass
        }
      });
    } catch (err) {
      console.warn('Email Service: Failed to create Ethereal account, falling back to mock logger:', err.message);
      // Mock Logger Transporter
      transporter = {
        sendMail: async (mailOptions) => {
          console.log('\n--- MOCK EMAIL DISPATCHED ---');
          console.log(`FROM: ${mailOptions.from}`);
          console.log(`TO: ${mailOptions.to}`);
          console.log(`SUBJECT: ${mailOptions.subject}`);
          console.log(`TEXT CONTENT:\n${mailOptions.text}`);
          console.log('-----------------------------\n');
          return { messageId: 'mock-id-' + Date.now() };
        }
      };
    }
  }

  return transporter;
}

// 1. Send Welcome Email
export async function sendWelcomeEmail(user) {
  try {
    const client = await getTransporter();
    const name = user.role === 'STUDENT' ? `${user.firstName} ${user.lastName}`.trim() : user.companyName || user.name || 'User';
    
    const mailOptions = {
      from: `"Smart Placement Tracker" <${process.env.SMTP_USER || 'no-reply@placementtracker.com'}>`,
      to: user.email,
      subject: 'Welcome to Smart Placement Tracker!',
      text: `Hello ${name},\n\nWelcome to the Smart Placement Tracker. Your account has been registered successfully as a ${user.role}.\n\nGet ready to explore placement drives and submit applications.\n\nBest regards,\nPlacement Cell Team`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; line-height: 1.6;">
          <h2 style="color: #1e3a8a;">Welcome to Smart Placement Tracker!</h2>
          <p>Hello <strong>${name}</strong>,</p>
          <p>Your account has been registered successfully as a <strong>${user.role}</strong>.</p>
          <p>You can now log in, build your profile, explore live placement drives, and track your applications in real-time.</p>
          <hr style="border: 0; border-top: 1px solid #ddd; margin: 20px 0;"/>
          <p style="font-size: 12px; color: #666;">This is an automated notification. Please do not reply directly to this email.</p>
        </div>
      `
    };

    const info = await client.sendMail(mailOptions);
    if (info && nodemailer.getTestMessageUrl) {
      const previewUrl = nodemailer.getTestMessageUrl(info);
      if (previewUrl) console.log(`Welcome Email Preview URL: ${previewUrl}`);
    }
    return info;
  } catch (err) {
    console.error('Error sending Welcome Email:', err);
  }
}

// 2. Send New Drive Email to All Registered Students
export async function sendNewDriveEmail(studentEmails, drive) {
  try {
    if (!studentEmails || studentEmails.length === 0) return;
    
    const client = await getTransporter();
    const emailsString = studentEmails.join(', ');

    const mailOptions = {
      from: `"Smart Placement Tracker" <${process.env.SMTP_USER || 'no-reply@placementtracker.com'}>`,
      to: emailsString,
      subject: `New Placement Drive: ${drive.position} at ${drive.companyName}`,
      text: `Hello Student,\n\nA new placement drive has been posted by ${drive.companyName} for the role of ${drive.position}.\n\nCTC: ₹${drive.ctc} LPA\nLocation: ${drive.location}\nDeadline: ${new Date(drive.deadline).toLocaleDateString()}\n\nLog in to the dashboard to apply now.\n\nBest regards,\nPlacement Cell Team`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; line-height: 1.6; border: 1px solid #ddd; border-radius: 8px;">
          <h2 style="color: #2563eb; margin-top: 0;">New Placement Drive Announced!</h2>
          <p>A new job opportunity has been posted on the Smart Placement Tracker portal:</p>
          <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold; width: 120px;">Company:</td>
              <td style="padding: 8px; border-bottom: 1px solid #eee;">${drive.companyName}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Position:</td>
              <td style="padding: 8px; border-bottom: 1px solid #eee;">${drive.position}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">CTC:</td>
              <td style="padding: 8px; border-bottom: 1px solid #eee;">₹${drive.ctc} LPA</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Location:</td>
              <td style="padding: 8px; border-bottom: 1px solid #eee;">${drive.location}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Deadline:</td>
              <td style="padding: 8px; border-bottom: 1px solid #eee; color: #dc2626;">${new Date(drive.deadline).toLocaleDateString()}</td>
            </tr>
          </table>
          <p>Please log in to your account, check the details and eligibility requirements, and submit your application before the deadline.</p>
          <div style="margin-top: 20px;">
            <a href="http://localhost:5173/drives" style="background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">View and Apply</a>
          </div>
        </div>
      `
    };

    const info = await client.sendMail(mailOptions);
    if (info && nodemailer.getTestMessageUrl) {
      const previewUrl = nodemailer.getTestMessageUrl(info);
      if (previewUrl) console.log(`New Drive Email Preview URL: ${previewUrl}`);
    }
    return info;
  } catch (err) {
    console.error('Error sending New Drive Email:', err);
  }
}

// 3. Send Application Confirmation to Student
export async function sendApplicationConfirmationEmail(student, drive) {
  try {
    const client = await getTransporter();
    const studentName = `${student.firstName} ${student.lastName}`.trim();

    const mailOptions = {
      from: `"Smart Placement Tracker" <${process.env.SMTP_USER || 'no-reply@placementtracker.com'}>`,
      to: student.email,
      subject: `Application Submitted: ${drive.position} at ${drive.companyName}`,
      text: `Hello ${studentName},\n\nYour application for the role of ${drive.position} at ${drive.companyName} has been successfully submitted.\n\nWe will notify you once the company updates your status.\n\nBest regards,\nPlacement Cell Team`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; line-height: 1.6;">
          <h2 style="color: #16a34a;">Application Received!</h2>
          <p>Hello <strong>${studentName}</strong>,</p>
          <p>Your application for the following drive has been successfully registered:</p>
          <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; padding: 15px; border-radius: 8px; margin: 15px 0;">
            <p style="margin: 5px 0;"><strong>Company:</strong> ${drive.companyName}</p>
            <p style="margin: 5px 0;"><strong>Role:</strong> ${drive.position}</p>
            <p style="margin: 5px 0;"><strong>Submission Date:</strong> ${new Date().toLocaleDateString()}</p>
          </div>
          <p>You can track the live status of this application directly on your dashboard.</p>
        </div>
      `
    };

    const info = await client.sendMail(mailOptions);
    if (info && nodemailer.getTestMessageUrl) {
      const previewUrl = nodemailer.getTestMessageUrl(info);
      if (previewUrl) console.log(`Application Confirmation Email Preview URL: ${previewUrl}`);
    }
    return info;
  } catch (err) {
    console.error('Error sending Application Confirmation Email:', err);
  }
}

// 4. Send Application Alert to Company
export async function sendApplicationAlertToCompany(company, student, drive) {
  try {
    const client = await getTransporter();
    const studentName = `${student.firstName} ${student.lastName}`.trim();

    const mailOptions = {
      from: `"Smart Placement Tracker" <${process.env.SMTP_USER || 'no-reply@placementtracker.com'}>`,
      to: company.email,
      subject: `New Applicant: ${studentName} applied for ${drive.position}`,
      text: `Hello ${company.companyName || 'Recruiter'},\n\nA new student has applied for your job opening.\n\nPosition: ${drive.position}\nApplicant Name: ${studentName}\nEmail: ${student.email}\nCollege: ${student.college || 'N/A'}\n\nPlease log in to the Company Dashboard to review their application and resume.\n\nBest regards,\nPlacement Cell Team`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; line-height: 1.6;">
          <h2 style="color: #1e3a8a;">New Candidate Application!</h2>
          <p>Hello ${company.companyName || 'Recruiter'},</p>
          <p>A student has just applied for your active placement drive:</p>
          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 15px; border-radius: 8px; margin: 15px 0;">
            <p style="margin: 5px 0;"><strong>Job Position:</strong> ${drive.position}</p>
            <p style="margin: 5px 0;"><strong>Applicant:</strong> ${studentName}</p>
            <p style="margin: 5px 0;"><strong>Email:</strong> ${student.email}</p>
            <p style="margin: 5px 0;"><strong>College:</strong> ${student.college || 'N/A'}</p>
          </div>
          <p>Log in to your Dashboard to review their resume and update their recruitment status.</p>
          <div style="margin-top: 20px;">
            <a href="http://localhost:5173/company-dashboard" style="background-color: #1e3a8a; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Review Application</a>
          </div>
        </div>
      `
    };

    const info = await client.sendMail(mailOptions);
    if (info && nodemailer.getTestMessageUrl) {
      const previewUrl = nodemailer.getTestMessageUrl(info);
      if (previewUrl) console.log(`Application Alert Email Preview URL: ${previewUrl}`);
    }
    return info;
  } catch (err) {
    console.error('Error sending Application Alert to Company:', err);
  }
}

// 5. Send Application Status Update Email to Student
export async function sendApplicationStatusUpdateEmail(student, drive, status) {
  try {
    const client = await getTransporter();
    const studentName = `${student.firstName} ${student.lastName}`.trim();
    
    // Choose styling and message text based on the status
    let statusText = status.toUpperCase();
    let headlineColor = '#1e3a8a';
    let summaryMessage = `Your application status for ${drive.position} has been updated to ${statusText}.`;
    
    if (statusText === 'SELECTED' || statusText === 'HIRED') {
      headlineColor = '#16a34a';
      summaryMessage = `🎉 Congratulations! You have been <strong>SELECTED</strong> for the role of <strong>${drive.position}</strong> at <strong>${drive.companyName}</strong>!`;
    } else if (statusText === 'SHORTLISTED') {
      headlineColor = '#d97706';
      summaryMessage = `Good news! You have been <strong>SHORTLISTED</strong> for the next round of interviews for <strong>${drive.position}</strong> at <strong>${drive.companyName}</strong>.`;
    } else if (statusText === 'REJECTED') {
      headlineColor = '#dc2626';
      summaryMessage = `Thank you for your interest in the role of <strong>${drive.position}</strong> at <strong>${drive.companyName}</strong>. Unfortunately, the company has decided not to proceed with your application at this time.`;
    }

    const mailOptions = {
      from: `"Smart Placement Tracker" <${process.env.SMTP_USER || 'no-reply@placementtracker.com'}>`,
      to: student.email,
      subject: `Application Status Update: ${drive.companyName} - ${drive.position}`,
      text: `Hello ${studentName},\n\n${summaryMessage.replace(/<[^>]*>/g, '')}\n\nLog in to your student dashboard for details.\n\nBest regards,\nPlacement Cell Team`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; line-height: 1.6; border: 1px solid #ddd; border-radius: 8px;">
          <h2 style="color: ${headlineColor}; margin-top: 0;">Application Status Update</h2>
          <p>Hello <strong>${studentName}</strong>,</p>
          <p>${summaryMessage}</p>
          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 15px; border-radius: 8px; margin: 15px 0;">
            <p style="margin: 5px 0;"><strong>Company:</strong> ${drive.companyName}</p>
            <p style="margin: 5px 0;"><strong>Role:</strong> ${drive.position}</p>
            <p style="margin: 5px 0;"><strong>New Status:</strong> <span style="color: ${headlineColor}; font-weight: bold; text-transform: uppercase;">${statusText}</span></p>
          </div>
          <p>Please check your student portal for further schedules or feedback.</p>
          <div style="margin-top: 20px;">
            <a href="http://localhost:5173/student-dashboard" style="background-color: ${headlineColor}; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">View Dashboard</a>
          </div>
        </div>
      `
    };

    const info = await client.sendMail(mailOptions);
    if (info && nodemailer.getTestMessageUrl) {
      const previewUrl = nodemailer.getTestMessageUrl(info);
      if (previewUrl) console.log(`Application Status Update Email Preview URL: ${previewUrl}`);
    }
    return info;
  } catch (err) {
    console.error('Error sending Status Update Email:', err);
  }
}

// 6. Send Schedule Notification Email to Student
export async function sendScheduleNotificationEmail(student, drive, schedule) {
  try {
    const client = await getTransporter();
    const studentName = `${student.firstName} ${student.lastName}`.trim();
    const formattedDate = new Date(schedule.date).toLocaleDateString();

    const mailOptions = {
      from: `"Smart Placement Tracker" <${process.env.SMTP_USER || 'no-reply@placementtracker.com'}>`,
      to: student.email,
      subject: `New Recruitment Round Scheduled: ${schedule.roundType} - ${drive.companyName}`,
      text: `Hello ${studentName},\n\nA new recruitment round has been scheduled for your application at ${drive.companyName}.\n\nRound: ${schedule.roundType}\nDate: ${formattedDate}\nTime: ${schedule.time}\nDetails: ${schedule.details || 'N/A'}\n\nLog in to your student dashboard to view details.\n\nBest regards,\nPlacement Cell Team`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; line-height: 1.6; border: 1px solid #ddd; border-radius: 8px;">
          <h2 style="color: #2563eb; margin-top: 0;">Recruitment Round Scheduled</h2>
          <p>Hello <strong>${studentName}</strong>,</p>
          <p>A new recruitment round has been scheduled for your application:</p>
          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 15px; border-radius: 8px; margin: 15px 0;">
            <p style="margin: 5px 0;"><strong>Company:</strong> ${drive.companyName}</p>
            <p style="margin: 5px 0;"><strong>Position:</strong> ${drive.position}</p>
            <p style="margin: 5px 0;"><strong>Round:</strong> ${schedule.roundType}</p>
            <p style="margin: 5px 0;"><strong>Date:</strong> ${formattedDate}</p>
            <p style="margin: 5px 0;"><strong>Time:</strong> ${schedule.time}</p>
            <p style="margin: 5px 0;"><strong>Details/Link:</strong> ${schedule.details || 'N/A'}</p>
          </div>
          <p>Please make sure to attend the round at the scheduled time. You can track this schedule on your portal.</p>
          <div style="margin-top: 20px;">
            <a href="http://localhost:5173/schedules" style="background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">View Schedules</a>
          </div>
        </div>
      `
    };

    const info = await client.sendMail(mailOptions);
    if (info && nodemailer.getTestMessageUrl) {
      const previewUrl = nodemailer.getTestMessageUrl(info);
      if (previewUrl) console.log(`Schedule Notification Email Preview URL: ${previewUrl}`);
    }
    return info;
  } catch (err) {
    console.error('Error sending Schedule Notification Email:', err);
  }
}

// 7. Send Schedule Status Update Email to Student
export async function sendScheduleUpdateEmail(student, drive, schedule) {
  try {
    const client = await getTransporter();
    const studentName = `${student.firstName} ${student.lastName}`.trim();
    
    let headlineColor = '#1e3a8a';
    if (schedule.status === 'PASSED' || schedule.status === 'SHORTLISTED') {
      headlineColor = '#16a34a';
    } else if (schedule.status === 'FAILED' || schedule.status === 'REJECTED') {
      headlineColor = '#dc2626';
    }

    const mailOptions = {
      from: `"Smart Placement Tracker" <${process.env.SMTP_USER || 'no-reply@placementtracker.com'}>`,
      to: student.email,
      subject: `Recruitment Round Update: ${schedule.roundType} - ${drive.companyName}`,
      text: `Hello ${studentName},\n\nYour status for the recruitment round ${schedule.roundType} at ${drive.companyName} has been updated to ${schedule.status}.\n\nFeedback: ${schedule.feedback || 'N/A'}\n\nLog in to your student dashboard to view details.\n\nBest regards,\nPlacement Cell Team`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; line-height: 1.6; border: 1px solid #ddd; border-radius: 8px;">
          <h2 style="color: ${headlineColor}; margin-top: 0;">Recruitment Round Update</h2>
          <p>Hello <strong>${studentName}</strong>,</p>
          <p>Your recruitment round status has been updated:</p>
          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 15px; border-radius: 8px; margin: 15px 0;">
            <p style="margin: 5px 0;"><strong>Company:</strong> ${drive.companyName}</p>
            <p style="margin: 5px 0;"><strong>Position:</strong> ${drive.position}</p>
            <p style="margin: 5px 0;"><strong>Round:</strong> ${schedule.roundType}</p>
            <p style="margin: 5px 0;"><strong>Status:</strong> <span style="color: ${headlineColor}; font-weight: bold;">${schedule.status}</span></p>
            <p style="margin: 5px 0;"><strong>Feedback:</strong> ${schedule.feedback || 'N/A'}</p>
          </div>
          <p>Log in to your student portal to see detailed feedback and next steps.</p>
          <div style="margin-top: 20px;">
            <a href="http://localhost:5173/schedules" style="background-color: ${headlineColor}; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">View Schedules</a>
          </div>
        </div>
      `
    };

    const info = await client.sendMail(mailOptions);
    if (info && nodemailer.getTestMessageUrl) {
      const previewUrl = nodemailer.getTestMessageUrl(info);
      if (previewUrl) console.log(`Schedule Update Email Preview URL: ${previewUrl}`);
    }
    return info;
  } catch (err) {
    console.error('Error sending Schedule Update Email:', err);
  }
}

