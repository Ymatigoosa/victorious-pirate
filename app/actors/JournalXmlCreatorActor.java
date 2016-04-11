package actors;

import akka.actor.*;
import akka.event.Logging;
import akka.event.LoggingAdapter;
import com.firebase.client.DataSnapshot;
import com.firebase.client.Firebase;
import com.firebase.client.FirebaseError;
import com.firebase.client.ValueEventListener;
import models.*;
import scala.concurrent.duration.Duration;
import scala.concurrent.duration.FiniteDuration;

import static akka.pattern.Patterns.ask;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.TimeUnit;

public class JournalXmlCreatorActor extends UntypedActor {

    LoggingAdapter log = Logging.getLogger(getContext().system(), this);

    public static Props props() {
        return Props.create(JournalXmlCreatorActor.class);
    }

    public JournalXmlCreatorActor() {

    }

    private String studentGroupUid;
    private String firebaseUrl;
    private String academicTermUid ;
    private String courseUid;

    // dangerous state
    private List<JournalDate> dates = null;
    private List<Student> students = null;
    private List<StudentMark> marks = null;
    private ActorRef initiator = null;
    private Cancellable timeoutMessage;


    public void onReceive(Object msg) throws Exception {
        if (msg instanceof JournalXmlCreatorActorProtocol.CreateJournalXml ) {
            JournalXmlCreatorActorProtocol.CreateJournalXml createJournalXml = (JournalXmlCreatorActorProtocol.CreateJournalXml)msg;

            this.studentGroupUid = createJournalXml.studentGroupUid;
            this.firebaseUrl = createJournalXml.firebaseUrl;
            this.academicTermUid = createJournalXml.academicTermUid;
            this.courseUid = createJournalXml.courseUid;
            initiator = sender();

            _requestDataFromFirebase();

            Scheduler scheduler = getContext().system().scheduler();
            timeoutMessage = scheduler.scheduleOnce(Duration.create(5, TimeUnit.MINUTES),
                    self(), "timeout", context().dispatcher(), null);

        } else if (msg instanceof JournalXmlCreatorActorProtocol.DatesRecieved ) {
            this.dates = ((JournalXmlCreatorActorProtocol.DatesRecieved)msg).dates;
            _tryStartXlsCreating();
        } else if (msg instanceof JournalXmlCreatorActorProtocol.MarksRecieved ) {
            this.marks = ((JournalXmlCreatorActorProtocol.MarksRecieved)msg).marks;
            _tryStartXlsCreating();
        } else if (msg instanceof JournalXmlCreatorActorProtocol.StudentsRecieved ) {
            this.students = ((JournalXmlCreatorActorProtocol.StudentsRecieved) msg).students;
            _tryStartXlsCreating();
        } else if (msg.equals("timeout")) {
            getContext().stop(self());
        } else {
            unhandled(msg);
        }
    }

    private void _tryStartXlsCreating() {
        if (this.dates != null && this.marks != null && this.students != null) {
            _createXls();
        }
    }

    private void _createXls() {
        log.info("creating xlsx...");
        initiator.tell(
                new JournalXmlCreatorActorProtocol.JournalXmlCreated(
                    this.academicTermUid,
                    this.courseUid,
                    this.studentGroupUid,
                    this.firebaseUrl,
                    new byte[0]
                ),
                this.self()
        );
        getContext().stop(self());
    }

    private void _requestDataFromFirebase() {
        Firebase rootRef = new Firebase(this.firebaseUrl);
        final ActorRef self_c = this.self();

        rootRef.child("course-dates")
                .orderByChild("studentGroupUid-courseUid")
                .equalTo(this.createDateForeignKey(this.studentGroupUid, this.courseUid))
                .addListenerForSingleValueEvent(new ValueEventListener() {
                    @Override
                    public void onDataChange(DataSnapshot querySnapshot) {
                        List<JournalDate> acc = new ArrayList<JournalDate>();
                        for (DataSnapshot dataSnapshot: querySnapshot.getChildren()) {
                            JournalDate item = dataSnapshot.getValue(JournalDate.class);
                            acc.add(item);
                        }
                        self_c.tell(new JournalXmlCreatorActorProtocol.DatesRecieved(acc), self_c);
                    }
                    @Override
                    public void onCancelled(FirebaseError error) {
                        log.error("Error while retrieving course-dates: %s", error.toString());
                        self_c.tell(new JournalXmlCreatorActorProtocol.DatesRecieved(new ArrayList<JournalDate>()), self_c);
                    }
                });

        rootRef.child("students")
                .orderByChild("studentGroupUid")
                .equalTo(studentGroupUid)
                .addListenerForSingleValueEvent(new ValueEventListener() {
                    @Override
                    public void onDataChange(DataSnapshot querySnapshot) {
                        List<Student> acc = new ArrayList<Student>();
                        for (DataSnapshot dataSnapshot: querySnapshot.getChildren()) {
                            Student item = dataSnapshot.getValue(Student.class);
                            acc.add(item);
                        }
                        self_c.tell(new JournalXmlCreatorActorProtocol.StudentsRecieved(acc), self_c);
                    }
                    @Override
                    public void onCancelled(FirebaseError error) {
                        log.error("Error while retrieving students: %s", error.toString());
                        self_c.tell(new JournalXmlCreatorActorProtocol.StudentsRecieved(new ArrayList<Student>()), self_c);
                    }
                });

        rootRef.child("student-marks")
                .orderByChild("studentGroupUid")
                .equalTo(studentGroupUid)
                .addListenerForSingleValueEvent(new ValueEventListener() {
                    @Override
                    public void onDataChange(DataSnapshot querySnapshot) {
                        List<StudentMark> acc = new ArrayList<StudentMark>();
                        for (DataSnapshot dataSnapshot: querySnapshot.getChildren()) {
                            StudentMark item = dataSnapshot.getValue(StudentMark.class);
                            acc.add(item);
                        }
                        self_c.tell(new JournalXmlCreatorActorProtocol.MarksRecieved(acc), self_c);
                    }
                    @Override
                    public void onCancelled(FirebaseError error) {
                        log.error("Error while retrieving student-marks: %s", error.toString());
                        self_c.tell(new JournalXmlCreatorActorProtocol.MarksRecieved(new ArrayList<StudentMark>()), self_c);
                    }
                });
    }

    private String createDateForeignKey(String studentGroupUid, String courseUid) {
        return "("+ studentGroupUid + ", " + courseUid +")";
    }
}