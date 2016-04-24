package actors;

import models.Document;
import play.libs.ws.*;

public class ReportGeneratorActorProtocol {

    public static class GenerateReportlXml {

        public final WSClient ws;
        public final String documentUid;

        public GenerateReportlXml(WSClient ws, String documentUid) {
            this.ws = ws;
            this.documentUid = documentUid;
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
        public final String filename;

        public FileSaved(String filename) {
            this.filename = filename;
        }
    }

    public static class GenerationSucceeded {

        public GenerationSucceeded() {
        }
    }
}