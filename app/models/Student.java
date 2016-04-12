package models;

import com.fasterxml.jackson.annotation.JsonIgnore;

public class Student {
    private String academicTermUid;
    private String name;
    private String studentGroupUid;

    @JsonIgnore
    private String key;

    public Student() {

    }

    public String getAcademicTermUid() {
        return academicTermUid;
    }

    public String getName() {
        return name;
    }

    public String getStudentGroupUid() {
        return studentGroupUid;
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
