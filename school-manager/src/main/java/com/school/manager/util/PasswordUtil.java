package com.school.manager.util;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;


public final class PasswordUtil {

    private PasswordUtil() {

    }

    public static String sha1Hex(String rawPassword) {
        if (rawPassword == null) {
            return null;
        }
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-1");
            byte[] digest = md.digest(rawPassword.getBytes(StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder();
            for (byte b : digest) {
                hexString.append(String.format("%02x", b));
            }
            return hexString.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("Không tìm thấy thuật toán băm SHA-1 trên hệ thống JVM", e);
        }
    }


    public static boolean isSha1(String str) {
        if (str == null || str.trim().length() != 40) {
            return false;
        }
        return str.trim().matches("^[a-fA-F0-9]{40}$");
    }

    public static String ensureSha1(String password) {
        if (password == null || password.trim().isEmpty()) {
            return null;
        }
        String trimmed = password.trim();
        if (isSha1(trimmed)) {
            return trimmed.toLowerCase();
        }
        return sha1Hex(trimmed);
    }


    public static boolean matches(String rawPassword, String storedHashOrPassword) {
        if (rawPassword == null || storedHashOrPassword == null) {
            return false;
        }
        String hashedRaw = sha1Hex(rawPassword);
        return hashedRaw.equalsIgnoreCase(storedHashOrPassword) || rawPassword.equals(storedHashOrPassword);
    }
}
