import bcrypt from "bcryptjs";
import prisma from "../models/prismaClient.js";
import { generateToken } from "../utils/generateToken.js";
import jwt from "jsonwebtoken";

// Register User
export const registerUser = async (req, res) => {
    try {
        const { username, email, password } = req.body;

        if (!username || !email || !password)
            return res.status(400).json({ message: "All fields are required" });

        const existing = await prisma.user.findFirst({
            where: { OR: [{ username }, { email }] },
        });

        if (existing) return res.status(400).json({ message: "User already exists" });

        const hashed = await bcrypt.hash(password, 10);
        const user = await prisma.user.create({
            data: { username, email, password: hashed },
        });

        return res.status(201).json({
            message: "User registered successfully",
            user: { id: user.id, username: user.username, email: user.email },
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Login User
export const loginUser = async (req, res) => {
    try {
        const { username, password } = req.body;

        const user = await prisma.user.findUnique({ where: { username } });
        if (!user) return res.status(400).json({ message: "User not found" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

        const token = generateToken(user);

        return res.json({
            message: "Login successful",
            token,
            user: { id: user.id, username: user.username, role: user.role },
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Profile (Protected)
export const getProfile = async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            select: { id: true, username: true, email: true, role: true, createdAt: true },
        });
        if (!user) return res.status(404).json({ message: "User not found" });
        res.json(user);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

export const verifyToken = (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        return res.json({ valid: true, userId: decoded.id });
    } catch (error) {
        return res.status(401).json({ message: "Invalid or expired token" });
    }
};