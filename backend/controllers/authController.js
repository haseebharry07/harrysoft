const jwt = require('jsonwebtoken');
const User = require('../models/User');
const SESSION_DURATION_MS = 60 * 60 * 1000;
const userResponse = (user) => ({ id: user._id, name: user.name, email: user.email, role: user.role });
const createSession = (user) => ({
  token: jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET || 'change-this-development-secret', { expiresIn: '1h' }),
  expiresAt: Date.now() + SESSION_DURATION_MS,
  user: userResponse(user)
});

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email and password are required.' });
    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');
    const passwordMatches = user && (user.password.startsWith('$2') ? await user.comparePassword(password) : user.password === password);
    if (!passwordMatches) return res.status(401).json({ message: 'Invalid email or password.' });
    // Upgrade records created before password hashing and retire the old roles.
    if (!user.password.startsWith('$2') || !['admin', 'user'].includes(user.role)) {
      user.password = password;
      if (!['admin', 'user'].includes(user.role)) user.role = 'user';
      await user.save();
    }
    res.json(createSession(user));
  } catch (error) { res.status(500).json({ message: 'Unable to sign in. Please try again.' }); }
};

exports.register = async (req, res) => {
  try {
    const { name, email, password, role = 'user' } = req.body;
    if (!name || !email || !password) return res.status(400).json({ message: 'Name, email and password are required.' });
    if (password.length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters.' });
    if (!['admin', 'user'].includes(role)) return res.status(400).json({ message: 'Role must be admin or user.' });
    const normalizedEmail = email.toLowerCase().trim();
    if (await User.findOne({ email: normalizedEmail })) return res.status(409).json({ message: 'An account with this email already exists.' });
    const isFirstUser = (await User.countDocuments()) === 0;
    if (!isFirstUser && (!req.user || req.user.role !== 'admin')) return res.status(403).json({ message: 'Only an admin can create users.' });
    const user = await User.create({ name, email: normalizedEmail, password, role: isFirstUser ? 'admin' : role });
    res.status(201).json(isFirstUser ? createSession(user) : { user: userResponse(user) });
  } catch (error) { res.status(500).json({ message: 'Unable to create the user.' }); }
};
exports.me = (req, res) => res.json({ user: userResponse(req.user) });
