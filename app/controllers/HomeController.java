package controllers;

import akka.actor.ActorSystem;
import play.Configuration;
import play.api.Application;
import play.libs.ws.WSClient;
import play.mvc.*;

import views.html.*;

import controllers.*;

import javax.inject.Inject;

/**
 * This controller contains an action to handle HTTP requests
 * to the application's home page.
 */
public class HomeController extends Controller {

    private final Configuration configuration;

    @Inject
    public HomeController(Configuration configuration) {
        this.configuration = configuration;
    }

    /**
     * An action that renders an HTML page with a welcome message.
     * The configuration in the <code>routes</code> file means that
     * this method will be called when the application receives a
     * <code>GET</code> request with a path of <code>/</code>.
     */
    public Result index(String path) {
        String firebaseUrl = this.configuration.getString("firebaseUrl");
        return ok(index.render(firebaseUrl));
    }

}
