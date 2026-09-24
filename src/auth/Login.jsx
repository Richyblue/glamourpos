import React, { useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import {
  CButton,
  CCard,
  CCardBody,
  CCol,
  CContainer,
  CForm,
  CFormInput,
  CInputGroup,
  CInputGroupText,
  CRow,
  CSpinner,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilLockLocked, cilUser, cilEye, cilEyeSlash, cilCheckCircle } from '@coreui/icons'

const Login = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const navigate = useNavigate()

  const API_URL = import.meta.env.VITE_BACKEND_URL

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')

    if (!email.trim() || !password.trim()) {
      setError('Please enter your email address and password.')
      return
    }

    setLoading(true)

    try {
      const response = await axios.post(`${API_URL}api/auth/login`, {
        email,
        password,
      })

      if (response.data.success && response.data.token) {
        console.log('Login successful:', response.data)

        localStorage.setItem('token', response.data.token)

        localStorage.setItem('user', JSON.stringify(response.data.user))

        // Role-based redirect
        if (response.data.user?.role === 'cashier') {
          navigate('/pos', { replace: true })
        } else {
          navigate('/dashboard', { replace: true })
        }
      }
    } catch (err) {
      console.error('Login failed:', err.response?.data || err.message)

      // Disabled account
      if (err.response?.status === 403) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        localStorage.removeItem('expiresAt')

        setError(
          err.response?.data?.message ||
            'Your account has been disabled. Please contact the administrator.',
        )

        return
      }

      // Invalid credentials
      if (err.response?.status === 401) {
        setError(err.response?.data?.message || 'Invalid email or password.')

        return
      }

      // Other errors
      setError(
        err.response?.data?.message ||
          'Unable to login. Please check your connection and try again.',
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="glamour-login-page">
      <CContainer fluid className="p-0">
        <CRow className="g-0 min-vh-100">
          {/* =====================================================
              LEFT BRAND PANEL
          ====================================================== */}
          <CCol lg={7} className="d-none d-lg-flex glamour-brand-panel">
            <div className="brand-overlay">
              {/* Logo */}
              <div className="glamour-logo">
                <div className="logo-mark">G</div>

                <div>
                  <div className="logo-title">GLAMOUR</div>

                  <div className="logo-subtitle">UNISEX SALON</div>
                </div>
              </div>

              {/* Main Content */}
              <div className="brand-content">
                <div className="brand-badge">
                  <span className="badge-dot"></span>
                  PROFESSIONAL SALON MANAGEMENT
                </div>

                <h1>
                  Run your salon.
                  <br />
                  <span>Smarter.</span>
                </h1>

                <p>
                  Manage sales, customers, staff, inventory, commissions and daily operations from
                  one powerful POS platform.
                </p>

                {/* Feature List */}
                <div className="feature-list">
                  <div className="feature-item">
                    <div className="feature-icon">
                      <CIcon icon={cilCheckCircle} />
                    </div>

                    <div>
                      <strong>Powerful POS</strong>
                      <span>Fast and reliable sales processing</span>
                    </div>
                  </div>

                  <div className="feature-item">
                    <div className="feature-icon">
                      <CIcon icon={cilCheckCircle} />
                    </div>

                    <div>
                      <strong>Smart Management</strong>
                      <span>Track your salon operations in real time</span>
                    </div>
                  </div>

                  <div className="feature-item">
                    <div className="feature-icon">
                      <CIcon icon={cilCheckCircle} />
                    </div>

                    <div>
                      <strong>Secure & Reliable</strong>
                      <span>Your business data stays protected</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom */}
              <div className="brand-footer">
                <span>© {new Date().getFullYear()} Glamour Unisex Salon</span>

                <span className="footer-divider">|</span>

                <span>Powered by Bluesplash IT Solution</span>
              </div>
            </div>
          </CCol>

          {/* =====================================================
              RIGHT LOGIN PANEL
          ====================================================== */}
          <CCol xs={12} lg={5} className="glamour-login-panel">
            <div className="login-wrapper">
              {/* Mobile Logo */}
              <div className="mobile-logo d-lg-none">
                <div className="logo-mark">G</div>

                <div>
                  <div className="logo-title">GLAMOUR</div>

                  <div className="logo-subtitle">UNISEX SALON</div>
                </div>
              </div>

              <CCard className="login-card border-0">
                <CCardBody className="p-0">
                  {/* Heading */}
                  <div className="login-heading">
                    <div className="welcome-label">WELCOME BACK</div>

                    <h2>Sign in to your account</h2>

                    <p>Enter your credentials to access your salon management system.</p>
                  </div>

                  {/* Error */}
                  {error && (
                    <div className="login-error">
                      <div className="error-icon">!</div>

                      <div>
                        <strong>Login unsuccessful</strong>

                        <span>{error}</span>
                      </div>
                    </div>
                  )}

                  {/* Form */}
                  <CForm onSubmit={handleLogin}>
                    {/* Email */}
                    <div className="form-field">
                      <label>Email Address</label>

                      <CInputGroup className="premium-input">
                        <CInputGroupText>
                          <CIcon icon={cilUser} />
                        </CInputGroupText>

                        <CFormInput
                          type="email"
                          placeholder="Enter your email"
                          autoComplete="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          disabled={loading}
                        />
                      </CInputGroup>
                    </div>

                    {/* Password */}
                    <div className="form-field">
                      <div className="password-label">
                        <label>Password</label>

                        <button
                          type="button"
                          className="forgot-password"
                          onClick={() => {
                            // Add forgot password route later
                          }}
                        >
                          Forgot password?
                        </button>
                      </div>

                      <CInputGroup className="premium-input">
                        <CInputGroupText>
                          <CIcon icon={cilLockLocked} />
                        </CInputGroupText>

                        <CFormInput
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Enter your password"
                          autoComplete="current-password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          disabled={loading}
                        />

                        <CInputGroupText
                          className="password-toggle"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          <CIcon icon={showPassword ? cilEyeSlash : cilEye} />
                        </CInputGroupText>
                      </CInputGroup>
                    </div>

                    {/* Remember */}
                    <div className="login-options">
                      <label className="remember-me">
                        <input type="checkbox" />

                        <span>Remember me</span>
                      </label>
                    </div>

                    {/* Login Button */}
                    <CButton type="submit" className="login-button w-100" disabled={loading}>
                      {loading ? (
                        <>
                          <CSpinner size="sm" className="me-2" />
                          Signing in...
                        </>
                      ) : (
                        <>
                          Sign In
                          <span className="button-arrow">→</span>
                        </>
                      )}
                    </CButton>
                  </CForm>

                  {/* Security */}
                  <div className="secure-login">
                    <div className="secure-icon">
                      <CIcon icon={cilLockLocked} />
                    </div>

                    <div>
                      <strong>Secure Login</strong>

                      <span>Your account information is protected.</span>
                    </div>
                  </div>

                  {/* Mobile Footer */}
                  <div className="mobile-footer d-lg-none">Powered by Bluesplash IT Solution</div>
                </CCardBody>
              </CCard>
            </div>
          </CCol>
        </CRow>
      </CContainer>

      {/* =====================================================
          PAGE STYLES
      ====================================================== */}
      <style>{`

        * {
          box-sizing: border-box;
        }

        .glamour-login-page {
          min-height: 100vh;
          background: #f7f7f5;
          font-family:
            Inter,
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            sans-serif;
        }

        /* ============================================
           LEFT BRAND PANEL
        ============================================ */

        .glamour-brand-panel {
          position: relative;
          min-height: 100vh;
          background:
            linear-gradient(
              135deg,
              #111111 0%,
              #181818 50%,
              #0b0b0b 100%
            );
          overflow: hidden;
          color: #ffffff;
        }

        .glamour-brand-panel::before {
          content: "";
          position: absolute;
          width: 600px;
          height: 600px;
          border-radius: 50%;
          background: rgba(232, 189, 53, 0.07);
          top: -250px;
          right: -180px;
        }

        .glamour-brand-panel::after {
          content: "";
          position: absolute;
          width: 500px;
          height: 500px;
          border-radius: 50%;
          border: 1px solid rgba(232, 189, 53, 0.08);
          bottom: -250px;
          left: -200px;
        }

        .brand-overlay {
          position: relative;
          z-index: 2;
          width: 100%;
          min-height: 100vh;
          padding: 55px 8%;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        /* Logo */

        .glamour-logo,
        .mobile-logo {
          display: flex;
          align-items: center;
          gap: 13px;
        }

        .logo-mark {
          width: 48px;
          height: 48px;
          border-radius: 13px;
          display: flex;
          align-items: center;
          justify-content: center;
          background:
            linear-gradient(
              135deg,
              #f4d46a,
              #c9a227
            );
          color: #111111;
          font-size: 25px;
          font-weight: 900;
          box-shadow:
            0 8px 25px rgba(232, 189, 53, 0.2);
        }

        .logo-title {
          font-size: 21px;
          line-height: 1;
          letter-spacing: 3px;
          font-weight: 800;
        }

        .logo-subtitle {
          margin-top: 5px;
          font-size: 8px;
          letter-spacing: 3px;
          color: #c9a227;
          font-weight: 700;
        }

        /* Brand Content */

        .brand-content {
          max-width: 650px;
          margin-top: 30px;
          margin-bottom: 30px;
        }

        .brand-badge {
          display: inline-flex;
          align-items: center;
          gap: 9px;
          padding: 9px 14px;
          border-radius: 100px;
          border: 1px solid rgba(232, 189, 53, 0.2);
          background: rgba(232, 189, 53, 0.06);
          color: #e8bd35;
          font-size: 10px;
          letter-spacing: 1.2px;
          font-weight: 700;
          margin-bottom: 25px;
        }

        .badge-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #e8bd35;
          box-shadow:
            0 0 10px rgba(232, 189, 53, 0.7);
        }

        .brand-content h1 {
          font-size: clamp(42px, 4.5vw, 70px);
          line-height: 1.04;
          letter-spacing: -2.5px;
          font-weight: 800;
          margin: 0 0 25px;
        }

        .brand-content h1 span {
          color: #e8bd35;
        }

        .brand-content > p {
          max-width: 540px;
          color: #a8a8a8;
          font-size: 16px;
          line-height: 1.8;
          margin-bottom: 35px;
        }

        /* Features */

        .feature-list {
          display: flex;
          flex-direction: column;
          gap: 17px;
        }

        .feature-item {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .feature-icon {
          width: 34px;
          height: 34px;
          border-radius: 9px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(232, 189, 53, 0.09);
          color: #e8bd35;
        }

        .feature-item strong,
        .feature-item span {
          display: block;
        }

        .feature-item strong {
          font-size: 13px;
          margin-bottom: 3px;
        }

        .feature-item span {
          color: #777777;
          font-size: 11px;
        }

        /* Footer */

        .brand-footer {
          display: flex;
          align-items: center;
          gap: 12px;
          color: #626262;
          font-size: 10px;
        }

        .footer-divider {
          color: #333333;
        }

        /* ============================================
           RIGHT LOGIN PANEL
        ============================================ */

        .glamour-login-panel {
          min-height: 100vh;
          background: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px 7%;
        }

        .login-wrapper {
          width: 100%;
          max-width: 450px;
        }

        .login-card {
          background: transparent;
        }

        /* Heading */

        .login-heading {
          margin-bottom: 32px;
        }

        .welcome-label {
          color: #c19a22;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 2px;
          margin-bottom: 10px;
        }

        .login-heading h2 {
          margin: 0 0 10px;
          color: #171717;
          font-size: 31px;
          line-height: 1.2;
          font-weight: 800;
          letter-spacing: -0.7px;
        }

        .login-heading p {
          margin: 0;
          color: #777777;
          font-size: 13px;
          line-height: 1.7;
        }

        /* Error */

        .login-error {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 13px 15px;
          margin-bottom: 22px;
          border-radius: 11px;
          border: 1px solid #f3cccc;
          background: #fff7f7;
          color: #8a2525;
        }

        .error-icon {
          width: 22px;
          height: 22px;
          flex-shrink: 0;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #d64545;
          color: #ffffff;
          font-size: 12px;
          font-weight: 800;
        }

        .login-error strong,
        .login-error span {
          display: block;
        }

        .login-error strong {
          font-size: 12px;
          margin-bottom: 3px;
        }

        .login-error span {
          font-size: 11px;
          line-height: 1.5;
        }

        /* Form */

        .form-field {
          margin-bottom: 21px;
        }

        .form-field label {
          display: block;
          color: #333333;
          font-size: 12px;
          font-weight: 700;
          margin-bottom: 8px;
        }

        .premium-input {
          height: 52px;
          border: 1px solid #dedede;
          border-radius: 11px;
          overflow: hidden;
          transition: all 0.2s ease;
          background: #ffffff;
        }

        .premium-input:focus-within {
          border-color: #d0aa31;
          box-shadow:
            0 0 0 3px rgba(208, 170, 49, 0.10);
        }

        .premium-input .input-group-text {
          border: 0;
          background: #ffffff;
          color: #999999;
          padding-left: 15px;
          padding-right: 8px;
        }

        .premium-input .form-control {
          border: 0;
          box-shadow: none !important;
          font-size: 13px;
          padding-left: 8px;
          color: #222222;
        }

        .premium-input .form-control::placeholder {
          color: #aaaaaa;
        }

        .password-toggle {
          cursor: pointer;
          padding-right: 15px !important;
          padding-left: 8px !important;
          transition: color 0.2s ease;
        }

        .password-toggle:hover {
          color: #c9a227 !important;
        }

        .password-label {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .forgot-password {
          border: 0;
          background: transparent;
          padding: 0;
          color: #b08a1e;
          font-size: 11px;
          font-weight: 600;
          cursor: pointer;
        }

        .forgot-password:hover {
          color: #8f6f12;
          text-decoration: underline;
        }

        /* Options */

        .login-options {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: -2px;
          margin-bottom: 25px;
        }

        .remember-me {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #777777;
          font-size: 11px;
          cursor: pointer;
        }

        .remember-me input {
          width: 15px;
          height: 15px;
          accent-color: #c9a227;
          cursor: pointer;
        }

        /* Button */

        .login-button {
          height: 54px;
          border: 0 !important;
          border-radius: 11px !important;
          background:
            linear-gradient(
              135deg,
              #e8bd35 0%,
              #c9a227 100%
            ) !important;
          color: #171717 !important;
          font-size: 13px;
          font-weight: 800;
          letter-spacing: 0.3px;
          box-shadow:
            0 9px 25px rgba(201, 162, 39, 0.18);
          transition:
            transform 0.2s ease,
            box-shadow 0.2s ease;
        }

        .login-button:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow:
            0 13px 30px rgba(201, 162, 39, 0.25);
        }

        .login-button:active:not(:disabled) {
          transform: translateY(0);
        }

        .login-button:disabled {
          opacity: 0.75;
        }

        .button-arrow {
          margin-left: 10px;
          font-size: 17px;
        }

        /* Security */

        .secure-login {
          margin-top: 28px;
          padding: 15px;
          border-radius: 11px;
          background: #f8f8f7;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .secure-icon {
          width: 34px;
          height: 34px;
          border-radius: 9px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #eeeeeb;
          color: #a9851c;
        }

        .secure-login strong,
        .secure-login span {
          display: block;
        }

        .secure-login strong {
          font-size: 11px;
          color: #444444;
          margin-bottom: 3px;
        }

        .secure-login span {
          color: #999999;
          font-size: 10px;
        }

        /* Mobile */

        .mobile-logo {
          justify-content: center;
          margin-bottom: 40px;
        }

        .mobile-footer {
          text-align: center;
          margin-top: 30px;
          color: #aaaaaa;
          font-size: 9px;
        }

        /* ============================================
           RESPONSIVE
        ============================================ */

        @media (max-width: 991px) {

          .glamour-login-panel {
            min-height: 100vh;
            padding: 40px 25px;
          }

          .login-wrapper {
            max-width: 430px;
          }

        }

        @media (max-width: 575px) {

          .glamour-login-panel {
            padding: 30px 20px;
          }

          .login-heading h2 {
            font-size: 27px;
          }

          .login-heading {
            margin-bottom: 25px;
          }

          .premium-input {
            height: 50px;
          }

        }

      `}</style>
    </div>
  )
}

export default Login
