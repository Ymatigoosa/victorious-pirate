package actors;

import models.*;

import java.util.List;

public class JournalXmlCreatorActorProtocol {
    public static class CreateJournalXml {

        public final String academicTermUid;
        public final String courseUid;
        public final String studentGroupUid;
        public final String firebaseUrl;


        public CreateJournalXml(String academicTermUid, String courseUid, String studentGroupUid, String firebaseUrl) {
            this.academicTermUid = academicTermUid;
            this.courseUid = courseUid;
            this.studentGroupUid = studentGroupUid;
            this.firebaseUrl = firebaseUrl;
        }
    }

    public static class JournalXmlCreated {
        public final String academicTermUid;
        public final String courseUid;
        public final String studentGroupUid;
        public final String firebaseUrl;
        public final byte[] file;
        public final String groupName;
        public final String courseName;

        public JournalXmlCreated(String academicTermUid, String courseUid, String studentGroupUid, String firebaseUrl, byte[] file, String groupName, String courseName) {
            this.academicTermUid = academicTermUid;
            this.courseUid = courseUid;
            this.studentGroupUid = studentGroupUid;
            this.firebaseUrl = firebaseUrl;
            this.file = file;
            this.groupName = groupName;
            this.courseName = courseName;
        }
    }

    public static class JournalXmlError {
        public final String academicTermUid;
        public final String courseUid;
        public final String studentGroupUid;
        public final String firebaseUrl;
        public final String msg;

        public JournalXmlError(String academicTermUid, String courseUid, String studentGroupUid, String firebaseUrl, String msg) {
            this.academicTermUid = academicTermUid;
            this.courseUid = courseUid;
            this.studentGroupUid = studentGroupUid;
            this.firebaseUrl = firebaseUrl;
            this.msg = msg;
        }
    }

    public static class DatesRecieved {
        public final List<JournalDate> dates;

        public DatesRecieved(List<JournalDate> dates) {
            this.dates = dates;
        }
    }

    public static class StudentsRecieved {
        public final List<Student> students;

        public StudentsRecieved(List<Student> students) {
            this.students = students;
        }
    }

    public static class MarksRecieved {
        public final List<StudentMark> marks;

        public MarksRecieved(List<StudentMark> marks) {
            this.marks = marks;
        }
    }

    public static class StudentGroupRecieved {
        public final StudentGroup group;

        public StudentGroupRecieved(StudentGroup group) {
            this.group = group;
        }
    }

    public static class CourseRecieved {
        public final Course course;

        public CourseRecieved(Course course) {
            this.course = course;
        }
    }
}
