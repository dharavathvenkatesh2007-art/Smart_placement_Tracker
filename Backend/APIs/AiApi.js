import exp from 'express';
import { verifyToken } from '../middlewares/VerifyToken.js';
import { DriveModel } from '../models/DriveModel.js';
import { ApplicationModel } from '../models/ApplicationModel.js';
import { UserModel } from '../models/UserModel.js';
import { StudentModel } from '../models/StudentModel.js';
import { ScheduleModel } from '../models/ScheduleModel.js';
import { config } from 'dotenv';

config();
export const aiApp = exp.Router();

aiApp.post("/chat", verifyToken(), async (req, res, next) => {
  try {
    const userId = req.user.id;
    const role = req.user.role; // 'STUDENT' or 'COMPANY'
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ message: "Message is required" });
    }

    const query = message.toLowerCase().trim();
    let reply = "";

    // 1. GREETINGS
    if (query.match(/\b(hi|hello|hey|greetings|help)\b/)) {
      if (role === 'STUDENT') {
        reply = "Hello! I am your Placement Tracker AI Assistant. You can ask me about:\n\n• **'active drives'** to see live job postings.\n• **'my applications'** to check where you applied.\n• **'my schedules'** to check upcoming rounds/interviews.\n• **'highest package'** to see top offers.\n• **'resume tips'** for guidance.";
      } else {
        reply = "Hello! I am the Recruiter AI Assistant. You can ask me about:\n\n• **'our drives'** to see active job postings you published.\n• **'applicants'** to list candidates who applied to your drives.\n• **'schedules'** to view interviews you scheduled.\n• **'top candidates'** to find students with the best CGPAs.";
      }
    }

    // 2. ACTIVE DRIVES (Student) / OUR DRIVES (Company)
    else if (query.includes("drive") || query.includes("job") || query.includes("opening")) {
      if (role === 'STUDENT') {
        const drives = await DriveModel.find({ status: "ACTIVE" }).limit(5);
        if (drives.length === 0) {
          reply = "There are no active placement drives listed at the moment.";
        } else {
          reply = "Here are the top active placement drives:\n\n" + 
            drives.map(d => `• **${d.companyName}** — *${d.position}* (₹${d.ctc} LPA) | Deadline: ${new Date(d.deadline).toLocaleDateString()}`).join("\n");
        }
      } else {
        const drives = await DriveModel.find({ userId }).limit(5);
        if (drives.length === 0) {
          reply = "You haven't posted any placement drives yet. You can create one from your recruiter dashboard!";
        } else {
          reply = "Here are the placement drives posted by your company:\n\n" + 
            drives.map(d => `• **${d.position}** (₹${d.ctc} LPA) | Applicants: ${d.applicants?.length || 0} | Status: ${d.status}`).join("\n");
        }
      }
    }

    // 3. MY APPLICATIONS (Student) / APPLICANTS (Company)
    else if (query.includes("application") || query.includes("apply") || query.includes("candidate") || query.includes("applicant")) {
      if (role === 'STUDENT') {
        const apps = await ApplicationModel.find({ userId }).populate('driveId').limit(5);
        if (apps.length === 0) {
          reply = "You have not applied to any job drives yet. Visit the **Drives** section to get started!";
        } else {
          reply = "Here are your recent job applications:\n\n" +
            apps.map(a => `• **${a.driveId?.companyName || 'N/A'}** — *${a.driveId?.position || 'N/A'}* | Status: **${a.status}**`).join("\n");
        }
      } else {
        // Find company drives
        const drives = await DriveModel.find({ userId });
        const driveIds = drives.map(d => d._id);
        const apps = await ApplicationModel.find({ driveId: { $in: driveIds } }).populate('userId').populate('driveId').limit(5);

        if (apps.length === 0) {
          reply = "No candidates have applied to your active drives yet.";
        } else {
          reply = "Here are the recent applications received for your drives:\n\n" +
            apps.map(a => {
              const name = `${a.userId?.firstName || ''} ${a.userId?.lastName || ''}`.trim() || 'Candidate';
              return `• **${name}** applied for *${a.driveId?.position}* | Status: **${a.status}**`;
            }).join("\n");
        }
      }
    }

    // 4. SCHEDULES / INTERVIEWS
    else if (query.includes("schedule") || query.includes("interview") || query.includes("round") || query.includes("time")) {
      let queryObj = {};
      if (role === 'STUDENT') {
        queryObj.studentId = userId;
      } else {
        queryObj.companyId = userId;
      }

      const schs = await ScheduleModel.find(queryObj).populate('driveId').populate('studentId').populate('companyId').limit(5);
      if (schs.length === 0) {
        reply = "There are no recruitment rounds scheduled at the moment.";
      } else {
        reply = "Here are the recent recruitment schedules:\n\n" +
          schs.map(s => {
            const dateStr = new Date(s.date).toLocaleDateString();
            const party = role === 'STUDENT' 
              ? (s.companyId?.companyName || s.driveId?.companyName || 'Recruiter')
              : `${s.studentId?.firstName || ''} ${s.studentId?.lastName || ''}`.trim();
            return `• **${s.roundType}** with **${party}** | Date: ${dateStr} | Time: ${s.time} | Status: **${s.status}**`;
          }).join("\n");
      }
    }

    // 5. HIGHEST PACKAGE / CGPA ANALYTICS
    else if (query.includes("highest") || query.includes("package") || query.includes("salary") || query.includes("ctc") || query.includes("top candidate") || query.includes("cgpa")) {
      if (role === 'STUDENT') {
        const highestDrive = await DriveModel.findOne().sort({ ctc: -1 });
        if (highestDrive) {
          reply = `The highest package offered currently is **₹${highestDrive.ctc} LPA** by **${highestDrive.companyName}** for the *${highestDrive.position}* position.`;
        } else {
          reply = "No salary packages have been published yet.";
        }
      } else {
        // Query top student CGPA
        const students = await StudentModel.find().populate('userId').limit(10);
        // Find highest CGPA
        let bestStudent = null;
        let maxCGPA = 0;
        
        students.forEach(s => {
          (s.education || []).forEach(edu => {
            if (edu.cgpa > maxCGPA) {
              maxCGPA = edu.cgpa;
              bestStudent = s;
            }
          });
        });

        if (bestStudent && bestStudent.userId) {
          const name = `${bestStudent.userId.firstName || ''} ${bestStudent.userId.lastName || ''}`.trim() || 'Student';
          reply = `The candidate with the highest recorded CGPA is **${name}** with a CGPA of **${maxCGPA}/10**. You can contact them at *${bestStudent.userId.email}*.`;
        } else {
          reply = "No student academic profiles are available currently.";
        }
      }
    }

    // 6. RESUME / PREPARATION TIPS
    else if (query.includes("resume") || query.includes("prepare") || query.includes("tip") || query.includes("advice")) {
      reply = "Here are some top tips for placement preparation:\n\n" +
        "1. **Resume Customization**: Tailor your resume summary and project details for each specific job position.\n" +
        "2. **Data Structures & Algorithms**: Practice coding on platforms like LeetCode or HackerRank. Essential topics: Arrays, Lists, Trees, and Dynamic Programming.\n" +
        "3. **Mock Interviews**: Practice talking through your solutions out loud to explain your logic clearly.\n" +
        "4. **Company Research**: Always read about the company's products, tech stack, and values before the interview.";
    }

    // 7. FALLBACK
    else {
      reply = `I'm here to help you navigate placement operations. I didn't quite catch that. You can ask me query keywords like:\n\n• **'active drives'** (drives open for registration)\n• **'my applications'** (details on applied jobs)\n• **'my schedules'** (upcoming selection rounds)\n• **'highest CTC'** (top packages offered)\n• **'prep tips'** (interview guidance)`;
    }

    res.status(200).json({
      reply
    });
  } catch (err) {
    next(err);
  }
});
