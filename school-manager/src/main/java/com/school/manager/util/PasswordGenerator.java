package com.school.manager.util;

import java.security.SecureRandom;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

/**
 * Tiện ích sinh mật khẩu ngẫu nhiên đạt chuẩn an toàn cao:
 * - Độ dài: Đúng 10 ký tự.
 * - Thành phần: Chữ cái thường (a-z), chữ cái hoa (A-Z), và chữ số (0-9).
 * - Sử dụng SecureRandom để đảm bảo an toàn mật mã.
 * - Luôn đảm bảo tối thiểu 1 chữ thường, 1 chữ hoa và 1 chữ số.
 */
public final class PasswordGenerator {

    private static final String LOWER = "abcdefghijklmnopqrstuvwxyz";
    private static final String UPPER = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    private static final String DIGITS = "0123456789";
    private static final String ALL_CHARS = LOWER + UPPER + DIGITS;
    private static final SecureRandom RANDOM = new SecureRandom();

    private PasswordGenerator() {
        // Utility class
    }

    /**
     * Sinh ngẫu nhiên mật khẩu mặc định 10 ký tự.
     *
     * @return Chuỗi mật khẩu ngẫu nhiên thỏa mãn yêu cầu bảo mật
     */
    public static String generatePassword() {
        return generatePassword(10);
    }

    /**
     * Sinh ngẫu nhiên mật khẩu với độ dài xác định.
     *
     * @param length Độ dài mật khẩu (tối thiểu 3 ký tự)
     * @return Chuỗi mật khẩu ngẫu nhiên
     */
    @SuppressWarnings("unused")
    public static String generatePassword(int length) {
        if (length < 3) {
            length = 10;
        }

        List<Character> chars = new ArrayList<>();
        // Đảm bảo tối thiểu 1 chữ thường, 1 chữ hoa, 1 chữ số
        chars.add(LOWER.charAt(RANDOM.nextInt(LOWER.length())));
        chars.add(UPPER.charAt(RANDOM.nextInt(UPPER.length())));
        chars.add(DIGITS.charAt(RANDOM.nextInt(DIGITS.length())));

        // Điền các ký tự ngẫu nhiên còn lại từ tập ALL_CHARS
        for (int i = 3; i < length; i++) {
            chars.add(ALL_CHARS.charAt(RANDOM.nextInt(ALL_CHARS.length())));
        }

        // Xáo trộn vị trí ngẫu nhiên bằng SecureRandom
        Collections.shuffle(chars, RANDOM);

        StringBuilder sb = new StringBuilder();
        for (char c : chars) {
            sb.append(c);
        }
        return sb.toString();
    }
}
