function defineTempUser() {
    // prev thing sometimes caused crashes so I changed to random
    const random6 = String(Math.floor(100000 + Math.random() * 900000))
    return {
        username: `sixseven${random6}`,
        email: `sixseven${random6}@g.ucla.edu`,
        password: 'password123',
    }
}

module.exports = { defineTempUser }
