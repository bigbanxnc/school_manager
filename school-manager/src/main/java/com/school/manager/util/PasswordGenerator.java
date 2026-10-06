package com.school.manager.util;

import java.security.SecureRandom;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;


public final class PasswordGenerator {

    private static final String LOWER = "abcdefghijklmnopqrstuvwxyz";
    private static final String UPPER = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    private static final String DIGITS = "0123456789";
    private static final String ALL_CHARS = LOWER + UPPER + DIGITS;
    private static final SecureRandom RANDOM = new SecureRandom();

    private PasswordGenerator() {

    }


    public static String generatePassword() {
        return generatePassword(10);
    }


    @SuppressWarnings("unused")
    public static String generatePassword(int length) {
        if (length < 3) {
            length = 10;
        }

        List<Character> chars = new ArrayList<>();
        chars.add(LOWER.charAt(RANDOM.nextInt(LOWER.length())));
        chars.add(UPPER.charAt(RANDOM.nextInt(UPPER.length())));
        chars.add(DIGITS.charAt(RANDOM.nextInt(DIGITS.length())));

        for (int i = 3; i < length; i++) {
            chars.add(ALL_CHARS.charAt(RANDOM.nextInt(ALL_CHARS.length())));
        }

        Collections.shuffle(chars, RANDOM);

        StringBuilder sb = new StringBuilder();
        for (char c : chars) {
            sb.append(c);
        }
        return sb.toString();
    }
}
