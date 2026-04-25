import React, { useState } from 'react';

const RegistrationPage = () => {
    // NEED TO ADD:
    // - useState for form inputs
    // - connect w / checks for ucla email when trying to sign up(regex ?)
    // - submitting form? even if it's just a test function
    const containerStyle = {
        backgroundColor: '#121212',
        color: '#ffffff',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'sans-serif'
    };

    const formStyle = {
        display: 'flex',
        flexDirection: 'column',
        width: '325px',
        gap: '10px'
    };

    const inputStyle = {
        padding: '16px',
        borderRadius: '4px',
        border: '1px solid #333',
        backgroundColor: '#242424',
        color: 'white'
    };

    const buttonStyle = {
        padding: '10px',
        borderRadius: '25px',
        border: 'none',
        backgroundColor: '#007DC3',
        color: 'white',
        fontWeight: 'bold',
        cursor: 'pointer'
    };

    const googleButtonStyle = {
        ...buttonStyle,
        backgroundColor: 'white',
        color: '#007DC3',
        marginBottom: '10px'
    };

  return (
    <div style={containerStyle}>
        {/* logo */}
        <img 
        src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ_sDbnpxvYw6P_fjSOqMZYyUZhg4fSzUIMhw&s" 
        alt="Logo" 
        style={{ width: '325px', marginBottom: '20px' }} 
        />

        <h2 style={{ marginBottom: '15px' }}>Sign up for BruinBet</h2>

        {/* login with google */}
        <div style={formStyle}>
        <button style={googleButtonStyle}>Continue with Google</button>
        
        <div style={{ textAlign: 'center', margin: '2px 0', color: '#6a6a6a' }}>
            <hr style={{ borderColor: '#333' }} /> OR
        </div>

        {/* manual registration form */}
        <form style={formStyle}>
            <label>Email address</label>
            <input 
            type="email" 
            name="email"
            placeholder="Email address" 
            style={inputStyle} 
            />

            <label>Create a password</label>
            <input 
            type="password" 
            name="password"
            placeholder="Password" 
            style={inputStyle} 
            />

            <button type="submit" style={buttonStyle}>Sign Up</button>
        </form>
        </div>

        <p style={{ marginTop: '20px', fontSize: '14px', color: '#b3b3b3' }}>
        Already have an account? <span style={{ color: '#ffffff', textDecoration: 'underline', cursor: 'pointer' }}>Log in here.</span>
        </p>
    </div>
  );
};

export default RegistrationPage;
