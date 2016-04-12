package models;

import com.fasterxml.jackson.annotation.JsonIgnore;

public class Course {

    @JsonIgnore
    private String key;

    private String name;
    private String academicTermUid;
    private String description;


    public Course() {

    }

    @JsonIgnore
    public String getKey() {
        return key;
    }

    @JsonIgnore
    public void setKey(String key) {
        this.key = key;
    }

    public String getName() {
        return name;
    }

    public String getAcademicTermUid() {
        return academicTermUid;
    }

    public String getDescription() {
        return description;
    }
}
