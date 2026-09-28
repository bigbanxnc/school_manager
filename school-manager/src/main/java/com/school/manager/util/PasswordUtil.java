package com.school.manager.util;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;

/**
 * Tiện ích mã hóa và kiểm tra mật khẩu sử dụng thuật toán băm SHA-1 (Hexadecimal).
 */
public final class PasswordUtil {

    private PasswordUtil() {
        // Utility class
    }

    /**
     * Băm chuỗi mật khẩu thô bằng thuật toán SHA-1 thành chuỗi Hex 40 ký tự viết thường.
     *
     * @param rawPassword mật khẩu chưa băm
     * @return chuỗi SHA-1 hash (40 ký tự hex), hoặc null nếu rawPassword là null
     */
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

    /**
     * Kiểm tra chuỗi có phải là mã băm SHA-1 hợp lệ (40 ký tự hex) hay không.
     */
    public static boolean isSha1(String str) {
        if (str == null || str.trim().length() != 40) {
            return false;
        }
        return str.trim().matches("^[a-fA-F0-9]{40}$");
    }

    /**
     * Đảm bảo mật khẩu luôn ở định dạng mã băm SHA-1:
     * - Nếu đã là mã SHA-1 (40 ký tự hex), giữ nguyên (viết thường).
     * - Nếu là mật khẩu thô, tiến hành băm SHA-1 ngay lập tức.
     */
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

    /**
     * So khớp mật khẩu người dùng nhập vào với mật khẩu/mã hash được lưu trữ trong DB.
     * Hỗ trợ đối chiếu cả chuẩn SHA-1 lẫn mật khẩu thô cũ (nếu có) để đảm bảo không gián đoạn hệ thống.
     *
     * @param rawPassword         mật khẩu người dùng nhập khi đăng nhập hoặc đổi mật khẩu
     * @param storedHashOrPassword mật khẩu hoặc mã hash được lưu trong Database
     * @return true nếu mật khẩu trùng khớp, ngược lại false
     */
    public static boolean matches(String rawPassword, String storedHashOrPassword) {
        if (rawPassword == null || storedHashOrPassword == null) {
            return false;
        }
        String hashedRaw = sha1Hex(rawPassword);
        return hashedRaw.equalsIgnoreCase(storedHashOrPassword) || rawPassword.equals(storedHashOrPassword);
    }
}
