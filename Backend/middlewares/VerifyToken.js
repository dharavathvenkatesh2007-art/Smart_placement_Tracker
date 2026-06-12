import jwt from "jsonwebtoken";
import {config } from "dotenv";
import {UserModel} from "../models/UserModel.js";
config();

export const verifyToken = (...allowedRoles) => {
  return async (req, res, next) => {
    try {
      // Get token from Authorization header (Bearer token) or cookies
      let token = req.cookies?.token;
      
      if (!token) {
        const authHeader = req.headers?.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
          token = authHeader.substring(7); // Remove 'Bearer ' prefix
        }
      }

      if (!token) {
        return res.status(401).json({ message: "Please login" });
      }

      const decodedToken = jwt.verify(token, process.env.SECRET_KEY);

      // Check user
      const user = await UserModel.findById(decodedToken.id);

      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      if (!user.isUserActive) {
        return res.status(403).json({
          message: "Your account is blocked",
        });
      }

      // Role check only when roles are explicitly required
      if (allowedRoles.length > 0) {
        const normalizedAllowedRoles = allowedRoles.map(role => 
          typeof role === 'string' && role.length > 0 ? role.toUpperCase() : null
        ).filter(Boolean);
        
        if (normalizedAllowedRoles.length > 0 && !normalizedAllowedRoles.includes(decodedToken.role)) {
          return res.status(403).json({
            message: "You are not authorized",
          });
        }
      }

      req.user = decodedToken;
      next();

    } catch (err) {
      res.status(401).json({ message: "Invalid token", error: err.message });
    }
  };
};