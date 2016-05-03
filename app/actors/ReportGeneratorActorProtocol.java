package actors;

import com.google.common.collect.ImmutableList;
import models.Document;
import org.apache.poi.xwpf.usermodel.XWPFParagraph;
import play.libs.ws.*;

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
        public final String filename;

        public FileSaved(String filename) {
            this.filename = filename;
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

        public final XWPFParagraph current;

        public final ImmutableList<XWPFParagraph> rest;

        public ParagraphFinded(XWPFParagraph current, ImmutableList<XWPFParagraph> rest) {
            this.current = current;
            this.rest = rest;
        }
    }

    public static class HeaderFinded {

        public final XWPFParagraph current;

        public final ImmutableList<XWPFParagraph> rest;

        public final ReportGeneratorActor.TableMapping mapper;

        public HeaderFinded(XWPFParagraph current, ImmutableList<XWPFParagraph> rest, ReportGeneratorActor.TableMapping mapper) {
            this.current = current;
            this.rest = rest;
            this.mapper = mapper;
        }
    }

    public static class ParsingEnded {

        public final ReportGeneratorActor.TableMapping.TableCreator generatedTables;

        public ParsingEnded(ReportGeneratorActor.TableMapping.TableCreator generatedTables) {
            this.generatedTables = generatedTables;
        }
    }
}
