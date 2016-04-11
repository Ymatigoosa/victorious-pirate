package actors;

import akka.actor.*;
import com.firebase.client.Firebase;
import models.*;

import java.util.List;

public class JournalXmlCreatorActor extends UntypedActor {

    public static Props props(String firebaseUrl, String academicTermUid, String courseUid, String studentGroupUid) {
        return Props.create(JournalXmlCreatorActor.class, firebaseUrl, academicTermUid, courseUid, studentGroupUid);
    }

    public JournalXmlCreatorActor(String firebaseUrl, String academicTermUid, String courseUid, String studentGroupUid) {
        this.studentGroupUid = studentGroupUid;
        this.firebaseUrl = firebaseUrl;
        this.academicTermUid = academicTermUid;
        this.courseUid = courseUid;
    }

    private final String studentGroupUid;
    private final String firebaseUrl;
    private final String academicTermUid ;
    private final String courseUid;

    // dangerous state
    private List<JournalDate> dates = null;
    private List<Student> groups = null;
    private List<StudentMark> marks = null;
    private ActorRef initiator = null;


    public void onReceive(Object msg) throws Exception {

    }

    private void _requestDataFromFirebase() {
        Firebase rootRef = new Firebase(this.firebaseUrl);
    }
}