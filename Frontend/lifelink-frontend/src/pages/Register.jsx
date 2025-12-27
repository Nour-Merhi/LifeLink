import React, { useState } from "react";
import { Link } from "react-router-dom";
import registerImg from "../assets/illustrations/register.svg"; 
const fakeUsers = [
  { username: "ali", email: "ali@mail.com", password: "pass123", dob: "2020-08-11", bloodType: "A+" },
  { username: "sara", email: "sara@mail.com", password: "pass456", dob: "1998-07-23", bloodType: "O-" },
  { username: "john", email: "john@mail.com", password: "john789", dob: "1995-05-10", bloodType: "B+" },
];


const Register = () => {
    
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    dob: "",
    bloodType: "",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
  e.preventDefault();

  const exists = fakeUsers.some(user =>
    user.username.toLowerCase() === formData.username.toLowerCase() ||
    user.email.toLowerCase() === formData.email.toLowerCase()
  );

  if (exists) {
    alert("User with this username or email already exists (fake test).");
  } else if (formData.password !== formData.confirmPassword) {
    alert("Passwords do not match!");
  } else {
    alert("Registration successful (fake test)!");
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
    className="w-[85%] lg:w-[90%] object-contain mb-6"
  />
  
  <p className="text-center text-base text-gray-700">
    Already a Donor & Have an Account?{" "}
    <Link to="/login" className="text-red-600 hover:underline">
      Click here
    </Link>
  </p>
</div>

        


        {/* Right Side - Form */}
        <div className="w-full md:w-1/2 px-8 flex flex-col justify-center">
          <h2 className="text-2xl font-bold text-red-600 mb-6 text-center">
            Registration
          </h2>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <input
              type="text"
              name="username"
              placeholder="Username"
              value={formData.username}
              onChange={handleChange}
              required
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600"
            />

            <input
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600"
            />

            <input
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              required
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600"
            />

            <input
              type="password"
              name="confirmPassword"
              placeholder="Confirm Password"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600"
            />

            <div className="flex gap-3">
              <input
                type="date"
                name="dob"
                value={formData.dob}
                onChange={handleChange}
                required
                className="w-1/2 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600"
              />

              <select
                name="bloodType"
                value={formData.bloodType}
                onChange={handleChange}
                required
                className="w-1/2 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600"
              >
                <option value="">Blood Type</option>
                {bloodTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-red-900 to-red-700 text-white py-3 rounded-lg hover:bg-red-700 transition"
            >
              Register
            </button>
          </form>

          
          <div className="flex items-center justify-center my-3">
            <div className="border-t border-gray-300 w-1/3"></div>
            <span className="px-3 text-gray-500 text-sm">or</span>
            <div className="border-t border-gray-300 w-1/3"></div>
          </div>

          <button className="flex items-center justify-center gap-2 w-full border border-gray-300 py-3 rounded-lg hover:bg-gray-50">
            <img
              src="/logogoogle.jpg"
              alt="google logo"
              className="w-6 h-5"
            />
            Continue with Google
          </button>

          <p className="text-[11px] text-center text-gray-500 mt-2">
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
