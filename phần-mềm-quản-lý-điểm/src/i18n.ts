export type Language = 'vi' | 'en' | 'zh';

export interface Translations {
  systemTitle: string;
  login: string;
  logout: string;
  welcome: string;
  exportCsv: string;
  languageName: string;
  selectLanguage: string;
  auth: {
    changePassword: string;
    currentPassword: string;
    newPassword: string;
    confirmNewPassword: string;
    changePasswordBtn: string;
    changePasswordSuccess: string;
    passwordMismatch: string;
    missingFields: string;
    close: string;
    emailNotFound: string;
    incorrectPassword: string;
    emailRequired: string;
    passwordRequired: string;
    invalidEmailFormat: string;
    newPasswordRequired: string;
    confirmPasswordRequired: string;
    newPasswordMinLength: string;
    currentPasswordRequired: string;
    accountNotFound: string;
    oldPasswordIncorrect: string;
    updating: string;
    unauthorizedMsg: string;
    forbiddenAccountChange: string;
  };
  
  roles: {
    admin: string;
    teacher: string;
    student: string;
  };
  
  subjects: {
    math: string;
    literature: string;
    english: string;
  };

  components: {
    oral: string;
    m15: string;
    mid: string;
    final: string;
    gpa: string;
    subjectGpa: string;
  };

  classStatus: {
    unassigned: string;
  };

  evaluation: {
    excellent: string;
    good: string;
    average: string;
    weak: string;
  };

  tabs: {
    allMembers: string;
    teachers: string;
    studentsGrades: string;
    classes: string;
    permissions: string;
    sourceCode: string;
  };

  table: {
    id: string;
    name: string;
    email: string;
    password: string;
    role: string;
    className: string;
    assignedClasses: string;
    subject: string;
    gpa: string;
    actions: string;
    studentCount: string;
    teacherCount: string;
    academicPerformance: string;
  };

  actions: {
    add: string;
    addMember: string;
    addTeacher: string;
    addStudent: string;
    addClass: string;
    edit: string;
    delete: string;
    save: string;
    cancel: string;
    search: string;
    searchPlaceholder: string;
    filter: string;
    clearFilter: string;
    autoAssign: string;
    viewDetails: string;
    back: string;
  };

  pagination: {
    showing: string;
    of: string;
    matchingMembers: string;
    matchingTeachers: string;
    matchingStudents: string;
    classStudents: string;
    items: string;
    prev: string;
    next: string;
  };

  classDetails: {
    title: string;
    assignedTeachers: string;
    studentList: string;
    noTeachers: string;
    noStudents: string;
    close: string;
  };

  gradeDetail: {
    modalTitle: string;
    studentId: string;
    className: string;
    email: string;
    subject: string;
    overallGpa: string;
  };

  admin: {
    noTeachersFound: string;
    noStudentsFound: string;
    unassignedSubject: string;
    noClassesAssigned: string;
    notGraded: string;
    noGpa: string;
    editTeacherTitle: string;
    addTeacherTitle: string;
    teacherIdLabel: string;
    teacherNameLabel: string;
    teacherEmailLabel: string;
    saveConfirm: string;
    editStudentTitle: string;
    addStudentTitle: string;
    studentIdLabel: string;
    studentNameLabel: string;
    studentEmailLabel: string;
    selectClassDefault: string;
    removeFromClass: string;
    editGradesTitle: string;
    gradeNote: string;
    updateGrades: string;
    addClassTitle: string;
    classIdLabel: string;
    classIdPlaceholder: string;
    classNameLabel: string;
    classNamePlaceholder: string;
    registerClass: string;
    enrollTitle: string;
    enrollTextPrefix: string;
    enrollTextSuffix: string;
    assignedClassLabel: string;
    selectClassPrompt: string;
    confirmEnroll: string;
    tooltips: {
      removeBadge: string;
      editInfo: string;
      deleteAccount: string;
      viewGradeDetail: string;
      editGrades: string;
      editStudent: string;
      deleteStudentAndGrades: string;
      clearGrades: string;
      deleteClass: string;
      withdrawStudent: string;
    };
    alerts: {
      enterTeacherEmail: string;
      emailDuplicate: string;
      teacherExists: string;
      cannotSaveAssignment: string;
      enterStudentEmail: string;
      studentExists: string;
      fillClassInfo: string;
      classExists: string;
      teacherSubjectAssigned: string;
    };
    confirms: {
      deleteTeacher: string;
      deleteStudent: string;
      clearGrade: string;
      deleteClass: string;
      unenrollTeacher: string;
      unenrollStudent: string;
      incompleteTeacherClasses: string;
    };
  };

  permissions: {
    columnHeader: string;
    button: string;
    btnTitle: string;
    modalTitle: string;
    modalSubtitle: string;
    adminSystemDesc: string;
    subjectLabel: string;
    assignedClassesLabel: string;
    classLabel: string;
    unassignedClass: string;
    unassignedClasses: string;
    presetDefault: string;
    presetGrantAll: string;
    presetRevokeAll: string;
    activeCountText: string;
    statusRestoredDefault: string;
    statusGrantedAll: string;
    statusRevokedAll: string;
    statusSaveSuccessPrefix: string;
    statusSaveSuccessSuffix: string;
    statusSaveFailed: string;
    statusSaveLocalPrefix: string;
    statusSaveLocalSuffix: string;
    granted: string;
    denied: string;
    close: string;
    saveChanges: string;
    saving: string;
    sections: {
      classesTitle: string;
      classesSubtitle: string;
      systemTitle: string;
      systemSubtitle: string;
      assignmentTitle: string;
      assignmentSubtitle: string;
      gradesTitle: string;
      gradesSubtitle: string;
      reportsTitle: string;
      reportsSubtitle: string;
      teacherGradingTitle: string;
      teacherGradingSubtitle: string;
      teacherReportsTitle: string;
      teacherReportsSubtitle: string;
      studentAccessTitle: string;
      studentAccessSubtitle: string;
    };
    items: {
      createClassTitle: string;
      createClassDesc: string;
      editClassTitle: string;
      editClassDesc: string;
      deleteClassTitle: string;
      deleteClassDesc: string;
      manageMembersTitle: string;
      manageMembersDesc: string;
      manageRolePermissionsTitle: string;
      manageRolePermissionsDesc: string;
      assignTeachersTitle: string;
      assignTeachersDesc: string;
      autoAssignTeacherTitle: string;
      autoAssignTeacherDesc: string;
      enrollStudentsTitle: string;
      enrollStudentsDesc: string;
      unenrollStudentsTitle: string;
      unenrollStudentsDesc: string;
      editMathGradesTitle: string;
      editMathGradesDesc: string;
      editLiteratureGradesTitle: string;
      editLiteratureGradesDesc: string;
      editEnglishGradesTitle: string;
      editEnglishGradesDesc: string;
      lockGradesTitle: string;
      lockGradesDesc: string;
      viewAllSchoolGradesTitle: string;
      viewAllSchoolGradesDesc: string;
      viewClassGradesTitle: string;
      viewClassGradesDesc: string;
      exportCsvReportsTitle: string;
      exportCsvReportsDesc: string;
      // Teacher specific items
      teacherEnterGradesTitle: string;
      teacherEnterGradesDesc: string;
      teacherClearGradesTitle: string;
      teacherClearGradesDesc: string;
      teacherAutoClaimClassTitle: string;
      teacherAutoClaimClassDesc: string;
      teacherViewAssignedClassGradesTitle: string;
      teacherViewAssignedClassGradesDesc: string;
      teacherViewStudentListTitle: string;
      teacherViewStudentListDesc: string;
      teacherExportGradesCsvTitle: string;
      teacherExportGradesCsvDesc: string;
      // Student specific items
      studentViewGradesTitle: string;
      studentViewGradesDesc: string;
      studentExportTranscriptCsvTitle: string;
      studentExportTranscriptCsvDesc: string;
      studentRequestReviewTitle: string;
      studentRequestReviewDesc: string;
    };
  };

  studentInfo: {
    classInfoTitle: string;
    classInfoSubtitle: string;
    classSizeLabel: string;
    studentsUnit: string;
    subjectTeachersLabel: string;
    teacherUnassigned: string;
    teacherContact: string;
    restrictedNotice: string;
    unassignedNotice: string;
  };

  rbac: {
    title: string;
    subtitle: string;
    colFeature: string;
    colAdmin: string;
    colTeacher: string;
    colStudent: string;
    columns: {
      permission: string;
      admin: string;
      teacher: string;
      student: string;
    };
    categories: {
      all: string;
      classes: string;
      grades: string;
      reports: string;
      system: string;
    };
    catClasses: string;
    catGrades: string;
    catReports: string;
    catSystem: string;
    btnSave: string;
    saveChanges: string;
    btnReset: string;
    resetDefaults: string;
    btnGrantAll: string;
    grantAll: string;
    saving: string;
    saveSuccess: string;
    saveError: string;
    lockedBadge: string;
    lockedAdminOnlyDesc: string;
    lockedStudentDesc: string;
    lockedForRole: string;
    adminFullControl: string;
    activeCount: string;
    filterAll: string;
    searchPlaceholder: string;
    globalNotice: string;
    systemWideNotice: string;
  };
}

export const translations: Record<Language, Translations> = {
  vi: {
    systemTitle: "Hệ Thống Quản Lý Học Sinh",
    login: "Đăng nhập",
    logout: "Đăng xuất",
    welcome: "Xin chào",
    exportCsv: "Xuất CSV Điểm Cá Nhân",
    languageName: "Tiếng Việt",
    selectLanguage: "Chọn ngôn ngữ và khu vực",
    auth: {
      changePassword: "Đổi mật khẩu",
      currentPassword: "Mật khẩu hiện tại",
      newPassword: "Mật khẩu mới",
      confirmNewPassword: "Xác nhận mật khẩu mới",
      changePasswordBtn: "Xác nhận đổi mật khẩu",
      changePasswordSuccess: "Đổi mật khẩu thành công! Vui lòng đăng nhập bằng mật khẩu mới.",
      passwordMismatch: "Mật khẩu xác nhận không khớp.",
      missingFields: "Vui lòng điền đầy đủ tất cả các trường.",
      close: "Đóng",
      emailNotFound: "Email không tồn tại!",
      incorrectPassword: "Sai mật khẩu!",
      emailRequired: "Email không được để trống",
      passwordRequired: "Mật khẩu không được để trống",
      invalidEmailFormat: "Email không đúng định dạng (VD: example@school.edu.vn)",
      newPasswordRequired: "Mật khẩu mới không được để trống",
      confirmPasswordRequired: "Vui lòng xác nhận mật khẩu mới",
      newPasswordMinLength: "Mật khẩu mới phải có ít nhất 3 ký tự.",
      currentPasswordRequired: "Mật khẩu hiện tại không được để trống",
      accountNotFound: "Không tìm thấy tài khoản với email hoặc mã này.",
      oldPasswordIncorrect: "Mật khẩu hiện tại không chính xác.",
      updating: "Đang cập nhật...",
      unauthorizedMsg: "Email hoặc mật khẩu không chính xác!",
      forbiddenAccountChange: "Bạn không có quyền thay đổi mật khẩu của tài khoản khác!"
    },
    
    roles: {
      admin: "Quản trị viên",
      teacher: "Giáo viên",
      student: "Học sinh"
    },
    
    subjects: {
      math: "Toán Học",
      literature: "Ngữ Văn",
      english: "Tiếng Anh"
    },

    components: {
      oral: "Điểm miệng",
      m15: "15 phút",
      mid: "Giữa kỳ",
      final: "Cuối kỳ",
      gpa: "ĐTB (GPA)",
      subjectGpa: "ĐTB Môn"
    },

    classStatus: {
      unassigned: "Chưa xếp lớp"
    },

    evaluation: {
      excellent: "Giỏi",
      good: "Khá",
      average: "Trung bình",
      weak: "Yếu"
    },

    tabs: {
      allMembers: "Tất cả thành viên",
      teachers: "Danh sách Giáo viên",
      studentsGrades: "Học sinh & Bảng điểm",
      classes: "Danh sách Lớp học",
      permissions: "Phân quyền hệ thống",
      sourceCode: "Mã nguồn"
    },

    table: {
      id: "Mã ID",
      name: "Họ và tên",
      email: "Email",
      password: "Mật khẩu",
      role: "Vai trò",
      className: "Lớp học",
      assignedClasses: "Lớp giảng dạy",
      subject: "Môn dạy",
      gpa: "ĐTB (GPA)",
      actions: "Thao tác",
      studentCount: "Số học sinh",
      teacherCount: "Số giáo viên",
      academicPerformance: "Học lực học kỳ"
    },

    actions: {
      add: "Thêm mới",
      addMember: "Thêm thành viên",
      addTeacher: "Thêm giáo viên",
      addStudent: "Thêm học sinh",
      addClass: "Thêm lớp học",
      edit: "Sửa",
      delete: "Xóa",
      save: "Lưu",
      cancel: "Hủy",
      search: "Tìm kiếm",
      searchPlaceholder: "Nhập từ khóa tìm kiếm...",
      filter: "Lọc",
      clearFilter: "Xóa lọc",
      autoAssign: "Tự động phân công",
      viewDetails: "Xem chi tiết",
      back: "Quay lại"
    },

    pagination: {
      showing: "Hiển thị",
      of: "trên tổng số",
      matchingMembers: "thành viên phù hợp",
      matchingTeachers: "giáo viên phù hợp",
      matchingStudents: "học sinh phù hợp",
      classStudents: "học sinh của lớp",
      items: "mục",
      prev: "« Trước",
      next: "Sau »"
    },

    classDetails: {
      title: "Chi Tiết Lớp",
      assignedTeachers: "Giáo viên giảng dạy",
      studentList: "Danh sách học sinh",
      noTeachers: "Chưa có giáo viên nào phụ trách giảng dạy lớp này.",
      noStudents: "Chưa có học sinh nào được xếp vào lớp này.",
      close: "Đóng"
    },

    gradeDetail: {
      modalTitle: "Hồ Sơ Điểm Chi Tiết",
      studentId: "Mã học sinh",
      className: "Lớp học",
      email: "Email",
      subject: "Môn Học",
      overallGpa: "Điểm Trung Bình Toàn Diện (GPA)"
    },

    admin: {
      noTeachersFound: "Không tìm thấy giáo viên nào trùng khớp từ khóa tìm kiếm.",
      noStudentsFound: "Không tìm thấy học sinh hoặc điểm số nào phù hợp từ khóa tìm kiếm.",
      unassignedSubject: "Chưa phân môn",
      noClassesAssigned: "Chưa dạy lớp nào",
      notGraded: "Chưa nhập",
      noGpa: "Chưa có",
      editTeacherTitle: "Cập Nhật Tài Khoản Giáo Viên",
      addTeacherTitle: "Đăng Ký Giáo Viên Mới",
      teacherIdLabel: "Mã Giáo Viên (ID)",
      teacherNameLabel: "Họ và Tên Giáo Viên",
      teacherEmailLabel: "Email Đăng Nhập (Cố định đuôi @edu.com)",
      saveConfirm: "Xác Nhận Lưu",
      editStudentTitle: "Cập Nhật Tài Khoản Học Sinh",
      addStudentTitle: "Đăng Ký Học Sinh Mới",
      studentIdLabel: "Mã Học Sinh (ID)",
      studentNameLabel: "Họ và Tên Học Sinh",
      studentEmailLabel: "Gmail Đăng Nhập (Cố định đuôi @gmail.com)",
      selectClassDefault: "-- Chưa xếp lớp / Không thuộc lớp nào --",
      removeFromClass: "Gỡ khỏi lớp",
      editGradesTitle: "Nhập & Sửa Điểm",
      gradeNote: "Hệ số điểm từ 0.0 đến 10.0. Nhập điểm thành phần cho từng môn học, hệ thống sẽ tự động tính toán điểm trung bình. Để trống nếu chưa có điểm.",
      updateGrades: "Cập Nhật Điểm",
      addClassTitle: "Đăng Ký Thêm Lớp Mới",
      classIdLabel: "Mã Lớp Học (Ví dụ: 12A3, 10C5)",
      classIdPlaceholder: "Mã viết liền không dấu",
      classNameLabel: "Tên Lớp Học Chi Tiết",
      classNamePlaceholder: "Ví dụ: Lớp chuyên tự nhiên 12A3",
      registerClass: "Đăng Ký Lớp",
      enrollTitle: "Ghi Danh Vào Lớp Học",
      enrollTextPrefix: "Ghi danh cho",
      enrollTextSuffix: "vào lớp học sau:",
      assignedClassLabel: "Lớp học chỉ định",
      selectClassPrompt: "-- Chọn Lớp Học --",
      confirmEnroll: "Xác Nhận Ghi Danh",
      tooltips: {
        removeBadge: "Hủy lớp này",
        editInfo: "Sửa thông tin",
        deleteAccount: "Xóa tài khoản",
        viewGradeDetail: "Xem Chi Tiết Hồ Sơ Điểm",
        editGrades: "Nhập / Sửa Điểm",
        editStudent: "Sửa học sinh",
        deleteStudentAndGrades: "Xóa học sinh & điểm",
        clearGrades: "Xóa trắng điểm",
        deleteClass: "Xóa lớp học",
        withdrawStudent: "Rút học sinh khỏi lớp (bảo lưu thông tin & điểm số)"
      },
      alerts: {
        enterTeacherEmail: "Vui lòng nhập tên tài khoản Email giáo viên!",
        emailDuplicate: "Email/Gmail này đã được sử dụng bởi một thành viên khác!",
        teacherExists: "Mã giáo viên này đã tồn tại!",
        cannotSaveAssignment: "Không thể lưu phân công:",
        enterStudentEmail: "Vui lòng nhập tên tài khoản Gmail học sinh!",
        studentExists: "Mã học sinh này đã tồn tại!",
        fillClassInfo: "Vui lòng nhập đầy đủ mã lớp và tên lớp.",
        classExists: "Mã lớp này đã tồn tại trong hệ thống.",
        teacherSubjectAssigned: "Không thể đăng ký: Lớp đã có giáo viên dạy môn học này!"
      },
      confirms: {
        deleteTeacher: "Bạn có chắc chắn muốn xóa giáo viên này không?",
        deleteStudent: "Bạn có chắc chắn muốn xóa học sinh này và mọi dữ liệu điểm số liên quan không?",
        clearGrade: "Bạn muốn xóa điểm số tất cả môn học của học sinh này về trạng thái \"Chưa có\"?",
        deleteClass: "Bạn có chắc chắn muốn xóa lớp học này không?\nTất cả học sinh và giáo viên thuộc lớp này sẽ được gỡ khỏi lớp.",
        unenrollTeacher: "Bạn muốn hủy phụ trách lớp học này cho giáo viên?",
        unenrollStudent: "Bạn có chắc chắn muốn xóa học sinh khỏi lớp học này?",
        incompleteTeacherClasses: "Lưu ý: Sau khi phân công, một số lớp sẽ tạm thời chưa đủ 3 giáo viên bộ môn.\nBạn có chắc chắn muốn tiếp tục lưu không?"
      }
    },

    permissions: {
      columnHeader: "Phân quyền",
      button: "Phân quyền",
      btnTitle: "Cấu hình phân quyền cho",
      modalTitle: "Cấu Hình & Tích Chọn Phân Quyền (RBAC)",
      modalSubtitle: "Tùy chỉnh bật/tắt từng thẩm quyền cho tài khoản thành viên trong hệ thống",
      adminSystemDesc: "Quản trị viên toàn hệ thống",
      subjectLabel: "Bộ môn:",
      assignedClassesLabel: "Lớp dạy:",
      classLabel: "Lớp học:",
      unassignedClass: "Chưa xếp lớp",
      unassignedClasses: "Chưa nhận lớp",
      presetDefault: "Mặc định theo vai trò",
      presetGrantAll: "Cấp tất cả quyền",
      presetRevokeAll: "Thu hồi tất cả",
      activeCountText: "Đang bật:",
      statusRestoredDefault: "🔄 Đã khôi phục cài đặt phân quyền theo vai trò mặc định.",
      statusGrantedAll: "⚡ Đã cấp toàn bộ quyền truy cập và thao tác.",
      statusRevokedAll: "🚫 Đã vô hiệu hóa / thu hồi toàn bộ quyền.",
      statusSaveSuccessPrefix: "✅ Đã lưu cài đặt phân quyền tùy chỉnh thành công cho",
      statusSaveSuccessSuffix: "!",
      statusSaveFailed: "❌ Lưu phân quyền thất bại. Vui lòng thử lại.",
      statusSaveLocalPrefix: "✅ Đã cập nhật phân quyền cục bộ cho",
      statusSaveLocalSuffix: "!",
      granted: "Được cấp",
      denied: "Bị chặn",
      close: "Đóng",
      saveChanges: "Lưu thay đổi phân quyền",
      saving: "Đang lưu...",
      sections: {
        classesTitle: "Quản lý Lớp học & Cơ cấu",
        classesSubtitle: "Tạo lớp, cập nhật lớp, phân công giáo viên và ghi danh học sinh",
        systemTitle: "Quản trị Tài khoản & Hệ thống",
        systemSubtitle: "Quản lý thành viên, tài khoản và phân quyền hệ thống",
        assignmentTitle: "Phân công Giảng dạy & Xếp lớp",
        assignmentSubtitle: "Nhấp dòng hoặc gạt nút để thay đổi",
        gradesTitle: "Quản lý Điểm số & Học tập",
        gradesSubtitle: "Nhập, sửa điểm thành phần môn học và khóa sổ điểm",
        reportsTitle: "Tra cứu, Báo cáo & Thống kê",
        reportsSubtitle: "Xem bảng điểm các lớp, toàn trường và xuất file CSV",
        teacherGradingTitle: "Nghiệp vụ Giảng dạy & Nhập Điểm Bộ môn",
        teacherGradingSubtitle: "Quyền hạn thao tác trên các lớp giáo viên được phân công",
        teacherReportsTitle: "Tra cứu Học sinh & Xuất Báo cáo Lớp",
        teacherReportsSubtitle: "Quyền xem thông tin và trích xuất dữ liệu lớp học",
        studentAccessTitle: "Quyền hạn Tra cứu & Báo cáo Điểm Cá nhân",
        studentAccessSubtitle: "Quyền hạn truy cập và xem dữ liệu học tập cá nhân"
      },
      items: {
        createClassTitle: "Tạo Lớp học mới",
        createClassDesc: "Cho phép tạo và khởi tạo mã lớp, tên lớp học mới trong danh mục.",
        editClassTitle: "Chỉnh sửa thông tin Lớp học",
        editClassDesc: "Cho phép cập nhật tên lớp, phân lớp và cơ cấu học sinh.",
        deleteClassTitle: "Xóa Lớp học",
        deleteClassDesc: "Cho phép xóa lớp học khỏi cơ sở dữ liệu hệ thống.",
        manageMembersTitle: "Quản lý Tài khoản & Thành viên",
        manageMembersDesc: "Tạo tài khoản giáo viên/học sinh, đặt lại mật khẩu và xóa thành viên.",
        manageRolePermissionsTitle: "Cấu hình Phân quyền Hệ thống",
        manageRolePermissionsDesc: "Cấu hình ma trận phân quyền theo vai trò cho toàn trường.",
        assignTeachersTitle: "Chỉ định Phân công Giáo viên",
        assignTeachersDesc: "Phân bổ giáo viên bất kỳ vào phụ trách các lớp học theo từng môn chuyên môn.",
        autoAssignTeacherTitle: "Tự nhận lớp còn thiếu môn",
        autoAssignTeacherDesc: "Cho phép giáo viên tự đăng ký phụ trách những lớp học đang khuyết giáo viên bộ môn.",
        enrollStudentsTitle: "Ghi danh Học sinh vào Lớp",
        enrollStudentsDesc: "Xếp học sinh chưa có lớp vào danh sách học chính thức của một lớp học.",
        unenrollStudentsTitle: "Rút Học sinh khỏi Lớp",
        unenrollStudentsDesc: "Đưa học sinh ra khỏi lớp hiện tại về trạng thái chưa xếp lớp.",
        editMathGradesTitle: "Nhập & Sửa Điểm Môn Toán",
        editMathGradesDesc: "Cho phép nhập và sửa các cột điểm: Miệng, 15 phút, Giữa kỳ, Cuối kỳ môn Toán.",
        editLiteratureGradesTitle: "Nhập & Sửa Điểm Môn Ngữ Văn",
        editLiteratureGradesDesc: "Cho phép nhập và sửa các cột điểm: Miệng, 15 phút, Giữa kỳ, Cuối kỳ môn Ngữ Văn.",
        editEnglishGradesTitle: "Nhập & Sửa Điểm Môn Tiếng Anh",
        editEnglishGradesDesc: "Cho phép nhập và sửa các cột điểm: Miệng, 15 phút, Giữa kỳ, Cuối kỳ môn Tiếng Anh.",
        lockGradesTitle: "Khóa & Phê duyệt Bảng điểm",
        lockGradesDesc: "Quyền chốt sổ điểm học kỳ chính thức, khóa bảo vệ không cho phép sửa đổi điểm.",
        viewAllSchoolGradesTitle: "Xem Bảng Điểm Toàn Trường",
        viewAllSchoolGradesDesc: "Tra cứu bảng điểm tổng hợp tất cả học sinh thuộc toàn bộ các lớp trong trường.",
        viewClassGradesTitle: "Xem Bảng Điểm Lớp Học",
        viewClassGradesDesc: "Tra cứu bảng điểm chi tiết của lớp phụ trách hoặc lớp đang theo học.",
        exportCsvReportsTitle: "Xuất Báo cáo CSV",
        exportCsvReportsDesc: "Tải xuống dữ liệu bảng điểm và danh sách thành viên ra tệp CSV.",
        // Teacher specific items
        teacherEnterGradesTitle: "Nhập & sửa điểm môn phụ trách",
        teacherEnterGradesDesc: "Cho phép giáo viên nhập và sửa điểm miệng, 15p, giữa kỳ, cuối kỳ cho học sinh lớp phụ trách.",
        teacherClearGradesTitle: "Xóa điểm đã nhập (Clear Grade)",
        teacherClearGradesDesc: "Cho phép xóa điểm bộ môn đã chấm về trạng thái chưa có điểm.",
        teacherAutoClaimClassTitle: "Tự đăng ký nhận lớp trống môn",
        teacherAutoClaimClassDesc: "Cho phép giáo viên tự đăng ký vào danh sách giảng dạy các lớp học chưa có giáo viên bộ môn.",
        teacherViewAssignedClassGradesTitle: "Xem bảng điểm các lớp phụ trách",
        teacherViewAssignedClassGradesDesc: "Xem bảng điểm và đánh giá học tập của học sinh trong các lớp được phân công giảng dạy.",
        teacherViewStudentListTitle: "Xem danh mục học sinh các lớp",
        teacherViewStudentListDesc: "Truy cập tab Tất cả thành viên để tra cứu thông tin học sinh trong các lớp mình dạy.",
        teacherExportGradesCsvTitle: "Xuất bảng điểm lớp ra file CSV",
        teacherExportGradesCsvDesc: "Tải xuống bảng điểm học sinh của các lớp giảng dạy dưới dạng tệp CSV.",
        // Student specific items
        studentViewGradesTitle: "Xem bảng điểm chi tiết & ĐTB (GPA)",
        studentViewGradesDesc: "Cho phép học sinh xem điểm thành phần môn học, điểm trung bình và xếp loại học lực cá nhân.",
        studentExportTranscriptCsvTitle: "Xuất bảng điểm cá nhân ra CSV",
        studentExportTranscriptCsvDesc: "Cho phép tải xuống bảng điểm cá nhân của học sinh ra tệp định dạng CSV.",
        studentRequestReviewTitle: "Gửi yêu cầu thắc mắc & phúc khảo",
        studentRequestReviewDesc: "Cho phép học sinh gửi ý kiến phản hồi hoặc đề nghị xem xét lại điểm số môn học."
      }
    },
    studentInfo: {
      classInfoTitle: "Thông tin Lớp học & Giáo viên Phụ trách",
      classInfoSubtitle: "Tra cứu thông tin phân công giảng dạy và tổng quan lớp",
      classSizeLabel: "Sĩ số lớp",
      studentsUnit: "học sinh",
      subjectTeachersLabel: "Giáo viên bộ môn",
      teacherUnassigned: "Chưa phân công",
      teacherContact: "Liên hệ",
      restrictedNotice: "Quyền xem thông tin lớp học và giáo viên hiện đang bị hạn chế.",
      unassignedNotice: "Bạn hiện chưa được xếp vào lớp học chính thức nào."
    },

    rbac: {
      title: "Ma Trận Phân Quyền Theo Vai Trò",
      subtitle: "Cấu hình quyền hạn tập trung cho các vai trò trong hệ thống (Quản trị viên, Giáo viên, Học sinh). Mọi thiết lập sẽ tự động áp dụng đồng bộ cho tất cả người dùng thuộc vai trò tương ứng.",
      colFeature: "Chức Năng & Quyền Hạn",
      colAdmin: "Quản Trị Viên",
      colTeacher: "Giáo Viên",
      colStudent: "Học Sinh",
      columns: {
        permission: "Chức Năng / Quyền Hạn",
        admin: "Quản Trị Viên",
        teacher: "Giáo Viên",
        student: "Học Sinh"
      },
      categories: {
        all: "Tất cả danh mục",
        classes: "Cơ Cấu Lớp Học",
        grades: "Quản Lý Điểm Số",
        reports: "Báo Cáo & Thống Kê",
        system: "Quản Trị Hệ Thống"
      },
      catClasses: "Cơ Cấu & Quản Lý Lớp Học",
      catGrades: "Quản Lý Điểm Số & Học Tập",
      catReports: "Tra Cứu, Thống Kê & Báo Cáo",
      catSystem: "Tài Khoản & Quản Trị Hệ Thống",
      btnSave: "Lưu Thay Đổi",
      saveChanges: "Lưu Thay Đổi",
      btnReset: "Khôi Phục Mặc Định",
      resetDefaults: "Khôi Phục Mặc Định",
      btnGrantAll: "Cấp Toàn Bộ Quyền Khả Dụng",
      grantAll: "Cấp Toàn Bộ Quyền Khả Dụng",
      saving: "Đang lưu và áp dụng phân quyền...",
      saveSuccess: "Đã lưu ma trận phân quyền thành công! Tất cả người dùng trong hệ thống đã được đồng bộ quyền mới.",
      saveError: "Có lỗi xảy ra khi lưu ma trận phân quyền. Vui lòng thử lại.",
      lockedBadge: "Quyền cố định",
      lockedAdminOnlyDesc: "Quyền quản trị cấp cao, chỉ dành riêng cho Quản trị viên.",
      lockedStudentDesc: "Quyền bị giới hạn đối với vai trò Học sinh để đảm bảo an toàn dữ liệu.",
      lockedForRole: "🔒 Quyền hệ thống nhạy cảm - Bị khóa đối với vai trò này để đảm bảo an toàn & tính toàn vẹn dữ liệu.",
      adminFullControl: "👑 Quản trị viên nắm quyền kiểm soát toàn diện hệ thống.",
      activeCount: "Đã kích hoạt",
      filterAll: "Tất cả danh mục",
      searchPlaceholder: "Tìm kiếm quyền hạn hoặc chức năng...",
      globalNotice: "Mọi thay đổi trong bảng phân quyền này sẽ tự động áp dụng đồng bộ ngay lập tức cho tất cả tài khoản thuộc vai trò tương ứng trong toàn trường.",
      systemWideNotice: "Lưu ý: Mọi thay đổi trong ma trận phân quyền sẽ có hiệu lực tức thời và đồng bộ cho tất cả tài khoản thuộc vai trò được chỉnh sửa."
    }
  },

  en: {
    systemTitle: "Student Management System",
    login: "Sign In",
    logout: "Log Out",
    welcome: "Welcome",
    exportCsv: "Export CSV Grades",
    languageName: "English",
    selectLanguage: "Choose a language and region",
    auth: {
      changePassword: "Change Password",
      currentPassword: "Current Password",
      newPassword: "New Password",
      confirmNewPassword: "Confirm New Password",
      changePasswordBtn: "Update Password",
      changePasswordSuccess: "Password changed successfully! Please sign in with your new password.",
      passwordMismatch: "New passwords do not match.",
      missingFields: "Please fill in all fields.",
      close: "Close",
      emailNotFound: "Email does not exist!",
      incorrectPassword: "Incorrect password!",
      emailRequired: "Email is required",
      passwordRequired: "Password is required",
      invalidEmailFormat: "Invalid email format (e.g. example@school.edu.vn)",
      newPasswordRequired: "New password is required",
      confirmPasswordRequired: "Please confirm your new password",
      newPasswordMinLength: "New password must be at least 3 characters.",
      currentPasswordRequired: "Current password is required",
      accountNotFound: "No account found with this email or ID.",
      oldPasswordIncorrect: "Current password is incorrect.",
      updating: "Updating...",
      unauthorizedMsg: "Incorrect email or password!",
      forbiddenAccountChange: "You do not have permission to change password of another account!"
    },
    
    roles: {
      admin: "Administrator",
      teacher: "Teacher",
      student: "Student"
    },
    
    subjects: {
      math: "Mathematics",
      literature: "Literature",
      english: "English"
    },

    components: {
      oral: "Oral Test",
      m15: "15-min Test",
      mid: "Midterm Exam",
      final: "Final Exam",
      gpa: "GPA",
      subjectGpa: "Subject GPA"
    },

    classStatus: {
      unassigned: "Unassigned"
    },

    evaluation: {
      excellent: "Excellent",
      good: "Good",
      average: "Average",
      weak: "Needs Improvement"
    },

    tabs: {
      allMembers: "All Members",
      teachers: "Teachers List",
      studentsGrades: "Students & Grades",
      classes: "Classes List",
      permissions: "Role Permissions",
      sourceCode: "Source Code"
    },

    table: {
      id: "ID Code",
      name: "Full Name",
      email: "Email Address",
      password: "Password",
      role: "Role",
      className: "Class Name",
      assignedClasses: "Assigned Classes",
      subject: "Teaching Subject",
      gpa: "GPA Score",
      actions: "Actions",
      studentCount: "Total Students",
      teacherCount: "Total Teachers",
      academicPerformance: "Academic Standing"
    },

    actions: {
      add: "Add New",
      addMember: "Add Member",
      addTeacher: "Add Teacher",
      addStudent: "Add Student",
      addClass: "Add Class",
      edit: "Edit",
      delete: "Delete",
      save: "Save",
      cancel: "Cancel",
      search: "Search",
      searchPlaceholder: "Enter search keyword...",
      filter: "Filter",
      clearFilter: "Clear Filter",
      autoAssign: "Auto Assign",
      viewDetails: "View Details",
      back: "Back"
    },

    pagination: {
      showing: "Showing",
      of: "of",
      matchingMembers: "matching members",
      matchingTeachers: "matching teachers",
      matchingStudents: "matching students",
      classStudents: "class students",
      items: "items",
      prev: "« Prev",
      next: "Next »"
    },

    classDetails: {
      title: "Class Details",
      assignedTeachers: "Assigned Teachers",
      studentList: "Student List",
      noTeachers: "No teachers assigned to this class yet.",
      noStudents: "No students enrolled in this class yet.",
      close: "Close"
    },

    gradeDetail: {
      modalTitle: "Detailed Grade Profile",
      studentId: "Student ID",
      className: "Class",
      email: "Email",
      subject: "Subject",
      overallGpa: "Overall Average Grade (GPA)"
    },

    admin: {
      noTeachersFound: "No matching teachers found.",
      noStudentsFound: "No matching students or grades found.",
      unassignedSubject: "Unassigned Subject",
      noClassesAssigned: "No classes assigned",
      notGraded: "Not Graded",
      noGpa: "N/A",
      editTeacherTitle: "Update Teacher Account",
      addTeacherTitle: "Register New Teacher",
      teacherIdLabel: "Teacher ID",
      teacherNameLabel: "Full Name",
      teacherEmailLabel: "Login Email (Fixed @edu.com domain)",
      saveConfirm: "Save Changes",
      editStudentTitle: "Update Student Account",
      addStudentTitle: "Register New Student",
      studentIdLabel: "Student ID",
      studentNameLabel: "Full Name",
      studentEmailLabel: "Login Email (Fixed @gmail.com domain)",
      selectClassDefault: "-- Unassigned / Not in any class --",
      removeFromClass: "Remove from class",
      editGradesTitle: "Enter & Edit Grades",
      gradeNote: "Grades scale from 0.0 to 10.0. Enter component scores for each subject, and GPA will be calculated automatically. Leave empty if unassigned.",
      updateGrades: "Update Grades",
      addClassTitle: "Register New Class",
      classIdLabel: "Class ID (e.g., 12A3, 10C5)",
      classIdPlaceholder: "Unspaced alphanumeric ID",
      classNameLabel: "Detailed Class Name",
      classNamePlaceholder: "e.g., Natural Science 12A3",
      registerClass: "Register Class",
      enrollTitle: "Enroll into Class",
      enrollTextPrefix: "Enroll",
      enrollTextSuffix: "into the following class:",
      assignedClassLabel: "Designated Class",
      selectClassPrompt: "-- Select Class --",
      confirmEnroll: "Confirm Enrollment",
      tooltips: {
        removeBadge: "Remove class assignment",
        editInfo: "Edit info",
        deleteAccount: "Delete account",
        viewGradeDetail: "View detailed grade profile",
        editGrades: "Enter / Edit grades",
        editStudent: "Edit student",
        deleteStudentAndGrades: "Delete student & grades",
        clearGrades: "Clear all grades",
        deleteClass: "Delete class",
        withdrawStudent: "Withdraw student from class (retains record & grades)"
      },
      alerts: {
        enterTeacherEmail: "Please enter the teacher's email account name!",
        emailDuplicate: "This Email/Gmail is already in use by another member!",
        teacherExists: "This teacher ID already exists!",
        cannotSaveAssignment: "Cannot save assignments:",
        enterStudentEmail: "Please enter the student's Gmail account name!",
        studentExists: "This student ID already exists!",
        fillClassInfo: "Please enter both the class ID and class name.",
        classExists: "This class ID already exists in the system.",
        teacherSubjectAssigned: "Cannot assign: The class already has a teacher for this subject!"
      },
      confirms: {
        deleteTeacher: "Are you sure you want to delete this teacher?",
        deleteStudent: "Are you sure you want to delete this student and all related grade data?",
        clearGrade: "Do you want to clear all subject grades for this student back to \"Unassigned\"?",
        deleteClass: "Are you sure you want to delete this class?\nAll students and teachers in this class will be removed from it.",
        unenrollTeacher: "Do you want to cancel this class assignment for this teacher?",
        unenrollStudent: "Are you sure you want to remove this student from the class?",
        incompleteTeacherClasses: "Notice: After assignment, some classes will temporarily not have all 3 subject teachers.\nAre you sure you want to continue saving?"
      }
    },

    permissions: {
      columnHeader: "Permissions",
      button: "Permissions",
      btnTitle: "Configure permissions for",
      modalTitle: "Role-Based Access Control & Permissions (RBAC)",
      modalSubtitle: "Customize individual permissions and authorizations for member accounts",
      adminSystemDesc: "Full System Administrator",
      subjectLabel: "Subject:",
      assignedClassesLabel: "Teaching Classes:",
      classLabel: "Class:",
      unassignedClass: "Unassigned",
      unassignedClasses: "No classes assigned",
      presetDefault: "Role Defaults",
      presetGrantAll: "Grant All",
      presetRevokeAll: "Revoke All",
      activeCountText: "Active:",
      statusRestoredDefault: "🔄 Restored default permissions based on role.",
      statusGrantedAll: "⚡ Granted all access and operational permissions.",
      statusRevokedAll: "🚫 Disabled and revoked all permissions.",
      statusSaveSuccessPrefix: "✅ Successfully saved custom permissions for",
      statusSaveSuccessSuffix: "!",
      statusSaveFailed: "❌ Failed to save permissions. Please try again.",
      statusSaveLocalPrefix: "✅ Updated local permissions for",
      statusSaveLocalSuffix: "!",
      granted: "Granted",
      denied: "Denied",
      close: "Close",
      saveChanges: "Save Permission Changes",
      saving: "Saving...",
      sections: {
        classesTitle: "Class & Structure Management",
        classesSubtitle: "Create, edit classes, assign teachers, and enroll students",
        systemTitle: "Account & System Administration",
        systemSubtitle: "Manage member accounts and system role permissions",
        assignmentTitle: "Teaching Assignment & Enrollment",
        assignmentSubtitle: "Click row or toggle switch to change",
        gradesTitle: "Grade Management & Academic Records",
        gradesSubtitle: "Enter, edit subject scores and lock grade books",
        reportsTitle: "Reports, Inquiry & Statistics",
        reportsSubtitle: "View school/class grade sheets and export CSV reports",
        teacherGradingTitle: "Teaching & Grade Management",
        teacherGradingSubtitle: "Authorizations for classes assigned to the teacher",
        teacherReportsTitle: "Student Lookup & Class Reports",
        teacherReportsSubtitle: "Permissions to view class rosters and export data",
        studentAccessTitle: "Student Grade Lookup & Self-Service Reports",
        studentAccessSubtitle: "Access authorizations for student's personal records"
      },
      items: {
        createClassTitle: "Create New Class",
        createClassDesc: "Allow creating and registering new class IDs and names in the directory.",
        editClassTitle: "Edit Class Information",
        editClassDesc: "Allow updating class name, reassignments, and student structures.",
        deleteClassTitle: "Delete Class",
        deleteClassDesc: "Allow deleting classes from the system database.",
        manageMembersTitle: "Manage Accounts & Members",
        manageMembersDesc: "Create teacher/student accounts, reset passwords, and delete members.",
        manageRolePermissionsTitle: "System Role Permissions",
        manageRolePermissionsDesc: "Configure school-wide role-based permission matrix.",
        assignTeachersTitle: "Assign Teachers to Classes",
        assignTeachersDesc: "Assign any teacher to classes based on their subject specialty.",
        autoAssignTeacherTitle: "Auto-Claim Open Classes",
        autoAssignTeacherDesc: "Allow teachers to automatically claim classes lacking a subject teacher.",
        enrollStudentsTitle: "Enroll Students into Class",
        enrollStudentsDesc: "Assign unassigned students to official class rosters.",
        unenrollStudentsTitle: "Withdraw Students from Class",
        unenrollStudentsDesc: "Remove students from their current class back to unassigned status.",
        editMathGradesTitle: "Enter & Edit Math Grades",
        editMathGradesDesc: "Allow editing oral, 15-min, midterm, and final scores for Mathematics.",
        editLiteratureGradesTitle: "Enter & Edit Literature Grades",
        editLiteratureGradesDesc: "Allow editing oral, 15-min, midterm, and final scores for Literature.",
        editEnglishGradesTitle: "Enter & Edit English Grades",
        editEnglishGradesDesc: "Allow editing oral, 15-min, midterm, and final scores for English.",
        lockGradesTitle: "Lock & Approve Grade Book",
        lockGradesDesc: "Finalize official semester grades and lock from further edits.",
        viewAllSchoolGradesTitle: "View School-Wide Grades",
        viewAllSchoolGradesDesc: "Query comprehensive grade sheets for all students across all classes.",
        viewClassGradesTitle: "View Class Grades",
        viewClassGradesDesc: "Query detailed grades for assigned or enrolled classes.",
        exportCsvReportsTitle: "Export CSV Reports",
        exportCsvReportsDesc: "Download grade sheets and member lists into CSV files.",
        // Teacher specific items
        teacherEnterGradesTitle: "Enter & Edit Assigned Subject Grades",
        teacherEnterGradesDesc: "Allow teacher to enter and edit oral, 15-min, midterm, and final scores for taught classes.",
        teacherClearGradesTitle: "Clear / Reset Entered Grades",
        teacherClearGradesDesc: "Allow resetting entered subject grades back to un-graded status.",
        teacherAutoClaimClassTitle: "Auto-Claim Open Subject Classes",
        teacherAutoClaimClassDesc: "Allow teacher to sign up and auto-assign themselves to classes lacking a subject teacher.",
        teacherViewAssignedClassGradesTitle: "View Assigned Class Grade Sheets",
        teacherViewAssignedClassGradesDesc: "View student roster and full academic records for assigned teaching classes.",
        teacherViewStudentListTitle: "View Class Student Roster",
        teacherViewStudentListDesc: "Access the All Members tab to view students in teaching classes.",
        teacherExportGradesCsvTitle: "Export Class Grades to CSV",
        teacherExportGradesCsvDesc: "Download class grade rosters as CSV files.",
        // Student specific items
        studentViewGradesTitle: "View Personal Grades & GPA",
        studentViewGradesDesc: "Allow student to view detailed grades, semester GPA, and academic standing.",
        studentExportTranscriptCsvTitle: "Export Personal Transcript to CSV",
        studentExportTranscriptCsvDesc: "Allow student to download personal grade records as a CSV file.",
        studentRequestReviewTitle: "Submit Grade Inquiries & Reviews",
        studentRequestReviewDesc: "Allow student to send feedback and grade re-evaluation requests."
      }
    },
    studentInfo: {
      classInfoTitle: "Classroom & Subject Teachers",
      classInfoSubtitle: "Assigned subject teachers and classroom overview",
      classSizeLabel: "Class Size",
      studentsUnit: "students",
      subjectTeachersLabel: "Subject Teachers",
      teacherUnassigned: "Not assigned",
      teacherContact: "Contact",
      restrictedNotice: "Access to classroom and teacher information is currently restricted.",
      unassignedNotice: "You are not yet enrolled in any official classroom."
    },

    rbac: {
      title: "Role-Based Permission Matrix",
      subtitle: "Centrally configure permissions for each system role (Administrator, Teacher, Student). Changes apply globally to all users in each role.",
      colFeature: "Feature & Capability",
      colAdmin: "Administrator",
      colTeacher: "Teacher",
      colStudent: "Student",
      columns: {
        permission: "Feature / Capability",
        admin: "Administrator",
        teacher: "Teacher",
        student: "Student"
      },
      categories: {
        all: "All Categories",
        classes: "Class Management",
        grades: "Grade Management",
        reports: "Reports & Analytics",
        system: "System Administration"
      },
      catClasses: "Class & Enrollment Management",
      catGrades: "Grades & Academic Management",
      catReports: "Inquiry, Statistics & Reports",
      catSystem: "Accounts & System Administration",
      btnSave: "Save Changes",
      saveChanges: "Save Changes",
      btnReset: "Reset to Default",
      resetDefaults: "Reset to Default",
      btnGrantAll: "Grant All Available",
      grantAll: "Grant All Available",
      saving: "Saving and applying permissions...",
      saveSuccess: "Permission matrix saved successfully! All role users have been synchronized.",
      saveError: "Failed to save permission matrix. Please try again.",
      lockedBadge: "Fixed Permission",
      lockedAdminOnlyDesc: "High-level administrative privilege, restricted to Administrators.",
      lockedStudentDesc: "Permission restricted for Students to ensure data integrity.",
      lockedForRole: "🔒 Sensitive system permission - Locked for this role to maintain security and data integrity.",
      adminFullControl: "👑 Administrators hold full authority over system capabilities.",
      activeCount: "Active",
      filterAll: "All Categories",
      searchPlaceholder: "Search permissions or capabilities...",
      globalNotice: "Changes to this permission matrix will take immediate effect for all active and future user accounts of the modified role.",
      systemWideNotice: "Note: Any changes in the permission matrix will take immediate effect for all active and future user accounts of the modified role."
    }
  },

  zh: {
    systemTitle: "学生管理系统",
    login: "登录",
    logout: "退出登录",
    welcome: "欢迎",
    exportCsv: "导出成绩 CSV",
    languageName: "简体中文",
    selectLanguage: "选择语言和区域",
    auth: {
      changePassword: "修改密码",
      currentPassword: "当前密码",
      newPassword: "新密码",
      confirmNewPassword: "确认新密码",
      changePasswordBtn: "确认修改密码",
      changePasswordSuccess: "密码修改成功！请使用新密码登录。",
      passwordMismatch: "两次输入的新密码不一致。",
      missingFields: "请填写所有必填字段。",
      close: "关闭",
      emailNotFound: "邮箱不存在！",
      incorrectPassword: "密码错误！",
      emailRequired: "邮箱不能为空",
      passwordRequired: "密码不能为空",
      invalidEmailFormat: "邮箱格式不正确 (例: example@school.edu.vn)",
      newPasswordRequired: "新密码不能为空",
      confirmPasswordRequired: "请确认新密码",
      newPasswordMinLength: "新密码至少需要3个字符。",
      currentPasswordRequired: "当前密码不能为空",
      accountNotFound: "未找到该邮箱或学工号的账户。",
      oldPasswordIncorrect: "当前密码不正确。",
      updating: "更新中...",
      unauthorizedMsg: "邮箱或密码不正确！",
      forbiddenAccountChange: "您无权更改其他账户的密码！"
    },
    
    roles: {
      admin: "管理员",
      teacher: "教师",
      student: "学生"
    },
    
    subjects: {
      math: "数学",
      literature: "语文",
      english: "英语"
    },

    components: {
      oral: "口头测试",
      m15: "15分钟测验",
      mid: "期中考试",
      final: "期末考试",
      gpa: "平均分 (GPA)",
      subjectGpa: "科目 GPA"
    },

    classStatus: {
      unassigned: "未分班"
    },

    evaluation: {
      excellent: "优秀",
      good: "良好",
      average: "及格",
      weak: "不及格"
    },

    tabs: {
      allMembers: "所有成员",
      teachers: "教师列表",
      studentsGrades: "学生与成绩",
      classes: "班级列表",
      permissions: "系统权限管理",
      sourceCode: "源代码"
    },

    table: {
      id: "编号 ID",
      name: "姓名",
      email: "电子邮件",
      password: "密码",
      role: "角色",
      className: "班级",
      assignedClasses: "任教班级",
      subject: "任教学科",
      gpa: "GPA 成绩",
      actions: "操作",
      studentCount: "学生人数",
      teacherCount: "教师人数",
      academicPerformance: "学业表现"
    },

    actions: {
      add: "新增",
      addMember: "添加成员",
      addTeacher: "添加教师",
      addStudent: "添加学生",
      addClass: "添加班级",
      edit: "编辑",
      delete: "删除",
      save: "保存",
      cancel: "取消",
      search: "搜索",
      searchPlaceholder: "请输入搜索关键词...",
      filter: "筛选",
      clearFilter: "清除筛选",
      autoAssign: "自动分配",
      viewDetails: "查看详情",
      back: "返回"
    },

    pagination: {
      showing: "显示",
      of: " / 共",
      matchingMembers: "名符合条件的成员",
      matchingTeachers: "名符合条件的教师",
      matchingStudents: "名符合条件的学生",
      classStudents: "名班级学生",
      items: "条记录",
      prev: "« 上一页",
      next: "下一页 »"
    },

    classDetails: {
      title: "班级详情",
      assignedTeachers: "任课教师",
      studentList: "学生列表",
      noTeachers: "该班级暂无任课教师。",
      noStudents: "该班级暂无学生。",
      close: "关闭"
    },

    gradeDetail: {
      modalTitle: "成绩详细档案",
      studentId: "学号",
      className: "班级",
      email: "电子邮箱",
      subject: "科目",
      overallGpa: "综合平均分 (GPA)"
    },

    admin: {
      noTeachersFound: "未找到匹配的教师。",
      noStudentsFound: "未找到匹配的学生或成绩。",
      unassignedSubject: "未分配科目",
      noClassesAssigned: "未授课",
      notGraded: "未录入",
      noGpa: "暂无",
      editTeacherTitle: "更新教师账号",
      addTeacherTitle: "注册新教师",
      teacherIdLabel: "教师编号 (ID)",
      teacherNameLabel: "教师姓名",
      teacherEmailLabel: "登录邮箱 (固定后缀 @edu.com)",
      saveConfirm: "确认保存",
      editStudentTitle: "更新学生账号",
      addStudentTitle: "注册新学生",
      studentIdLabel: "学号 (ID)",
      studentNameLabel: "学生姓名",
      studentEmailLabel: "登录 Gmail (固定后缀 @gmail.com)",
      selectClassDefault: "-- 未分班 / 不属于任何班级 --",
      removeFromClass: "移出班级",
      editGradesTitle: "录入与修改成绩",
      gradeNote: "分数范围 0.0 至 10.0。请输入各科平时成绩，系统将自动计算 GPA。无成绩请留空。",
      updateGrades: "更新成绩",
      addClassTitle: "注册新班级",
      classIdLabel: "班级编号 (如: 12A3, 10C5)",
      classIdPlaceholder: "无空格编号",
      classNameLabel: "班级详细名称",
      classNamePlaceholder: "如: 理科实验班 12A3",
      registerClass: "注册班级",
      enrollTitle: "注册加入班级",
      enrollTextPrefix: "将",
      enrollTextSuffix: "分配至以下班级：",
      assignedClassLabel: "指定班级",
      selectClassPrompt: "-- 请选择班级 --",
      confirmEnroll: "确认分配",
      tooltips: {
        removeBadge: "取消此班级授课",
        editInfo: "编辑信息",
        deleteAccount: "删除账号",
        viewGradeDetail: "查看详细成绩档案",
        editGrades: "录入 / 修改成绩",
        editStudent: "编辑学生",
        deleteStudentAndGrades: "删除学生及成绩",
        clearGrades: "清空成绩",
        deleteClass: "删除班级",
        withdrawStudent: "将学生移出班级（保留信息及成绩）"
      },
      alerts: {
        enterTeacherEmail: "请输入教师邮箱账号！",
        emailDuplicate: "该邮箱/Gmail 已被其他成员使用！",
        teacherExists: "该教师编号已存在！",
        cannotSaveAssignment: "无法保存任课分配：",
        enterStudentEmail: "请输入学生 Gmail 账号！",
        studentExists: "该学号已存在！",
        fillClassInfo: "请输入完整的班级编号和班级名称。",
        classExists: "系统里已存在该班级编号。",
        teacherSubjectAssigned: "无法分配：该班级已有该科目的任课教师！"
      },
      confirms: {
        deleteTeacher: "您确定要删除这位教师吗？",
        deleteStudent: "您确定要删除该学生及所有相关成绩数据吗？",
        clearGrade: "您确定要将该学生所有科目的成绩清空为“暂无”状态吗？",
        deleteClass: "您确定要删除该班级吗？\n该班级中的所有学生和教师都将被移出班级。",
        unenrollTeacher: "您确定要取消该教师对该班级的授课分配吗？",
        unenrollStudent: "您确定要将该学生移出该班级吗？",
        incompleteTeacherClasses: "注意：分配后，部分班级暂时未能配齐 3 门科目的任课教师。\n您确定要继续保存吗？"
      }
    },

    permissions: {
      columnHeader: "权限设置",
      button: "权限设置",
      btnTitle: "配置成员权限：",
      modalTitle: "基于角色的访问权限配置 (RBAC)",
      modalSubtitle: "自定义开启或关闭系统成员账号的各项操作权限",
      adminSystemDesc: "全系统超级管理员",
      subjectLabel: "任教学科:",
      assignedClassesLabel: "任教班级:",
      classLabel: "所在班级:",
      unassignedClass: "未分班",
      unassignedClasses: "未分配班级",
      presetDefault: "按角色默认",
      presetGrantAll: "授予全部权限",
      presetRevokeAll: "撤销全部权限",
      activeCountText: "已开启:",
      statusRestoredDefault: "🔄 已按角色恢复默认权限配置。",
      statusGrantedAll: "⚡ 已授予全部访问与操作权限。",
      statusRevokedAll: "🚫 已禁用并撤回所有权限。",
      statusSaveSuccessPrefix: "✅ 已成功保存",
      statusSaveSuccessSuffix: "的自定义权限配置！",
      statusSaveFailed: "❌ 保存权限失败，请重试。",
      statusSaveLocalPrefix: "✅ 已更新",
      statusSaveLocalSuffix: "的本地权限配置！",
      granted: "已授权",
      denied: "已禁止",
      close: "关闭",
      saveChanges: "保存权限更改",
      saving: "正在保存...",
      sections: {
        classesTitle: "班级与结构管理",
        classesSubtitle: "创建、编辑班级，指派教师与分班管理",
        systemTitle: "账户与系统管理",
        systemSubtitle: "管理成员账号与系统角色权限",
        assignmentTitle: "任课安排与班级分配",
        assignmentSubtitle: "点击行或滑动开关以修改",
        gradesTitle: "成绩管理与学业档案",
        gradesSubtitle: "录入、修改单科成绩与锁定成绩册",
        reportsTitle: "报表、查询与统计",
        reportsSubtitle: "查看全校/班级成绩单与导出 CSV 报表",
        teacherGradingTitle: "教学业务与成绩录入",
        teacherGradingSubtitle: "针对教师所任教班级的操作权限",
        teacherReportsTitle: "学生名册与班级报表",
        teacherReportsSubtitle: "查看名册与数据导出权限",
        studentAccessTitle: "学生成绩查询与个人报告",
        studentAccessSubtitle: "学生个人学习档案访问权限"
      },
      items: {
        createClassTitle: "创建新班级",
        createClassDesc: "允许在系统中创建并注册新班级编号和名称。",
        editClassTitle: "编辑班级信息",
        editClassDesc: "允许修改班级名称、重新分班及管理班级结构。",
        deleteClassTitle: "删除班级",
        deleteClassDesc: "允许从系统数据库中删除班级。",
        manageMembersTitle: "管理账号与成员",
        manageMembersDesc: "创建教师/学生账号、重置密码及删除成员。",
        manageRolePermissionsTitle: "系统角色权限配置",
        manageRolePermissionsDesc: "配置全校基于角色的权限控制矩阵。",
        assignTeachersTitle: "指定任课教师",
        assignTeachersDesc: "根据科目专业将教师指派至相应班级任教。",
        autoAssignTeacherTitle: "自动认领缺课班级",
        autoAssignTeacherDesc: "允许教师自动认领尚未配备任课教师的班级。",
        enrollStudentsTitle: "将学生分入班级",
        enrollStudentsDesc: "将未分班学生加入班级正式花名册。",
        unenrollStudentsTitle: "将学生移出班级",
        unenrollStudentsDesc: "将学生从当前班级移出并重置为未分班状态。",
        editMathGradesTitle: "录入与修改数学成绩",
        editMathGradesDesc: "允许录入和修改数学科目的平时、期中及期末成绩。",
        editLiteratureGradesTitle: "录入与修改语文成绩",
        editLiteratureGradesDesc: "允许录入和修改语文科目的平时、期中及期末成绩。",
        editEnglishGradesTitle: "录入与修改英语成绩",
        editEnglishGradesDesc: "允许录入和修改英语科目的平时、期中及期末成绩。",
        lockGradesTitle: "锁定并核准成绩册",
        lockGradesDesc: "核准正式学期成绩并加锁保护，禁止后续随意篡改。",
        viewAllSchoolGradesTitle: "查看全校成绩单",
        viewAllSchoolGradesDesc: "查询全校所有班级全体学生的综合成绩。",
        viewClassGradesTitle: "查看班级成绩单",
        viewClassGradesDesc: "查询所任教或所在班级的详细成绩。",
        exportCsvReportsTitle: "导出 CSV 报表",
        exportCsvReportsDesc: "将成绩数据和成员花名册导出下载为 CSV 文件。",
        // Teacher specific items
        teacherEnterGradesTitle: "录入与修改所教科目成绩",
        teacherEnterGradesDesc: "允许教师录入和修改任教班级学生的平时、期中及期末成绩。",
        teacherClearGradesTitle: "清空已录入的科目成绩",
        teacherClearGradesDesc: "允许清空所教班级学生的单科成绩为未录入状态。",
        teacherAutoClaimClassTitle: "自动认领缺教师班级",
        teacherAutoClaimClassDesc: "允许教师自动登记认领尚未指派相应学科教师的班级。",
        teacherViewAssignedClassGradesTitle: "查看任教班级成绩单",
        teacherViewAssignedClassGradesDesc: "查看所任教班级全体学生的详细成绩与学业评价。",
        teacherViewStudentListTitle: "查看任教班级学生名册",
        teacherViewStudentListDesc: "访问所有成员标签页查看所任教班级的学生信息。",
        teacherExportGradesCsvTitle: "导出任教班级成绩 CSV",
        teacherExportGradesCsvDesc: "将所任教班级学生的成绩单下载为 CSV 文件。",
        // Student specific items
        studentViewGradesTitle: "查看个人各科成绩与 GPA",
        studentViewGradesDesc: "允许学生查看各科平时成绩、综合平均分 (GPA) 及学业评价。",
        studentExportTranscriptCsvTitle: "导出个人成绩单 CSV",
        studentExportTranscriptCsvDesc: "允许学生将个人各科成绩单下载为 CSV 文件。",
        studentRequestReviewTitle: "提交成绩复核与反馈",
        studentRequestReviewDesc: "允许学生对单科成绩提出疑问并向教师申请复核。"
      }
    },
    studentInfo: {
      classInfoTitle: "班级概况与任课教师",
      classInfoSubtitle: "查看任课教师安排与班级基本情况",
      classSizeLabel: "班级人数",
      studentsUnit: "名学生",
      subjectTeachersLabel: "任课教师",
      teacherUnassigned: "尚未安排",
      teacherContact: "联系邮箱",
      restrictedNotice: "查看班级和教师信息的权限当前已被限制。",
      unassignedNotice: "您目前尚未分配到任何正式班级。"
    },

    rbac: {
      title: "基于角色的权限控制矩阵",
      subtitle: "集中配置系统中各角色（管理员、教师、学生）的功能权限。所有修改将自动且统一应用至对应角色的全体用户。",
      colFeature: "功能模块与权限",
      colAdmin: "管理员",
      colTeacher: "教师",
      colStudent: "学生",
      columns: {
        permission: "功能 / 权限项",
        admin: "管理员",
        teacher: "教师",
        student: "学生"
      },
      categories: {
        all: "全部分类",
        classes: "班级管理",
        grades: "成绩管理",
        reports: "报表与统计",
        system: "系统管理"
      },
      catClasses: "班级与分班管理",
      catGrades: "成绩与学业管理",
      catReports: "查询、统计与报表",
      catSystem: "账号与系统管理",
      btnSave: "保存更改",
      saveChanges: "保存更改",
      btnReset: "恢复默认设置",
      resetDefaults: "恢复默认设置",
      btnGrantAll: "授予全部可用权限",
      grantAll: "授予全部可用权限",
      saving: "正在保存并同步权限...",
      saveSuccess: "权限矩阵保存成功！已向全系统对应角色用户实时生效。",
      saveError: "保存权限矩阵失败，请重试。",
      lockedBadge: "固定权限",
      lockedAdminOnlyDesc: "高权限管理操作，仅管理员可用。",
      lockedStudentDesc: "为保障数据安全，该权限对学生角色受限。",
      lockedForRole: "🔒 核心敏感权限 - 已对该角色锁定，以保障系统安全与数据完整性。",
      adminFullControl: "👑 管理员拥有系统最高控制权。",
      activeCount: "已启用",
      filterAll: "全部分类",
      searchPlaceholder: "搜索权限项或功能...",
      globalNotice: "提示：在此处修改权限将立即并全局同步到该角色的所有用户账号中。",
      systemWideNotice: "提示：在权限矩阵中的所有调整均会立即且全局同步到该角色的所有现有和新建账号中。"
    }
  }
};

let currentLanguage: Language = (localStorage.getItem('app_lang') as Language) || 'vi';

export function getLanguage(): Language {
  return currentLanguage;
}

export function setLanguage(lang: Language): void {
  currentLanguage = lang;
  localStorage.setItem('app_lang', lang);
  window.dispatchEvent(new CustomEvent('languageChange', { detail: lang }));
}

export function t(path: string, lang?: Language): string {
  const l = lang || currentLanguage;
  const dict = translations[l] || translations.vi;
  const parts = path.split('.');
  let obj: any = dict;
  for (const part of parts) {
    if (obj && typeof obj === 'object' && part in obj) {
      obj = obj[part];
    } else {
      return path;
    }
  }
  return typeof obj === 'string' ? obj : path;
}

export function formatRole(role?: string, lang?: Language): string {
  if (!role) return '';
  const l = lang || currentLanguage;
  const dict = translations[l] || translations.vi;
  if (role === 'admin') return dict.roles.admin;
  if (role === 'teacher') return dict.roles.teacher;
  if (role === 'student') return dict.roles.student;
  return role;
}

export function formatUserName(user?: { role?: string; name?: string } | null, lang?: Language): string {
  if (!user) return '';
  if (user.role === 'admin' && (user.name === 'Quản trị viên' || user.name === 'Administrator' || user.name === '管理员')) {
    return formatRole('admin', lang);
  }
  if (user.role === 'teacher' && (user.name === 'Giáo viên' || user.name === 'Teacher' || user.name === '教师')) {
    return formatRole('teacher', lang);
  }
  if (user.role === 'student' && (user.name === 'Học sinh' || user.name === 'Student' || user.name === '学生')) {
    return formatRole('student', lang);
  }
  return user.name || '';
}

export function formatSubject(subject?: string, lang?: Language): string {
  if (!subject) return '';
  const l = lang || currentLanguage;
  const dict = translations[l] || translations.vi;
  const lower = subject.toLowerCase();
  if (lower === 'math') return dict.subjects.math;
  if (lower === 'literature') return dict.subjects.literature;
  if (lower === 'english') return dict.subjects.english;
  return subject;
}

export function formatClassName(className?: string | null, lang?: Language): string {
  if (!className || className.trim() === '' || className === 'Chưa xếp lớp' || className === 'Unassigned') {
    const l = lang || currentLanguage;
    return translations[l].classStatus.unassigned;
  }
  return className;
}

export function formatEvaluation(gpa: number | null, lang?: Language): string {
  const l = lang || currentLanguage;
  const dict = translations[l] || translations.vi;
  if (gpa === null || gpa === undefined) return '---';
  if (gpa >= 8.0) return dict.evaluation.excellent;
  if (gpa >= 6.5) return dict.evaluation.good;
  if (gpa >= 5.0) return dict.evaluation.average;
  return dict.evaluation.weak;
}

export function formatPaginationInfo(
  start: number,
  end: number,
  total: number,
  typeKey: 'matchingMembers' | 'matchingTeachers' | 'matchingStudents' | 'classStudents' | 'items',
  lang?: Language
): string {
  const l = lang || currentLanguage;
  const p = translations[l]?.pagination || translations.vi.pagination;
  const typeText = p[typeKey] || p.items;
  return `${p.showing} ${start}-${end} ${p.of} ${total} ${typeText}`;
}
