import { auth } from "express-oauth2-jwt-bearer";
import jwt from "jsonwebtoken";
import User from "../models/user/user.model.js";
import 'dotenv/config';

// Configure Auth0 JWT check middleware
export const jwtCheck = auth({
  audience: process.env.AUTH0_AUDIENCE,
  issuerBaseURL: process.env.AUTH0_ISSUER_BASE_URL,
  tokenSigningAlg: 'RS256'
});

// Middleware to parse JWT and attach user info to request
export const jwtParse = async (req, res, next) => {
  const { authorization } = req.headers;

  if (!authorization || !authorization.startsWith("Bearer ")) {
    return res.sendStatus(401);
  }

  const token = authorization.split(" ")[1];

  try {
    const decoded = jwt.decode(token);
    const auth0Id = decoded.sub;

    const user = await User.findOne({ auth0Id });

    if (!user) {
      return res.sendStatus(401);
    }

    req.auth0Id = auth0Id;
    req.userId = user._id.toString();
    next();
  } catch (error) {
    console.error("JWT Parse error:", error);
    return res.sendStatus(401);
  }
};

// Middleware that only checks if valid Auth0 token exists without requiring DB user
export const jwtParseNoUserCheck = async (req, res, next) => {
  const { authorization } = req.headers;

  if (!authorization || !authorization.startsWith("Bearer ")) {
    return res.sendStatus(401);
  }

  const token = authorization.split(" ")[1];

  try {
    const decoded = jwt.decode(token);
    req.auth0Id = decoded.sub;
    next();
  } catch (error) {
    console.error("JWT Parse error:", error);
    return res.sendStatus(401);
  }
};