package models;

import com.fasterxml.jackson.annotation.JsonIgnore;

public class Student {
    private String academicTermUid;
    private String name;
    private String studentGroupUid;

    @JsonIgnore
    private String Key;

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
        return Key;
    }

    @JsonIgnore
    public void setKey(String key) {
        Key = key;
    }
}
