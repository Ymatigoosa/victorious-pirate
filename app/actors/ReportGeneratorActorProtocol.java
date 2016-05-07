package actors;

import com.google.common.collect.ImmutableList;
import models.Document;
import models.FilepickerFileDescriptor;
import org.apache.poi.xwpf.usermodel.IBodyElement;
import play.libs.ws.*;

import java.util.stream.Stream;

public class ReportGeneratorActorProtocol {

    public static class GenerateReportlXml {

        public final WSClient ws;
        public final String documentUid;
        public final String firebaseUrl;
        public final String firebaseSecret;
        public final String filepickerSecret;

        public GenerateReportlXml(WSClient ws, String documentUid, String firebaseUrl, String firebaseSecret, String filepickerSecret) {
            this.ws = ws;
            this.documentUid = documentUid;
            this.firebaseUrl = firebaseUrl;
            this.firebaseSecret = firebaseSecret;
            this.filepickerSecret = filepickerSecret;
        }
    }

    public static class RecievedError {
        public final String msg;

        public RecievedError(String msg) {
            this.msg = msg;
        }
    }

    public static class RecievedDocument {
        public final Document document;

        public RecievedDocument(Document document) {
            this.document = document;
        }
    }

    public static class RecievedFile {
        public final byte[] file;

        public RecievedFile(byte[] file) {
            this.file = file;
        }
    }

    public static class FileSaved {
        public final FilepickerFileDescriptor file;

        public FileSaved(FilepickerFileDescriptor file) {
            this.file = file;
        }
    }

    public static class FileRemoved {
        public FileRemoved() {
        }
    }

    public static class FireBaseSaved {
        public FireBaseSaved() {
        }
    }

    public static class GenerationSucceeded {

        public GenerationSucceeded() {
        }
    }

    public static class GenerationFailure {

        public final String error;

        public GenerationFailure(String error) {
            this.error = error;
        }
    }

    //XWPFParagraph
    public static class ParagraphFinded {

        public final ImmutableList<IBodyElement> rest;

        public ParagraphFinded(ImmutableList<IBodyElement> rest) {
            this.rest = rest;
        }
    }

    public static class ParsingEnded {

        public ParsingEnded() {
        }
    }
}
