package com.backend.Parkshare.filter;

import com.backend.Parkshare.util.JwtUtil;
import com.backend.Parkshare.service.CustomUserDetailsService;
import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;
    private final CustomUserDetailsService userDetailsService;

    public JwtAuthenticationFilter(JwtUtil jwtUtil, CustomUserDetailsService userDetailsService) {
        this.jwtUtil = jwtUtil;
        this.userDetailsService = userDetailsService;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String path = request.getServletPath();

        // Skip JWT processing for public endpoints
        if (path.equals("/api/auth/register") || path.equals("/api/auth/login")) {
            filterChain.doFilter(request, response);
            return;
        }

        final String authHeader = request.getHeader("Authorization");

        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String jwt = authHeader.substring(7);

            // Validate before extracting/looking up the user. extractEmail() parses the
            // token and throws (ExpiredJwtException, MalformedJwtException, ...) on anything
            // invalid; calling it first — as this used to — let an expired or tampered token
            // crash the filter chain with an uncaught exception (a 500) on every request,
            // instead of simply being treated as unauthenticated.
            if (jwtUtil.validateToken(jwt) && SecurityContextHolder.getContext().getAuthentication() == null) {
                try {
                    String userEmail = jwtUtil.extractEmail(jwt);
                    UserDetails userDetails = userDetailsService.loadUserByUsername(userEmail);

                    UsernamePasswordAuthenticationToken authToken =
                            new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());

                    SecurityContextHolder.getContext().setAuthentication(authToken);
                } catch (UsernameNotFoundException ex) {
                    // Token is valid but the account it names is gone (e.g. deleted) —
                    // proceed unauthenticated rather than crashing the request.
                    SecurityContextHolder.clearContext();
                }
            }
        }

        filterChain.doFilter(request, response);
    }

}
