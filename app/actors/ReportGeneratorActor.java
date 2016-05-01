package actors;

import akka.actor.*;
import akka.event.Logging;
import akka.event.LoggingAdapter;
import akka.japi.function.Procedure;
import akka.japi.pf.ReceiveBuilder;
import com.firebase.client.DataSnapshot;
import com.firebase.client.Firebase;
import com.firebase.client.FirebaseError;
import com.firebase.client.ValueEventListener;
import models.*;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.xssf.usermodel.*;
import play.libs.ws.WSRequest;
import play.libs.ws.WSClient;
import play.libs.ws.WSResponse;
import scala.PartialFunction;
import scala.concurrent.duration.Duration;
import scala.runtime.BoxedUnit;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.text.DateFormat;
import java.text.SimpleDateFormat;
import java.util.*;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

public class ReportGeneratorActor extends AbstractActor {

    public static Props props() {
        return Props.create(ReportGeneratorActor.class);
    }

    private final LoggingAdapter log = Logging.getLogger(getContext().system(), this);
    private final DateFormat df = new SimpleDateFormat("d.MM hh:mm:ss");

    public ReportGeneratorActor() {
        Scheduler scheduler = getContext().system().scheduler();
        scheduler.scheduleOnce(Duration.create(5, TimeUnit.MINUTES),
                self(), "timeout", context().dispatcher(), null);

        receive(initialState());
    }

    final PartialFunction<Object, BoxedUnit> initialState() {
        return ReceiveBuilder.
                match(ReportGeneratorActorProtocol.GenerateReportlXml.class, msg -> {
                    processGenerateReportlXml(msg);
                })
                .matchEquals("timeout", msg -> {
                    this.terminateSilently();
                }).build();
    }

    final PartialFunction<Object, BoxedUnit> waitingForFirebaseDocument(final ActorRef parent, WSClient ws) {
        return ReceiveBuilder.
                match(ReportGeneratorActorProtocol.RecievedDocument.class, msg -> {
                    this.processRecievedDocument(msg, parent, ws);
                })
                .match(ReportGeneratorActorProtocol.RecievedError.class, msg -> {
                    this.processRecievedError(msg, parent);
                })
                .matchEquals("timeout", msg -> {
                    this.terminateWithFailureResponse(parent, msg);
                }).build();
    }

    final PartialFunction<Object, BoxedUnit> waitingForFilepickerDocument(final ActorRef parent, final Document document, WSClient ws) {
        return ReceiveBuilder.
                match(ReportGeneratorActorProtocol.RecievedFile.class, msg -> {
                    this.processRecievedFile(msg, parent, ws);
                })
                .match(ReportGeneratorActorProtocol.RecievedError.class, msg -> {
                    this.processRecievedError(msg, parent);
                })
                .matchEquals("timeout", msg -> {
                    this.terminateWithFailureResponse(parent, msg);
                }).build();
    }

    private void processGenerateReportlXml(ReportGeneratorActorProtocol.GenerateReportlXml msg) {
        Firebase rootRef = new Firebase(msg.firebaseUrl);
        final ActorRef self_c = this.self();

        rootRef.child("documents")
                .child(msg.documentUid)
                .addListenerForSingleValueEvent(new ValueEventListener() {
                    @Override
                    public void onDataChange(DataSnapshot querySnapshot) {
                        Document item = querySnapshot.getValue(Document.class);
                        item.setKey(querySnapshot.getKey());
                        self_c.tell(new ReportGeneratorActorProtocol.RecievedDocument(item), self_c);
                    }
                    @Override
                    public void onCancelled(FirebaseError error) {
                        log.error("Error while retrieving course-dates: %s", error.toString());
                        self_c.tell(new ReportGeneratorActorProtocol.RecievedError(error.toString()), self_c);
                    }
                });

        getContext().become(waitingForFirebaseDocument(this.sender(), msg.ws));
    }

    private void processRecievedError(ReportGeneratorActorProtocol.RecievedError msg, ActorRef parent) {
        terminateWithFailureResponse(parent, msg.msg);
    }

    private void processRecievedDocument(ReportGeneratorActorProtocol.RecievedDocument msg, ActorRef parent, WSClient ws) {
        final String filename = msg.document.getFpfile().getFilename();
        final Boolean isFilenameGood = filename.endsWith(".doc") || filename.endsWith(".docx");
        if (isFilenameGood) {
            final WSRequest request = ws.url(msg.document.getFpfile().getUrl());
            request.get().thenApply(WSResponse::asByteArray).thenApply(response -> {
                this.self().tell(new ReportGeneratorActorProtocol.RecievedFile(response), this.self());
                return response;
            });
            getContext().become(this.waitingForFilepickerDocument(parent, msg.document, ws));
        } else {
            terminateWithFailureResponse(parent, "bad filename");
        }
    }

    private void processRecievedFile(ReportGeneratorActorProtocol.RecievedFile msg, ActorRef parent, WSClient ws) {
        if (msg.file.length < 1) {
            terminateWithFailureResponse(parent, "received 0 bytes from file storage");
        } else {
            ws.url("https://www.filepicker.io/api/store/S3")
                    .setQueryParameter("base64decode", "false")
                    .setQueryParameter("filename", "Отчет " + df.format(new Date()) + ".txt")
                    .setQueryParameter("key", "APNVn3FlR6yU5HyVrtxIgz")
                    .post("123456789");
        }
    }

    private void terminateWithSuccessResponse(ActorRef parent) {
        parent.tell(new ReportGeneratorActorProtocol.GenerationSucceeded(), this.self());
        this.getContext().stop(this.self());
    }

    private void terminateWithFailureResponse(ActorRef parent, String msg) {
        parent.tell(new ReportGeneratorActorProtocol.GenerationFailure(msg), this.self());
        this.getContext().stop(this.self());
    }

    private void terminateSilently() {
        this.getContext().stop(this.self());
    }
}