import jwt from 'jsonwebtoken';

function getJwtSecret() {
    if (!process.env.JWT_SECRET) {
        throw new Error('JWT_SECRET is required');
    }
    return process.env.JWT_SECRET;
}

export function authenticate(req, res, next){
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    jwt.verify(token, getJwtSecret(), (err, payload) => {
        if (err) {
            return res.status(403).json({ message: 'Forbidden' });
        }
        req.user = {
            id: payload.id,
            username: payload.username,
        };
        next();
    });
}
