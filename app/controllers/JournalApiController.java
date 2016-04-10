package controllers;

import com.firebase.client.Firebase;
import play.mvc.Controller;
import play.mvc.Result;
import java.util.concurrent.CompletionStage;

/**
 * This controller contains an action to handle HTTP requests
 * to the application's home page.
 */
public class JournalApiController extends Controller {

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
