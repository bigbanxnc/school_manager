package com.school.manager.util;

import java.util.List;
import java.util.concurrent.atomic.AtomicReference;

public final class ScoreUtil {

    private ScoreUtil() {}

    public record SubjectPair(Double value, Double rate) {}

    public static Double calculateSubjectAverage(List<SubjectPair> subjectPairList) {
        if (subjectPairList == null || subjectPairList.isEmpty()) {
            return null;
        }

        AtomicReference<Double> sum = new AtomicReference<>(0.0);
        AtomicReference<Double> totalWeight = new AtomicReference<>(0.0);

        subjectPairList.stream()
                .filter(s -> s != null && s.value() != null)
                .forEach(s -> {
                    sum.updateAndGet(v -> v + s.value() * s.rate());
                    totalWeight.updateAndGet(v -> v + s.rate());
                });

        return totalWeight.get() > 0
                ? Math.round((sum.get() / totalWeight.get()) * 100.0) / 100.0
                : null;
    }

    public static Double calculateAverage(Double oral, Double m15, Double mid, Double finalScore) {
        return calculateSubjectAverage(List.of(
                new SubjectPair(oral, 1.0),
                new SubjectPair(m15, 1.0),
                new SubjectPair(mid, 2.0),
                new SubjectPair(finalScore, 3.0)
        ));
    }

    public static Double calculateGpa(Double... scores) {
        if (scores == null || scores.length == 0) {
            return null;
        }
        java.util.DoubleSummaryStatistics stats = java.util.stream.Stream.of(scores)
                .filter(java.util.Objects::nonNull)
                .mapToDouble(Double::doubleValue)
                .summaryStatistics();
        return stats.getCount() > 0 ? Math.round(stats.getAverage() * 100.0) / 100.0 : null;
    }
}
