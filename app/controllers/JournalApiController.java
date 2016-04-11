package controllers;

import actors.JournalXmlCreatorActor;
import actors.JournalXmlCreatorActorProtocol;
import akka.actor.*;
import play.mvc.*;
import play.Configuration;
import scala.compat.java8.FutureConverters;
import javax.inject.*;
import java.util.concurrent.CompletionStage;

import static akka.pattern.Patterns.ask;

/**
 * This controller contains an action to handle HTTP requests
 * to the application's home page.
 */
public class JournalApiController extends Controller {

    private final ActorSystem system;
    private final Configuration configuration;

    @Inject public JournalApiController(ActorSystem system, Configuration configuration) {
        this.system = system;
        this.configuration = configuration;
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
                firebaseUrl
        );
        return FutureConverters.toJava(ask(actor, msg, 10000))
                .thenApply(response -> ok("azaza"));
    }

}