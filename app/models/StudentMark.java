package models;

public class StudentMark {
    private String academicTermUid;
    private String courseUid;
    private String dateUid;
    private String studentGroupUid;
    private String studentUid;
    private Integer value;

    public StudentMark() {

    }

    public String getAcademicTermUid() {
        return academicTermUid;
    }

    public String getCourseUid() {
        return courseUid;
    }

    public String getDateUid() {
        return dateUid;
    }

    public String getStudentGroupUid() {
        return studentGroupUid;
    }

    public String getStudentUid() {
        return studentUid;
    }

    public Integer getValue() {
        return value;
    }
}
