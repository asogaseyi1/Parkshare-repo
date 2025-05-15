import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios'; 
import './Register.css'

const Register: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phoneNumber: '',
  });

  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const userData = {
        ...formData,
        roles: ['USER'], 
      };

      console.log("Submitting registration:", userData);


     const response = await api.post('/auth/register', userData);

      if (response.status === 200) {
        alert('Registration successful!');
        navigate('/login');
      }
    } catch (error) {
      alert('Registration failed. User may already exist.');
      console.error(error);
    }
  };

  return (
    <div className='registerDiv'>
    <form onSubmit={handleSubmit}>
      <h2>Register</h2>
      <input type="text" name="name" placeholder="Name" onChange={handleChange} required />
      <input type="email" name="email" placeholder="Email" onChange={handleChange} required />
      <input type="password" name="password" placeholder="Password" onChange={handleChange} required />
      <input type="text" name="phoneNumber" placeholder="Phone Number" onChange={handleChange} required />
      <button type="submit">Register</button>
    </form>
    </div>
  );
};

export default Register;
