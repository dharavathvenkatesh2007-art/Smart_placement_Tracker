import multer from "multer";

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
fileFilter: (req, file, cb) => {
    const isProfileImage = file.fieldname === "profileImage";
    const isResume = file.fieldname === "resume";
    const allowedImage = ["image/jpeg", "image/png"].includes(file.mimetype);
    const allowedResume = file.mimetype === "application/pdf";

    if ((isProfileImage && allowedImage) || (isResume && allowedResume)) {
      cb(null, true);
    } else {
      const err = new Error(isResume ? "Only PDF resume files are allowed" : "Only JPG and PNG profile images are allowed");
      err.status = 400;
      cb(err, false);
    }
  },
});
