import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";
import registerImg from "../assets/illustrations/register.svg"; 

const Register = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [emailWarning, setEmailWarning] = useState("");
  const [emailDomainWarning, setEmailDomainWarning] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [passwordChecks, setPasswordChecks] = useState({
    length: false,
    upper: false,
    lower: false,
    number: false,
    special: false,
  });
    
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    dob: "",
    bloodType: "",
    city: "",
  });

  const emailCheckTimerRef = useRef(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setError(""); // Clear error on input change

    if (name === "email") {
      setEmailWarning(getEmailWarning(value));
      setEmailDomainWarning("");
    }

    // Check password requirements when password changes
    if (name === "password") {
      checkPasswordRequirements(value);
    }
  };

  const getEmailWarning = (email) => {
    const val = String(email || "").trim();
    if (!val) return "";

    // Basic format check (same idea as <input type="email"> but more explicit)
    const basic = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    if (!basic.test(val)) {
      return "This email doesn't look valid. If it's incorrect, no emails will be sent to it.";
    }

    // Extra lightweight domain sanity check (still not a guarantee of deliverability)
    const domain = val.split("@")[1] || "";
    if (domain.startsWith(".") || domain.endsWith(".") || domain.includes("..")) {
      return "This email domain looks invalid. If it's incorrect, no emails will be sent to it.";
    }

    return "";
  };

  const checkEmailDomain = async (email) => {
    const val = String(email || "").trim();
    if (!val) return;

    // If format is clearly invalid, don't call the backend
    const basic = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    if (!basic.test(val)) return;

    try {
      const res = await api.get("/api/email/check", { params: { email: val } });
      const hasDns = Boolean(res?.data?.has_dns);
      if (!hasDns) {
        setEmailDomainWarning(
          "This email domain doesn't seem to exist (no DNS/MX records). If it's incorrect, emails may not reach you."
        );
      } else {
        setEmailDomainWarning("");
      }
    } catch {
      // Don't block registration if check fails
      setEmailDomainWarning("");
    }
  };

  // Debounced email domain check while typing
  useEffect(() => {
    if (emailCheckTimerRef.current) clearTimeout(emailCheckTimerRef.current);
    if (!formData.email) return;

    emailCheckTimerRef.current = setTimeout(() => {
      checkEmailDomain(formData.email);
    }, 700);

    return () => {
      if (emailCheckTimerRef.current) clearTimeout(emailCheckTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.email]);

  const checkPasswordRequirements = (password) => {
    const checks = {
      length: password.length >= 8,
      upper: /[A-Z]/.test(password),
      lower: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[^A-Za-z0-9]/.test(password),
    };
    setPasswordChecks(checks);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Client-side validation
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match!");
      setLoading(false);
      return;
    }

    try {
      // First, get the CSRF cookie from Sanctum
      await api.get("/sanctum/csrf-cookie");

      // Then, make the registration request
      const response = await api.post("/api/register", {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        dob: formData.dob,
        bloodType: formData.bloodType,
        city: formData.city || null,
      });

      // Registration successful - trigger window event to refresh navbar
      window.dispatchEvent(new Event('auth-change'));
      navigate("/home");
    } catch (err) {
      if (err.response?.data?.errors) {
        // Handle validation errors
        const errors = err.response.data.errors;
        const firstError = Object.values(errors)[0][0];
        setError(firstError);
      } else {
        // Show more detailed error in development, generic in production
        const errorMsg = err.response?.data?.error || err.response?.data?.message || "Registration failed. Please try again.";
        setError(errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  const bloodTypes = [
    "A+",
    "A-",
    "B+",
    "B-",
    "AB+",
    "AB-",
    "O+",
    "O-",
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white rounded-2xl shadow-lg flex flex-col md:flex-row w-full max-w-4xl p-6">
       
      <div className="hidden md:flex w-1/2 flex-col items-center justify-center">
        <img
          src={registerImg}
          alt="Registration illustration"
          className="w-[85%] lg:w-[90%] object-contain"
        />
        
        <p className="text-center text-base text-gray-700 !text-[14px] mt-[-40px]">
          Already a Donor & Have an Account?{" "}
          <Link to="/login" className="text-red-600 hover:underline">
            Click here
          </Link>
        </p>
      </div>

        {/* Right Side - Form */}
        <div className="w-full md:w-1/2 px-8 flex flex-col justify-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4 text-center">
            Registration
          </h2>

          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form className="space-y-3" onSubmit={handleSubmit}>
            <input
              type="text"
              name="username"
              placeholder="Username"
              value={formData.username}
              onChange={handleChange}
              required
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600"
            />

            <input
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
              onBlur={(e) => {
                // Browser validity check for extra reliability
                const val = e.target.value;
                if (val && !e.target.validity.valid) {
                  setEmailWarning("This email doesn't look valid. If it's incorrect, no emails will be sent to it.");
                } else {
                  setEmailWarning(getEmailWarning(val));
                }
                checkEmailDomain(val);
              }}
              required
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600"
            />
            {emailWarning ? (
              <div className="mt-2 p-2 rounded-lg text-[12px] bg-yellow-50 border border-yellow-300 text-yellow-800">
                {emailWarning}
              </div>
            ) : null}
            {emailDomainWarning ? (
              <div className="mt-2 p-2 rounded-lg text-[12px] bg-yellow-50 border border-yellow-300 text-yellow-800">
                {emailDomainWarning}
              </div>
            ) : null}

            <div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Password"
                  value={formData.password}
                  onChange={handleChange}
                  onFocus={() => setIsPasswordFocused(true)}
                  onBlur={() => setIsPasswordFocused(false)}
                  required
                  className="w-full p-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <AiOutlineEyeInvisible size={20} />
                  ) : (
                    <AiOutlineEye size={20} />
                  )}
                </button>
              </div>
              {/* Password Requirements - Only show when password field is focused */}
              {isPasswordFocused && (
                <div className="mt-2 text-xs text-gray-600">
                  <ul className="space-y-1">
                    <li className={`flex items-center ${passwordChecks.length ? 'text-green-600' : 'text-gray-500'}`}>
                      <span className={`mr-2 ${passwordChecks.length ? 'text-green-600' : 'text-gray-400'}`}>
                        {passwordChecks.length ? '✓' : '○'}
                      </span>
                      At least 8 characters
                    </li>
                    <li className={`flex items-center ${passwordChecks.upper ? 'text-green-600' : 'text-gray-500'}`}>
                      <span className={`mr-2 ${passwordChecks.upper ? 'text-green-600' : 'text-gray-400'}`}>
                        {passwordChecks.upper ? '✓' : '○'}
                      </span>
                      One uppercase letter (A-Z)
                    </li>
                    <li className={`flex items-center ${passwordChecks.lower ? 'text-green-600' : 'text-gray-500'}`}>
                      <span className={`mr-2 ${passwordChecks.lower ? 'text-green-600' : 'text-gray-400'}`}>
                        {passwordChecks.lower ? '✓' : '○'}
                      </span>
                      One lowercase letter (a-z)
                    </li>
                    <li className={`flex items-center ${passwordChecks.number ? 'text-green-600' : 'text-gray-500'}`}>
                      <span className={`mr-2 ${passwordChecks.number ? 'text-green-600' : 'text-gray-400'}`}>
                        {passwordChecks.number ? '✓' : '○'}
                      </span>
                      One number (0-9)
                    </li>
                    <li className={`flex items-center ${passwordChecks.special ? 'text-green-600' : 'text-gray-500'}`}>
                      <span className={`mr-2 ${passwordChecks.special ? 'text-green-600' : 'text-gray-400'}`}>
                        {passwordChecks.special ? '✓' : '○'}
                      </span>
                      One special character (!@#$%^&*...)
                    </li>
                  </ul>
                </div>
              )}
            </div>

            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                placeholder="Confirm Password"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                className="w-full p-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                tabIndex={-1}
              >
                {showConfirmPassword ? (
                  <AiOutlineEyeInvisible size={20} />
                ) : (
                  <AiOutlineEye size={20} />
                )}
              </button>
            </div>

            <div className="flex gap-3">
              <input
                type="date"
                name="dob"
                value={formData.dob}
                onChange={handleChange}
                required
                className="w-1/2 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600"
              />

              <select
                name="bloodType"
                value={formData.bloodType}
                onChange={handleChange}
                required
                className="w-1/2 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600"
              >
                <option value="">Blood Type</option>
                {bloodTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                placeholder="City"
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600"
              />

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-red-900 to-red-700 text-white py-2 rounded-lg hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Registering..." : "Register"}
            </button>
          </form>
         

          <p className="!text-[14px] text-center text-gray-500 mt-2">
            By signing in you agree to our{" "}
            <a href="#" className="text-red-600 hover:underline">
              Terms & Conditions
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
