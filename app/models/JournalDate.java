package models;

import com.fasterxml.jackson.annotation.JsonProperty;

public class JournalDate {
    private String academicTermUid;
    private String courseUid;
    private Boolean isSum;
    private String studentGroupUid;
    private Long timestamp;

    @JsonProperty("studentGroupUid-courseUid")
    private String studentGroupUid_CourseUid;

    public JournalDate() {

    }

    public String getAcademicTermUid() {
        return academicTermUid;
    }

    public String getCourseUid() {
        return courseUid;
    }

    public Boolean getIsSum() {
        return isSum;
    }

    public String getStudentGroupUid() {
        return studentGroupUid;
    }

    public Long getTimestamp() {
        return timestamp;
    }

    @JsonProperty("studentGroupUid-courseUid")
    public String getStudentGroupUidCourseUid() {
        return studentGroupUid_CourseUid;
    }
}