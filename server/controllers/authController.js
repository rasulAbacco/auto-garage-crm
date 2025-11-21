// server/controllers/authController.js
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "../models/prismaClient.js";
import { generateToken } from "../utils/generateToken.js";

/**
 * @desc Register a new user
 * @route POST /api/auth/register
 * @access Public 
 */
export const registerUser = async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // ✅ Basic validation
        if (!username || !email || !password) {
            return res.status(400).json({ message: "All fields are required" });
        }

        // ✅ Check if username or email already exists
        const existingUser = await prisma.user.findFirst({
            where: { OR: [{ username }, { email }] },
        });

        if (existingUser) {
            return res
                .status(400)
                .json({ message: "Username or email already exists" });
        }

        // ✅ Hash password before saving
        const hashedPassword = await bcrypt.hash(password, 10);

        // ✅ Create user in DB
        const user = await prisma.user.create({
            data: {
                username,
                email,
                password: hashedPassword,
                role: "user", // default role
            },
        });

        // ✅ Generate JWT
        const token = generateToken(user);

        return res.status(201).json({
            message: "User registered successfully",
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role,
                createdAt: user.createdAt,
            },
        });
    } catch (error) {
        console.error("❌ Registration Error:", error);
        res.status(500).json({ message: "Internal server error during registration" });
    }
};

/**
 * @desc Login a user
 * @route POST /api/auth/login
 * @access Public
 */
export const loginUser = async (req, res) => {
    try {
        const { username, password } = req.body;

        // ✅ Validate inputs
        if (!username || !password) {
            return res
                .status(400)
                .json({ message: "Username and password are required" });
        }

        // ✅ Find user
        const user = await prisma.user.findUnique({ where: { username } });
        if (!user) {
            return res.status(400).json({ message: "Invalid username or password" });
        }

        // ✅ Compare password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid username or password" });
        }

        // ✅ Generate JWT
        const token = generateToken(user);

        return res.status(200).json({
            message: "Login successful",
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role,
            },
        });
    } catch (error) {
        console.error("❌ Login Error:", error);
        res.status(500).json({ message: "Internal server error during login" });
    }
};

/**
 * @desc Get current user's profile
 * @route GET /api/auth/profile
 * @access Private
 */
export const getProfile = async (req, res) => {
    try {
        // ✅ Fetch user from DB
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            select: {
                id: true,
                username: true,
                email: true,
                role: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json(user);
    } catch (error) {
        console.error("❌ Profile Fetch Error:", error);
        res.status(500).json({ message: "Error fetching profile" });
    }
};

/**
 * @desc Verify JWT token validity
 * @route GET /api/auth/verify
 * @access Public (self-check)
 */
export const verifyToken = async (req, res) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader?.startsWith("Bearer ")) {
            return res.status(401).json({
                valid: false,
                message: "No token provided",
            });
        }

        const token = authHeader.split(" ")[1];

        // ✅ Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // ✅ Confirm user exists
        const user = await prisma.user.findUnique({
            where: { id: decoded.id },
            select: { id: true, username: true, email: true, role: true },
        });

        if (!user) {
            return res.status(404).json({
                valid: false,
                message: "User not found for this token",
            });
        }

        return res.status(200).json({
            valid: true,
            user,
        });
    } catch (error) {
        console.error("❌ Token Verification Error:", error);
        return res.status(401).json({
            valid: false,
            message: "Invalid or expired token",
        });
    }
};
