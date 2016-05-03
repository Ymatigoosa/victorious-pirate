package actors;

import akka.actor.*;
import akka.event.Logging;
import akka.event.LoggingAdapter;
import akka.japi.pf.ReceiveBuilder;
import com.firebase.client.*;
import com.firebase.security.token.TokenGenerator;
import com.firebase.security.token.TokenOptions;
import models.*;
import org.apache.poi.xwpf.usermodel.XWPFTable;
import play.libs.ws.WSRequest;
import play.libs.ws.WSClient;
import play.libs.ws.WSResponse;
import scala.PartialFunction;
import scala.concurrent.duration.Duration;
import scala.runtime.BoxedUnit;

import java.text.DateFormat;
import java.text.SimpleDateFormat;
import java.util.*;
import java.util.concurrent.TimeUnit;
import java.util.function.Function;

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
                    processGenerateReportXml(msg);
                })
                .matchEquals("timeout", msg -> {
                    this.terminateSilently();
                }).build();
    }

    final PartialFunction<Object, BoxedUnit> waitingForFirebaseDocument(final ActorRef parent, WSClient ws, String firebaseSecret, String filepickerSecret) {
        return ReceiveBuilder.
                match(ReportGeneratorActorProtocol.RecievedDocument.class, msg -> {
                    this.processReceivedDocument(msg, parent, ws, firebaseSecret, filepickerSecret);
                })
                .match(ReportGeneratorActorProtocol.RecievedError.class, msg -> {
                    this.processReceivedError(msg, parent);
                })
                .matchEquals("timeout", msg -> {
                    this.terminateWithFailureResponse(parent, msg);
                }).build();
    }

    final PartialFunction<Object, BoxedUnit> waitingForFilepickerDocument(final ActorRef parent, final Document document, WSClient ws, String firebaseSecret, String filepickerSecret) {
        return ReceiveBuilder.
                match(ReportGeneratorActorProtocol.RecievedFile.class, msg -> {
                    this.processReceivedFile(msg, parent, ws, firebaseSecret, filepickerSecret);
                })
                .match(ReportGeneratorActorProtocol.RecievedError.class, msg -> {
                    this.processReceivedError(msg, parent);
                })
                .matchEquals("timeout", msg -> {
                    this.terminateWithFailureResponse(parent, msg);
                }).build();
    }

    private void processGenerateReportXml(ReportGeneratorActorProtocol.GenerateReportlXml msg) {
        Firebase rootRef = new Firebase(msg.firebaseUrl);
        //rootRef.authWithCustomToken();
        final ActorRef self_c = this.self();
        rootRef.authWithCustomToken(this.getToken(msg.firebaseSecret), new Firebase.AuthResultHandler() {
            @Override
            public void onAuthenticated(AuthData authData) {

            }

            @Override
            public void onAuthenticationError(FirebaseError firebaseError) {
                self_c.tell(new ReportGeneratorActorProtocol.RecievedError("auth failed"), self_c);
            }
        });

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

        getContext().become(waitingForFirebaseDocument(this.sender(), msg.ws, msg.firebaseSecret, msg.filepickerSecret));
    }

    private String getToken(String firebaseSecret) {
        Map<String, Object> authPayload = new HashMap<String, Object>();
        authPayload.put("uid", "1");

        TokenOptions tokenOptions = new TokenOptions();
        tokenOptions.setAdmin(true);

        TokenGenerator tokenGenerator = new TokenGenerator(firebaseSecret);
        String token = tokenGenerator.createToken(authPayload, tokenOptions);
        return token;
    }

    private void processReceivedError(ReportGeneratorActorProtocol.RecievedError msg, ActorRef parent) {
        terminateWithFailureResponse(parent, msg.msg);
    }

    private void processReceivedDocument(ReportGeneratorActorProtocol.RecievedDocument msg, ActorRef parent, WSClient ws, String firebaseSecret, String filepickerSecret) {
        final String filename = msg.document.getFpfile().getFilename();
        final Boolean isFilenameGood = filename.endsWith(".doc") || filename.endsWith(".docx");
        if (isFilenameGood) {
            final WSRequest request = ws.url(msg.document.getFpfile().getUrl());
            request.get().thenApply(WSResponse::asByteArray).thenApply(response -> {
                this.self().tell(new ReportGeneratorActorProtocol.RecievedFile(response), this.self());
                return response;
            });
            getContext().become(this.waitingForFilepickerDocument(parent, msg.document, ws, firebaseSecret, filepickerSecret));
        } else {
            this.self().tell(new ReportGeneratorActorProtocol.RecievedError("bad filename"), this.self());
        }
    }

    private void processReceivedFile(ReportGeneratorActorProtocol.RecievedFile msg, ActorRef parent, WSClient ws, String firebaseSecret, String filepickerSecret) {
        if (msg.file.length < 1) {
            terminateWithFailureResponse(parent, "received 0 bytes from file storage");
        } else {
            ws.url("https://www.filepicker.io/api/store/S3")
                    .setQueryParameter("base64decode", "false")
                    .setQueryParameter("filename", "Отчет " + df.format(new Date()) + ".txt")
                    .setQueryParameter("key", filepickerSecret)
                    .post("123456789");
            this.terminateWithSuccessResponse(parent);
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

    public static class TableMapping {

        public final int indexInReport;

        public final String header;

        private final Function<XWPFTable, XWPFTable> _map;

        public TableMapping(int indexInReport, String header, Function<XWPFTable, XWPFTable> map) {
            this.indexInReport = indexInReport;
            this.header = header;
            this._map = map;
        }

        public TableMapping.Result map(XWPFTable table) {
            try {
                return new TableMapping.Result(this, this._map.apply(table));
            } catch (Exception e) {
                return null;
            }
        }

        public static class Result {
            public final TableMapping mapper;
            public final XWPFTable table;

            public Result(TableMapping mapper, XWPFTable table) {
                this.mapper = mapper;
                this.table = table;
            }
        }
    }
}