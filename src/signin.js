import React, { useState, useEffect } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import './signin.css';

const SignIn = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    updateLabelState(e.target);
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
    updateLabelState(e.target);
  };

  const updateLabelState = (input) => {
    if (input.value) {
      input.classList.add('filled');
    } else {
      input.classList.remove('filled');
    }
  };

  useEffect(() => {
    const inputs = document.querySelectorAll('.input-group input');
    inputs.forEach(input => {
      updateLabelState(input);
    });
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    // Add your authentication logic here
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="signin-container">
      <form onSubmit={handleSubmit} className="signin-form">
        <h1>Create your account</h1>

        <div className="input-group">
          <input
            type="email"
            id="email"
            value={email}
            onChange={handleEmailChange}
            required
          />
          <label htmlFor="email">Email address*</label>
        </div>

        <div className="input-group">
          <input
            type={showPassword ? "text" : "password"}
            id="password"
            value={password}
            onChange={handlePasswordChange}
            required
          />
          <label htmlFor="password">Password*</label>
          <button
            type="button"
            className="password-toggle"
            onClick={togglePasswordVisibility}
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>

        <div className="forgot-password">
          <a href="/forgot-password">Forgot Password?</a>
        </div>

        <button type="submit" className="continue-button">Continue</button>

        <p>
          Already have an account? <a href="/login">Login</a>
        </p>

        <div className="divider">
          <span>OR</span>
        </div>

        <button type="button" className="google-button">
          Continue with Google
        </button>

        <div className="footer-links">
          <a href="/terms">Terms of Use</a> | <a href="/privacy">Privacy Policy</a>
        </div>
      </form>
    </div>
  );
};

export default SignIn;
