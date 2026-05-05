const jwt = require('jsonwebtoken');

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) return res.sendStatus(401);

    const secret = process.env.JWT_SECRET;
    if (!secret) {
        console.error('CRITICAL: JWT_SECRET is not defined in environment variables.');
        return res.status(500).json({ error: 'Internal Server Error: Secure Configuration Missing' });
    }

    jwt.verify(token, secret, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
}

module.exports = authenticateToken;
