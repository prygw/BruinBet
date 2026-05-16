const requireAdmin = (req, res, next) => {
    // build actual admin verification later.
    console.log("Everyone is admin right now...");
    next();
};

module.exports = { requireAdmin };
