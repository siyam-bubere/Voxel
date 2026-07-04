import jwt from 'jsonwebtoken';

export const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Extract the token payload cleanly
            token = req.headers.authorization.split(' ')[1];
            
            // CRITICAL FIX: Match the exact fallback key used in your login controller
            const decoded = jwt.verify(
                token, 
                process.env.JWT_SECRET || 'voxel_temporary_local_secret_fallback_key_123'
            );
            
            // Attach the validated user metadata straight to the request lifecycle
            req.user = decoded; 
            
            // CRITICAL FIX: Explicitly RETURN next() to halt local middleware execution completely
            return next(); 
            
        } catch (error) {
            console.error("Middleware Verification Engine Error:", error.message);
            return res.status(401).json({ success: false, message: 'Not authorized, token invalid.' });
        }
    }

    // Explicit fallback check if token fails to map or string drops out of context
    if (!token) {
        return res.status(401).json({ success: false, message: 'Access denied. No token provided.' });
    }
};