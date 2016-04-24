package models;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties({"Id"})
public class FilepickerFileDescriptor {
    private String client;
    private String filename;
    private Boolean isWriteable;
    private String mimetype;
    private Integer size;
    private String url;

    public FilepickerFileDescriptor() {

    }

    public String getClient() {
        return client;
    }

    public String getFilename() {
        return filename;
    }

    public Boolean getWriteable() {
        return isWriteable;
    }

    public String getMimetype() {
        return mimetype;
    }

    public Integer getSize() {
        return size;
    }

    public String getUrl() {
        return url;
    }
}