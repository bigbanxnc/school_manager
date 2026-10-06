package com.school.manager.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.domain.Page;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PageResponse<T> {
    private List<T> content;
    private long totalElements;
    private int totalPages;
    private int page;
    private int size;

    public static <T> PageResponse<T> of(Page<?> pageData, List<T> content) {
        long total = pageData.getTotalElements();
        int totalP = pageData.getTotalPages();
        if (total == 0) {
            totalP = 1;
        }
        return PageResponse.<T>builder()
                .content(content)
                .totalElements(total)
                .totalPages(totalP)
                .page(pageData.getNumber() + 1)
                .size(pageData.getSize())
                .build();
    }

    public static <T> PageResponse<T> of(List<T> content, long totalElements, int totalPages, int page, int size) {
        return PageResponse.<T>builder()
                .content(content)
                .totalElements(totalElements)
                .totalPages(totalElements == 0 ? 1 : totalPages)
                .page(page)
                .size(size)
                .build();
    }

    @SuppressWarnings("unused")
    public static class PageResponseBuilder<T> {
        public PageResponse<T> build() {
            int computedPages = this.totalPages;
            if (this.totalElements == 0 && computedPages == 0) {
                computedPages = 1;
            }
            return new PageResponse<>(this.content, this.totalElements, computedPages, this.page, this.size);
        }
    }
}
