const { validationResult } = require('express-validator');
const User = require('../models/User');

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const { name, email, password, roles, phone } = req.body;

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'Email already registered.' });
        }

        // Determine roles
        const userRoles = roles && Array.isArray(roles) ? roles : ['driver'];
        const validRoles = userRoles.filter((r) => ['driver', 'host'].includes(r));
        if (validRoles.length === 0) validRoles.push('driver');

        // Admin assignment by email
        if (email === 'admin@mindspark.com') {
            validRoles.push('admin');
        }

        const activeRole = validRoles.includes('admin') ? 'admin' : validRoles[0];

        const user = await User.create({
            name,
            email,
            password,
            phone,
            roles: validRoles,
            activeRole,
        });

        const token = user.generateToken();

        res.status(201).json({
            success: true,
            message: 'Registration successful.',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                roles: user.roles,
                activeRole: user.activeRole,
                earnings: user.earnings,
                createdAt: user.createdAt,
            },
        });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ success: false, message: 'Server error during registration.' });
    }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const { email, password } = req.body;

        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid credentials.' });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid credentials.' });
        }

        if (!user.isActive) {
            return res.status(403).json({ success: false, message: 'Account deactivated. Contact support.' });
        }

        const token = user.generateToken();

        res.json({
            success: true,
            message: 'Login successful.',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                roles: user.roles,
                activeRole: user.activeRole,
                earnings: user.earnings,
            },
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ success: false, message: 'Server error during login.' });
    }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        res.json({
            success: true,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                roles: user.roles,
                activeRole: user.activeRole,
                earnings: user.earnings,
                phone: user.phone,
                createdAt: user.createdAt,
            },
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};

// @desc    Switch active role
// @route   PUT /api/auth/switch-role
// @access  Private
const switchRole = async (req, res) => {
    try {
        const { role } = req.body;
        const user = await User.findById(req.user._id);

        if (!user.roles.includes(role)) {
            return res.status(403).json({
                success: false,
                message: `You don't have the '${role}' role. Please register for it first.`,
            });
        }

        user.activeRole = role;
        await user.save();

        const token = user.generateToken();

        res.json({
            success: true,
            message: `Switched to ${role} mode.`,
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                roles: user.roles,
                activeRole: user.activeRole,
                earnings: user.earnings,
            },
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};

// @desc    Add a role to existing user
// @route   PUT /api/auth/add-role
// @access  Private
const addRole = async (req, res) => {
    try {
        const { role } = req.body;
        if (!['driver', 'host'].includes(role)) {
            return res.status(400).json({ success: false, message: 'Invalid role specified.' });
        }

        const user = await User.findById(req.user._id);
        if (user.roles.includes(role)) {
            return res.status(400).json({ success: false, message: `You already have the '${role}' role.` });
        }

        user.roles.push(role);
        await user.save();

        res.json({
            success: true,
            message: `Successfully added '${role}' role to your account.`,
            roles: user.roles,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};

module.exports = { register, login, getMe, switchRole, addRole };
