package controllers;

import actors.JournalXmlCreatorActor;
import actors.JournalXmlCreatorActorProtocol;
import actors.ReportGeneratorActor;
import actors.ReportGeneratorActorProtocol;
import akka.actor.*;
import play.libs.ws.WSClient;
import play.mvc.*;
import play.Configuration;
import scala.compat.java8.FutureConverters;
import javax.inject.*;
import java.io.UnsupportedEncodingException;
import java.net.URLEncoder;
import java.util.concurrent.CompletionStage;

import static akka.pattern.Patterns.ask;

/**
 * This controller contains an action to handle HTTP requests
 * to the application's home page.
 */
public class ApiController extends Controller {

    private final ActorSystem system;
    private final Configuration configuration;
    private final WSClient ws;

    @Inject public ApiController(ActorSystem system, Configuration configuration, WSClient ws) {
        this.system = system;
        this.configuration = configuration;
        this.ws = ws;
    }

    /**
     * An action that renders an HTML page with a welcome message.
     * The configuration in the <code>routes</code> file means that
     * this method will be called when the application receives a
     * <code>GET</code> request with a path of <code>/</code>.
     */
    public CompletionStage<Result> generateXls(String academicTermUid, String courseUid, String studentGroupUid) {
        ActorRef actor = system.actorOf(JournalXmlCreatorActor.props());
        String firebaseUrl = this.configuration.getString("firebaseUrl");
        JournalXmlCreatorActorProtocol.CreateJournalXml msg = new JournalXmlCreatorActorProtocol.CreateJournalXml(
                academicTermUid,
                courseUid,
                studentGroupUid,
                firebaseUrl);
        return FutureConverters.toJava(ask(actor, msg, 10000))
                .thenApply(response -> this.sendXlsxResponse(response));
    }

    public CompletionStage<Result> generateReport(String documentUid) {
        ActorRef actor = system.actorOf(ReportGeneratorActor.props());
        String firebaseUrl = this.configuration.getString("firebaseUrl");
        String filepickerSecret = this.configuration.getString("filepickerSecret");
        String firebaseSecret = this.configuration.getString("firebaseSecret");
        ReportGeneratorActorProtocol.GenerateReportlXml msg = new ReportGeneratorActorProtocol.GenerateReportlXml(
                ws,
                documentUid,
                firebaseUrl,
                firebaseSecret,
                filepickerSecret);
        return FutureConverters.toJava(ask(actor, msg, 10000))
                .thenApply(response -> sendReportResponse(response));
    }

    private String getFilename(String courseName, String groupName) {
        String raw = courseName + " "+ groupName + ".xlsx";
        try {
            return URLEncoder.encode(raw, "UTF-8").replace("+", "%20");
        } catch (UnsupportedEncodingException e) {
            return "journal.xlsx";
        }
    }

    private Result sendXlsxResponse(Object response) {
        if (response instanceof JournalXmlCreatorActorProtocol.JournalXmlCreated ) {
            JournalXmlCreatorActorProtocol.JournalXmlCreated msg = (JournalXmlCreatorActorProtocol.JournalXmlCreated)response;
            return ok(msg.file)
                    .as("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
                    .withHeader("Content-Disposition", "attachment; file=\""+getFilename(msg.courseName, msg.groupName) +"\"");
        } else if (response instanceof JournalXmlCreatorActorProtocol.JournalXmlError ) {
            JournalXmlCreatorActorProtocol.JournalXmlError msg = (JournalXmlCreatorActorProtocol.JournalXmlError)response;
            return this.internalServerError("createXls returned an error");
        }
        return this.internalServerError("unknown error");
    }

    private Result sendReportResponse(Object response) {
        if (response instanceof ReportGeneratorActorProtocol.GenerationSucceeded ) {
            //ReportGeneratorActorProtocol.GenerationSucceeded msg = (ReportGeneratorActorProtocol.GenerationSucceeded)response;
            return ok("good");
        } else if (response instanceof ReportGeneratorActorProtocol.GenerationFailure ) {
            ReportGeneratorActorProtocol.GenerationFailure msg = (ReportGeneratorActorProtocol.GenerationFailure)response;
            return this.internalServerError(msg.error);
        }
        return this.internalServerError("unknown error");
    }

}
