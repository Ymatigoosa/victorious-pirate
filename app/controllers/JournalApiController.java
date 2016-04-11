package controllers;

import com.firebase.client.Firebase;
import akka.actor.*;
import play.mvc.*;
import scala.compat.java8.FutureConverters;
import javax.inject.*;
import java.util.concurrent.CompletionStage;

import static akka.pattern.Patterns.ask;

/**
 * This controller contains an action to handle HTTP requests
 * to the application's home page.
 */
public class JournalApiController extends Controller {

    final ActorRef helloActor;

    @Inject public JournalApiController(ActorSystem system) {
        helloActor = system.actorOf(HelloActor.props);
    }

    public CompletionStage<Result> sayHello(String name) {
        return FutureConverters.toJava(ask(helloActor, new SayHello(name), 1000))
                .thenApply(response -> ok((String) response));
    }

    /**
     * An action that renders an HTML page with a welcome message.
     * The configuration in the <code>routes</code> file means that
     * this method will be called when the application receives a
     * <code>GET</code> request with a path of <code>/</code>.
     */
    public CompletionStage<Result> generateXls(String academicTermUid, String courseUid, String studentGroupUid) {
        Firebase rootRef = new Firebase("https://victorious-pirate.firebaseio.com");

        throw new UnsupportedOperationException();
    }

}
