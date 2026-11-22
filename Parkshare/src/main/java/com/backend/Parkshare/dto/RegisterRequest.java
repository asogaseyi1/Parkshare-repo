package com.backend.Parkshare.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

import java.util.List;

public class RegisterRequest {
    @NotBlank(message = "Name is required")
    public String name;

    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    public String email;

    @NotBlank(message = "Password is required")
    public String password;

    @NotBlank(message = "Phone number is required")
    public String phoneNumber;

    public List<String> roles;
}
