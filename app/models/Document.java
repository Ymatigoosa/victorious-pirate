package models;

import com.fasterxml.jackson.annotation.JsonIgnore;

/**
 * Created by ymatigoosa on 24.04.16.
 */
public class Document {

    @JsonIgnore
    private String key;

    private String categoryUid;
    private FilepickerFileDescriptor fpfile;
    private Boolean isTemplate;
    private String name;
    private String templateUid;

    public Document() {
    }

    public Document(String categoryUid, FilepickerFileDescriptor fpfile, Boolean isTemplate, String name, String templateUid) {
        this.categoryUid = categoryUid;
        this.fpfile = fpfile;

        this.isTemplate = isTemplate;
        this.name = name;
        this.templateUid = templateUid;
    }

    @JsonIgnore
    public String getKey() {
        return key;
    }

    @JsonIgnore
    public void setKey(String key) {
        this.key = key;
    }

    public String getCategoryUid() {
        return categoryUid;
    }

    public FilepickerFileDescriptor getFpfile() {
        return fpfile;
    }

    public Boolean getIsTemplate() {
        return isTemplate;
    }

    public String getName() {
        return name;
    }

    public String getTemplateUid() {
        return templateUid;
    }
}
