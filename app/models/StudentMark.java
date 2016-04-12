package models;

import com.fasterxml.jackson.annotation.JsonIgnore;

public class StudentMark {
    private String academicTermUid;
    private String courseUid;
    private String dateUid;
    private String studentGroupUid;
    private String studentUid;
    private Integer value;

    @JsonIgnore
    private String key;

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

    @JsonIgnore
    public String getKey() {
        return key;
    }

    @JsonIgnore
    public void setKey(String key) {
        this.key = key;
    }
}
