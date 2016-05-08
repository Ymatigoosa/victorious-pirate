package actors;

import akka.actor.*;
import akka.event.Logging;
import akka.event.LoggingAdapter;
import akka.japi.pf.ReceiveBuilder;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.firebase.client.*;
import com.firebase.security.token.TokenGenerator;
import com.firebase.security.token.TokenOptions;
import com.google.common.collect.ImmutableList;
import models.*;
import models.Document;
import org.apache.poi.xwpf.usermodel.*;
import org.openxmlformats.schemas.wordprocessingml.x2006.main.*;
import play.libs.ws.WSRequest;
import play.libs.ws.WSClient;
import play.libs.ws.WSResponse;
import scala.PartialFunction;
import scala.concurrent.duration.Duration;
import scala.runtime.BoxedUnit;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.math.BigInteger;
import java.text.DateFormat;
import java.text.SimpleDateFormat;
import java.util.*;
import java.util.concurrent.TimeUnit;
import java.util.function.BiConsumer;
import java.util.stream.Collector;
import java.util.stream.Collectors;

public class ReportGeneratorActor extends AbstractActor {

    public static Props props() {
        return Props.create(ReportGeneratorActor.class);
    }

    private final LoggingAdapter log = Logging.getLogger(getContext().system(), this);
    private final DateFormat df = new SimpleDateFormat("d.MM hh-mm-ss");

    private Firebase rootRef;

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
                    this.processReceivedFile(msg, parent, ws, firebaseSecret, filepickerSecret, document);
                })
                .match(ReportGeneratorActorProtocol.RecievedError.class, msg -> {
                    this.processReceivedError(msg, parent);
                })
                .matchEquals("timeout", msg -> {
                    this.terminateWithFailureResponse(parent, msg);
                }).build();
    }

    final PartialFunction<Object, BoxedUnit> parsing_waitingForHeader(
            final ActorRef parent,
            final Document document,
            WSClient ws,
            String firebaseSecret,
            String filepickerSecret,
            ImmutableList<TableMapping.TableCreator> creators,
            ImmutableList<TableMapping> mappers,
            XWPFDocument docx) {
        return ReceiveBuilder.
                match(ReportGeneratorActorProtocol.ParagraphFinded.class, msg -> {
                    Optional<IBodyElement> currentIBodyElementOpt = msg.rest.stream().findFirst();
                    if (currentIBodyElementOpt.isPresent()) {
                        IBodyElement currentIBodyElement = currentIBodyElementOpt.get();
                        if (currentIBodyElement instanceof XWPFParagraph ) {
                            XWPFParagraph current = (XWPFParagraph)currentIBodyElement;
                            Optional<TableMapping> matchedmapperopt = mappers
                                    .stream()
                                    .filter(i -> current.searchText(i.searchInPlan, new PositionInParagraph()) != null)
                                    .findFirst();
                            if (matchedmapperopt.isPresent()) {
                                this.context().become(
                                        this.parsing_waitingForTable(parent,
                                                document,
                                                ws,
                                                firebaseSecret,
                                                filepickerSecret,
                                                creators,
                                                mappers,
                                                matchedmapperopt.get(),
                                                docx
                                        )
                                );
                            }
                        }
                        this.self().tell(new ReportGeneratorActorProtocol.ParagraphFinded(new ImmutableList.Builder<IBodyElement>().addAll(msg.rest.stream().skip(1).collect(Collectors.toList())).build()), this.self());
                    } else {
                        this.self().tell(new ReportGeneratorActorProtocol.ParsingEnded(), this.self());
                    }
                })
                .match(ReportGeneratorActorProtocol.ParsingEnded.class, msg -> {
                    this.processParsingEnded(parent,document, ws,firebaseSecret, filepickerSecret, creators, docx);
                })
                .match(ReportGeneratorActorProtocol.RecievedError.class, msg -> {
                    this.processReceivedError(msg, parent);
                })
                .matchEquals("timeout", msg -> {
                    this.terminateWithFailureResponse(parent, msg);
                }).build();
    }

    final PartialFunction<Object, BoxedUnit> parsing_waitingForTable(
            final ActorRef parent,
            final Document document,
            final WSClient ws,
            final String firebaseSecret,
            final String filepickerSecret,
            final ImmutableList<TableMapping.TableCreator> creators,
            final ImmutableList<TableMapping> mappers,
            final TableMapping currentmapping,
            XWPFDocument docx) {
        return ReceiveBuilder.
                match(ReportGeneratorActorProtocol.ParagraphFinded.class, msg -> {
                    Optional<IBodyElement> currentIBodyElementOpt = msg.rest.stream().findFirst();
                    if (currentIBodyElementOpt.isPresent()) {
                        IBodyElement currentIBodyElement = currentIBodyElementOpt.get();
                        if (currentIBodyElement instanceof XWPFTable) {
                            XWPFTable current = (XWPFTable)currentIBodyElement;
                            this.context().become(
                                    this.parsing_waitingForHeader(parent,
                                            document,
                                            ws,
                                            firebaseSecret,
                                            filepickerSecret,
                                            new ImmutableList.Builder<TableMapping.TableCreator>().addAll(creators).add(currentmapping.map(current)).build(),
                                            mappers,
                                            docx
                                    )
                            );
                        }
                        this.self().tell(new ReportGeneratorActorProtocol.ParagraphFinded(new ImmutableList.Builder<IBodyElement>().addAll(msg.rest.stream().skip(1).collect(Collectors.toList())).build()), this.self());
                    } else {
                        this.self().tell(new ReportGeneratorActorProtocol.ParsingEnded(), this.self());
                    }
                })
                .match(ReportGeneratorActorProtocol.ParsingEnded.class, msg -> {
                    this.processParsingEnded(parent,document, ws,firebaseSecret, filepickerSecret, creators, docx);
                })
                .match(ReportGeneratorActorProtocol.RecievedError.class, msg -> {
                    this.processReceivedError(msg, parent);
                })
                .matchEquals("timeout", msg -> {
                    this.terminateWithFailureResponse(parent, msg);
                }).build();
    }

//    final PartialFunction<Object, BoxedUnit> waitingForSaveFile(
//            final ActorRef parent,
//            final Document document,
//            final WSClient ws,
//            final String firebaseSecret,
//            final String filepickerSecret) {
//        return ReceiveBuilder
//                .match(ReportGeneratorActorProtocol.FileSaved.class, msg -> {
//                    ActorRef self_c = this.self();
//                    this.getContext().become(this.waitingForFirebaseSave(parent, document, ws, firebaseSecret, filepickerSecret, msg.file));
//                    rootRef.child("documents")
//                            .push()
//                            .setValue(new Document(document.getCategoryUid(), msg.file, false, msg.file.getFilename(), ""), new Firebase.CompletionListener() {
//                                @Override
//                                public void onComplete(FirebaseError firebaseError, Firebase firebase) {
//                                    if (firebaseError == null) {
//                                        self_c.tell(new ReportGeneratorActorProtocol.FireBaseSaved(), self_c);
//                                    } else {
//                                        self_c.tell(new ReportGeneratorActorProtocol.RecievedError("firebase save error"), self_c);
//                                    }
//                                }
//                            });
//                })
//                .match(ReportGeneratorActorProtocol.RecievedError.class, msg -> {
//                    this.processReceivedError(msg, parent);
//                })
//                .matchEquals("timeout", msg -> {
//                    this.terminateWithFailureResponse(parent, msg);
//                }).build();
//    }
//
//    final PartialFunction<Object, BoxedUnit> waitingForFirebaseSave(
//            final ActorRef parent,
//            final Document document,
//            final WSClient ws,
//            final String firebaseSecret,
//            final String filepickerSecret,
//            final FilepickerFileDescriptor file) {
//        return ReceiveBuilder
//                .match(ReportGeneratorActorProtocol.FireBaseSaved.class, msg -> {
//                    this.terminateWithSuccessResponse(parent);
//                })
//                .match(ReportGeneratorActorProtocol.RecievedError.class, msg -> {
//                    this.removeFile(file.getUrl(), ws, filepickerSecret);
//                    this.processReceivedError(msg, parent);
//                })
//                .matchEquals("timeout", msg -> {
//                    //this.removeFile(file.getUrl(), ws, filepickerSecret);
//                    this.terminateWithFailureResponse(parent, msg);
//                }).build();
//    }

//    private void removeFile(String url, WSClient ws, String filepickerSecret) {
//        ws.url(url)
//                .setQueryParameter("key", filepickerSecret)
//                .delete();
//    }
//
    private void processParsingEnded(final ActorRef parent,
                                     final Document document,
                                     final WSClient ws,
                                     final String firebaseSecret,
                                     final String filepickerSecret,
                                     final ImmutableList<TableMapping.TableCreator> creators,
                                     final XWPFDocument olddocx) {
        try {
            XWPFDocument docx = new XWPFDocument();

            XWPFStyles newStyles = docx.createStyles();
            newStyles.setStyles(olddocx.getStyle());

            creators.forEach(c -> {
                XWPFParagraph header = docx.createParagraph();
                XWPFRun headerrun = header.createRun();
                headerrun.setText(c.mapper.header);

                c.create(docx);
            });
            ByteArrayOutputStream bos = new ByteArrayOutputStream();

            docx.write(bos);
            String filename = "Отчет " + df.format(new Date()) + ".docx";
            this.terminateWithSuccessResponse(parent, bos.toByteArray(), filename);
//            String body = Base64.getEncoder().encodeToString(bos.toByteArray());
//
//            WSRequest req = ws.url("https://www.filepicker.io/api/store/S3")
//                    .setQueryParameter("base64decode", "true")
//                    .setQueryParameter("mimetype", "application/vnd.openxmlformats-officedocument.wordprocessingml.document")
//                    .setQueryParameter("filename", "Отчет " + df.format(new Date()) + ".docx")
//                    .setQueryParameter("key", filepickerSecret);
//            this.getContext().become(this.waitingForSaveFile(parent, document, ws, firebaseSecret, filepickerSecret));
//            req.post(body)
//                .thenAccept(json -> {
//                    String respbody = json.getBody();
//                    try {
//                        ObjectMapper objectMapper = new ObjectMapper();
//                        FilepickerFileDescriptor filedescriptor = objectMapper.readValue(respbody, FilepickerFileDescriptor.class);
//                        this.self().tell(new ReportGeneratorActorProtocol.FileSaved(filedescriptor), this.self());
//                    } catch (Exception e) {
//                        this.self().tell(new ReportGeneratorActorProtocol.RecievedError("cannot save file to filepicker"), this.self());
//                    }
//                });
        } catch (Exception e) {
            this.self().tell(new ReportGeneratorActorProtocol.RecievedError("doc creating error"), this.self());
        }

    }

    private void processGenerateReportXml(ReportGeneratorActorProtocol.GenerateReportlXml msg) {
        this.rootRef = new Firebase(msg.firebaseUrl);
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
            this.self().tell(new ReportGeneratorActorProtocol.RecievedError("bad file"), this.self());
        }
    }

    private void processReceivedFile(ReportGeneratorActorProtocol.RecievedFile msg, ActorRef parent, WSClient ws, String firebaseSecret, String filepickerSecret, Document document) {
        if (msg.file.length < 1) {
            terminateWithFailureResponse(parent, "received 0 bytes from file storage");
        } else {
            ByteArrayInputStream bis = new ByteArrayInputStream(msg.file);
            try {
                XWPFDocument docx = new XWPFDocument(bis);
                ImmutableList<IBodyElement> stream = new ImmutableList.Builder<IBodyElement>()
                        .addAll(docx.getBodyElements())
                        .build();
                this.self().tell(new ReportGeneratorActorProtocol.ParagraphFinded(stream), this.self());
                this.getContext().become(this.parsing_waitingForHeader(
                        parent,
                        document,
                        ws,
                        firebaseSecret,
                        filepickerSecret,
                        new ImmutableList.Builder<TableMapping.TableCreator>().build(),
                        this.getMappings(),
                        docx)
                );
            } catch (Exception e) {
                this.self().tell(new ReportGeneratorActorProtocol.RecievedError("file parse as docx error"), this.self());
            }
            //this.terminateWithSuccessResponse(parent);
        }
    }

    private void terminateWithSuccessResponse(ActorRef parent, byte[] body, String filename) {
        parent.tell(new ReportGeneratorActorProtocol.GenerationSucceeded(body, filename), this.self());
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

        public final String searchInPlan;

        public final String header;

        private final BiConsumer<XWPFTable, XWPFTable> _map;

        public TableMapping(int indexInReport, String searchInPlan, String header, BiConsumer<XWPFTable, XWPFTable> map) {
            this.indexInReport = indexInReport;
            this.searchInPlan = searchInPlan;
            this.header = header;
            this._map = map;
        }

        public TableCreator map(XWPFTable table) {
            try {
                return new TableCreator(this, table);
            } catch (Exception e) {
                return null;
            }
        }

        public static class TableCreator {
            public final TableMapping mapper;
            public final XWPFTable table;

            public TableCreator(TableMapping mapper, XWPFTable table) {
                this.mapper = mapper;
                this.table = table;
            }

            public void create(XWPFDocument document) {
                XWPFTable newtable = document.createTable();
                CTTbl cttbl        = newtable.getCTTbl();
                CTTblPr pr         = cttbl.getTblPr();
                CTTblWidth tblW = pr.getTblW();
                tblW.setW(BigInteger.valueOf(5000));
                tblW.setType(STTblWidth.PCT);
                pr.setTblW(tblW);
                cttbl.setTblPr(pr);
                mapper._map.accept(this.table, newtable);
            }
        }
    }

    private ImmutableList<TableMapping> getMappings() {
        List<TableMapping> result = new ArrayList<>();

        // Таблица 2 – План работы научно-методического семинара «Информационно-измерительные и управляющие системы»	Таблица 1 – Сведения о работе научно-методического семинара «Информационно-измерительные и управляющие системы»
        result.add(new TableMapping(
                1,
                "Таблица 2",
                "Таблица 1 – Сведения о работе научно-методического семинара «Информационно-измерительные и управляющие системы»",
                (table, newtable) -> {
                    List<XWPFTableRow> rows = table.getRows();

                    // создаем первую строку
                    XWPFTableRow tableRowOne = newtable.getRow(0);
                    tableHeader(tableRowOne.getCell(0), "№ п/п");
                    tableHeader(tableRowOne.addNewTableCell(), "Дата проведения");
                    tableHeader(tableRowOne.addNewTableCell(), "Тема семинара");
                    tableHeader(tableRowOne.addNewTableCell(), "Рассмотренные вопросы");
                    tableHeader(tableRowOne.addNewTableCell(), "Докладчики");

                    //create second row
                    XWPFTableRow tableRowTwo = newtable.createRow();
                    tableHeader(tableRowTwo.getCell(0), "1");
                    tableHeader(tableRowTwo.getCell(1), "2");
                    tableHeader(tableRowTwo.getCell(2), "3");
                    tableHeader(tableRowTwo.getCell(3), "4");
                    tableHeader(tableRowTwo.getCell(4), "5");

                    for (int i = 1; i<rows.size(); ++i) {
                        XWPFTableRow currentrow = table.getRow(i);
                        XWPFTableRow newrow = newtable.createRow();

                        moveText(currentrow, 0, newrow, 0);
                        moveText(currentrow, 1, newrow, 1);
                        moveText(currentrow, 2, newrow, 2);
                        newrow.getCell(3).setText("");
                        moveText(currentrow, 3, newrow, 4);
                    }
                }
        ));
        return new ImmutableList.Builder<TableMapping>()
                .addAll(result)
                .build();
    }

    private void moveText(XWPFTableRow oldrow, int oldindex, XWPFTableRow newrow, int newindex) {
        XWPFTableCell newcell = newrow.getCell(newindex);
        if (newcell != null) {
            XWPFTableCell oldcell = oldrow.getCell(oldindex);
            if (oldcell != null) {
                newcell.setText(oldcell.getText());
                List<XWPFParagraph> oldps = oldcell.getParagraphs();
                List<XWPFParagraph> newps = newcell.getParagraphs();
                for (int k=0; k<oldps.size(); ++k) {
                    XWPFParagraph oldp = oldps.get(k);
                    XWPFParagraph newp = newps.size() <= k
                            ? newcell.addParagraph()
                            : newps.get(k);
                    this.cloneParagraph(newp, oldp);
                }
                oldcell.getParagraphs().forEach(p -> newcell.addParagraph(p));
            } else {
                newcell.setText("");
            }
        }
    }

    private static void cloneParagraph(XWPFParagraph clone, XWPFParagraph source) {
        CTPPr pPr = clone.getCTP().isSetPPr() ? clone.getCTP().getPPr() : clone.getCTP().addNewPPr();
        pPr.set(source.getCTP().getPPr());
        for (XWPFRun r : source.getRuns()) {
            XWPFRun nr = clone.createRun();
            cloneRun(nr, r);
        }
    }

    private static void cloneRun(XWPFRun clone, XWPFRun source) {
        //CTRPr rPr = clone.getCTR().isSetRPr() ? clone.getCTR().getRPr() : clone.getCTR().addNewRPr();
        //rPr.set(source.getCTR().getRPr());
        clone.setText(source.getText(0));
    }

    private void tableHeader(XWPFTableCell cell, String text) {
        //create paragraph
        XWPFParagraph paragraph = cell.getParagraphs().get(0);

        //Set alignment paragraph to RIGHT
        paragraph.setAlignment(ParagraphAlignment.CENTER);
        XWPFRun run=paragraph.createRun();
        run.setText(text);
    }
}