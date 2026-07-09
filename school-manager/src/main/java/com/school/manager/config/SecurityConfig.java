package com.school.manager.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.annotation.web.configurers.HeadersConfigurer;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.Collections;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    public SecurityConfig() {
        System.out.println("=========================================================================");
        System.out.println("[SecurityConfig] Hàm khởi tạo SecurityConfig đã được gọi!");
        System.out.println("[SecurityConfig] Cấu hình Spring Security tùy chỉnh đang hoạt động.");
        System.out.println("=========================================================================");
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) {
        try {
            System.out.println("[SecurityConfig] Đang cấu hình SecurityFilterChain với permitAll...");
            http
                    .csrf(AbstractHttpConfigurer::disable)
                    .cors(cors -> cors.configurationSource(corsConfigurationSource()))

                    .formLogin(AbstractHttpConfigurer::disable)
                    .httpBasic(AbstractHttpConfigurer::disable)

                    .authorizeHttpRequests(auth -> auth
                            .requestMatchers("/api/**").permitAll()
                            .requestMatchers("/h2-console/**").permitAll()
                            .anyRequest().permitAll()
                    )

                    .headers(headers -> headers
                            .frameOptions(HeadersConfigurer.FrameOptionsConfig::disable)
                    );

            return http.build();
        } catch (Exception e) {
            System.err.println("[SecurityConfig] LỖI NGHIÊM TRỌNG khi cấu hình HttpSecurity: " + e.getMessage());
            throw new RuntimeException("Lỗi khi cấu hình SecurityFilterChain", e);
        }
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOriginPatterns(Collections.singletonList("*"));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
        configuration.setAllowedHeaders(Arrays.asList("Authorization", "Cache-Control", "Content-Type", "Origin", "Accept"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
