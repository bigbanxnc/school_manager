package com.school.manager.exception;

import com.fasterxml.jackson.annotation.JsonInclude;
import jakarta.servlet.http.HttpServletRequest;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.support.DefaultMessageSourceResolvable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.lang.NonNull;
import org.springframework.validation.FieldError;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.servlet.NoHandlerFoundException;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class ErrorResponse {
        private int status;
        private String error;
        private String message;
        private LocalDateTime timestamp;
        private String path;
        private Map<String, String> errors;
    }

    @Getter
    public static class AppException extends ResponseStatusException {
        private final HttpStatus status;
        private final Map<String, String> errors;

        public AppException(@org.springframework.lang.Nullable HttpStatus status, String message) {
            this(status, message, null);
        }

        public AppException(@org.springframework.lang.Nullable HttpStatus status, String message, @org.springframework.lang.Nullable Map<String, String> errors) {
            super(status != null ? status : HttpStatus.INTERNAL_SERVER_ERROR, message != null ? message : "");
            this.status = (status != null) ? status : HttpStatus.INTERNAL_SERVER_ERROR;
            this.errors = errors;
        }

        @Override
        @NonNull
        public String getMessage() {
            String reason = getReason();
            return (reason != null && !reason.isEmpty()) ? reason : super.getMessage();
        }

        public static AppException badRequest(String message) {
            return new AppException(HttpStatus.BAD_REQUEST, message);
        }

        public static AppException unauthorized(String message) {
            return new AppException(HttpStatus.UNAUTHORIZED, message);
        }

        public static AppException unauthorized(String message, Map<String, String> errors) {
            return new AppException(HttpStatus.UNAUTHORIZED, message, errors);
        }

        public static AppException forbidden(String message) {
            return new AppException(HttpStatus.FORBIDDEN, message);
        }

        public static AppException forbidden(String message, Map<String, String> errors) {
            return new AppException(HttpStatus.FORBIDDEN, message, errors);
        }

        public static AppException notFound(String message) {
            return new AppException(HttpStatus.NOT_FOUND, message);
        }

        public static AppException notFound(String message, Map<String, String> errors) {
            return new AppException(HttpStatus.NOT_FOUND, message, errors);
        }

        public static AppException badRequest(String message, Map<String, String> errors) {
            return new AppException(HttpStatus.BAD_REQUEST, message, errors);
        }

        public static AppException conflict(String message) {
            return new AppException(HttpStatus.CONFLICT, message);
        }

        public static AppException unprocessable(String message) {
            return new AppException(HttpStatus.UNPROCESSABLE_ENTITY, message);
        }

        public static AppException tooManyRequests(String message) {
            return new AppException(HttpStatus.TOO_MANY_REQUESTS, message);
        }

        public static AppException serviceUnavailable(String message) {
            return new AppException(HttpStatus.SERVICE_UNAVAILABLE, message);
        }
    }

    private ResponseEntity<ErrorResponse> buildResponse(HttpStatus status, String message, HttpServletRequest request) {
        return buildResponse(status, message, null, request);
    }

    private ResponseEntity<ErrorResponse> buildResponse(HttpStatus status, String message, Map<String, String> errors, HttpServletRequest request) {
        ErrorResponse errorResponse = ErrorResponse.builder()
                .status(status.value())
                .error(status.getReasonPhrase())
                .message(message)
                .timestamp(LocalDateTime.now())
                .path(request != null ? request.getRequestURI() : "")
                .errors(errors)
                .build();
        return ResponseEntity.status(status).body(errorResponse);
    }

    @ExceptionHandler(AppException.class)
    public ResponseEntity<ErrorResponse> handleAppException(AppException ex, HttpServletRequest request) {
        log.warn("AppException [{}]: {}", ex.getStatus(), ex.getMessage());
        return buildResponse(ex.getStatus(), ex.getMessage(), ex.getErrors(), request);
    }

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<ErrorResponse> handleResponseStatusException(ResponseStatusException ex, HttpServletRequest request) {
        HttpStatus status = HttpStatus.resolve(ex.getStatusCode().value());
        if (status == null) {
            status = HttpStatus.INTERNAL_SERVER_ERROR;
        }
        String msg = ex.getReason() != null ? ex.getReason() : ex.getMessage();
        return buildResponse(status, msg, request);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ErrorResponse> handleIllegalArgumentException(IllegalArgumentException ex, HttpServletRequest request) {
        String msg = (ex != null && ex.getMessage() != null && !ex.getMessage().isBlank()) ? ex.getMessage() : "Tham số không hợp lệ";
        return buildResponse(HttpStatus.BAD_REQUEST, msg, request);
    }

    @ExceptionHandler(MissingServletRequestParameterException.class)
    public ResponseEntity<ErrorResponse> handleMissingParameter(MissingServletRequestParameterException ex, HttpServletRequest request) {
        return buildResponse(HttpStatus.BAD_REQUEST, "Thiếu tham số bắt buộc: " + ex.getParameterName(), request);
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ErrorResponse> handleTypeMismatch(MethodArgumentTypeMismatchException ex, HttpServletRequest request) {
        String msg = "Kiểu dữ liệu tham số '" + ex.getName() + "' không hợp lệ";
        return buildResponse(HttpStatus.BAD_REQUEST, msg, request);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidationException(MethodArgumentNotValidException ex, HttpServletRequest request) {

        Map<String, String> fieldErrors = new LinkedHashMap<>();
        for (FieldError fieldError : ex.getBindingResult().getFieldErrors()) {
            String field = fieldError.getField();
            String defaultMessage = (fieldError.getDefaultMessage() != null && !fieldError.getDefaultMessage().isBlank())
                    ? fieldError.getDefaultMessage()
                    : "Giá trị không hợp lệ";
            fieldErrors.putIfAbsent(field, defaultMessage);
        }


        String combinedMessage = ex.getBindingResult().getFieldErrors().stream()
                .map(fieldError -> (fieldError.getDefaultMessage() != null && !fieldError.getDefaultMessage().isBlank())
                        ? fieldError.getDefaultMessage()
                        : (fieldError.getField() + " không hợp lệ"))
                .distinct()
                .collect(Collectors.joining("; "));

        if (combinedMessage.isBlank()) {
            combinedMessage = ex.getBindingResult().getAllErrors().stream()
                    .map(DefaultMessageSourceResolvable::getDefaultMessage)
                    .filter(msg -> msg != null && !msg.isBlank())
                    .distinct()
                    .collect(Collectors.joining("; "));
        }

        if (combinedMessage.isBlank()) {
            combinedMessage = "Dữ liệu không hợp lệ";
        }

        log.warn("Validation failed on path [{}]: {}", request != null ? request.getRequestURI() : "", combinedMessage);

        return buildResponse(HttpStatus.BAD_REQUEST, combinedMessage, fieldErrors.isEmpty() ? null : fieldErrors, request);
    }

    @ExceptionHandler(NoHandlerFoundException.class)
    public ResponseEntity<ErrorResponse> handleNoHandlerFound(NoHandlerFoundException ex, HttpServletRequest request) {
        return buildResponse(HttpStatus.NOT_FOUND, "Không tìm thấy đường dẫn: " + ex.getRequestURL(), request);
    }

    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<ErrorResponse> handleMethodNotSupported(HttpRequestMethodNotSupportedException ex, HttpServletRequest request) {
        return buildResponse(HttpStatus.METHOD_NOT_ALLOWED, "Phương thức HTTP '" + ex.getMethod() + "' không được hỗ trợ trên đường dẫn này", request);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGeneralException(Exception ex, HttpServletRequest request) {
        log.error("Unhandled Exception: ", ex);
        return buildResponse(HttpStatus.INTERNAL_SERVER_ERROR, "Đã xảy ra lỗi hệ thống", request);
    }
}
