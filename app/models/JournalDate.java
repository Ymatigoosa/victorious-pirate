package models;

public class JournalDate {
    private String academicTermUid;
    private String courseUid;
    private Boolean isSum;
    private String studentGroupUid;
    private Integer timestamp;

    public JournalDate() {

    }

    public String getAcademicTermUid() {
        return academicTermUid;
    }

    public String getCourseUid() {
        return courseUid;
    }

    public Boolean getSum() {
        return isSum;
    }

    public String getStudentGroupUid() {
        return studentGroupUid;
    }

    public Integer getTimestamp() {
        return timestamp;
    }
}
