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

/**
 * Класс ответсвенный за генерацию отчета из плана при помощи
 * конечного автомата, реализованного при помощи актора
 * (см диаграмму report_generation_fsm)
 */
public class ReportGeneratorActor extends AbstractActor {

    /**
     * метод нужен для запуска данного актора из внешнего мира
     * @return
     */
    public static Props props() {
        return Props.create(ReportGeneratorActor.class);
    }

    /**
     * ссылка на логгер
     */
    private final LoggingAdapter log = Logging.getLogger(getContext().system(), this);

    /**
     * формат даты для имени файла
     */
    private final DateFormat df = new SimpleDateFormat("d.MM HH-mm-ss");

    /**
     * ссылка на базу данных
     */
    private Firebase rootRef;

    /**
     * конструктор
     * запускает таймер 5 минут - если за это время генерация не завершится
     * поток закроется принудительно
     */
    public ReportGeneratorActor() {
        Scheduler scheduler = getContext().system().scheduler();
        scheduler.scheduleOnce(Duration.create(5, TimeUnit.MINUTES),
                self(), "timeout", context().dispatcher(), null);

        // начало приема сообщений в состоянии "начальное состояние" (см диаграмму report_generation_fsm)
        receive(initialState());
    }

    /**
     * начальное состояние
     * (см диаграмму report_generation_fsm)
     * @return
     */
    final PartialFunction<Object, BoxedUnit> initialState() {
        return ReceiveBuilder.
                match(ReportGeneratorActorProtocol.GenerateReportlXml.class, msg -> {
                    // пришло сообщение "сгенерируй мне отчет"
                    // запускаем перерацию и переходим в состояние "ожидание файла от firebase"
                    processGenerateReportXml(msg);
                })
                .matchEquals("timeout", msg -> {
                    // сообщение "сгенерируй мне отчет" и не пришло от запустившего потока - тушим этот поток
                    this.terminateSilently();
                }).build();
    }

    /**
     * состояние "ожидание файла от firebase"
     * (см диаграмму report_generation_fsm)
     * @param parent
     * @param ws
     * @param firebaseSecret
     * @param filepickerSecret
     * @return
     */
    final PartialFunction<Object, BoxedUnit> waitingForFirebaseDocument(final ActorRef parent, WSClient ws, String firebaseSecret, String filepickerSecret) {
        return ReceiveBuilder.
                match(ReportGeneratorActorProtocol.RecievedDocument.class, msg -> {
                    // пришел файл от firebase - запрашиваем тело из filepicker
                    // и переходим в состояние "жду тело файла"
                    this.processReceivedDocument(msg, parent, ws, firebaseSecret, filepickerSecret);
                })
                .match(ReportGeneratorActorProtocol.RecievedError.class, msg -> {
                    // пришла ошибка от firebase - отправляем его в контроллер и закрываемся
                    this.processReceivedError(msg, parent);
                })
                .matchEquals("timeout", msg -> {
                    // сообщение от firebase так и не пришло - шлем ошибку в контроллер и закрываемся
                    this.terminateWithFailureResponse(parent, msg);
                }).build();
    }

    /**
     * Состояние "жду тело файла"
     * (см диаграмму report_generation_fsm)
     * @param parent
     * @param document
     * @param ws
     * @param firebaseSecret
     * @param filepickerSecret
     * @return
     */
    final PartialFunction<Object, BoxedUnit> waitingForFilepickerDocument(final ActorRef parent, final Document document, WSClient ws, String firebaseSecret, String filepickerSecret) {
        return ReceiveBuilder.
                match(ReportGeneratorActorProtocol.RecievedFile.class, msg -> {
                    // запуск парсинга файла и переход в состояние "ожидается заголовок" или "ожидаестя таблица"
                    this.processReceivedFile(msg, parent, ws, firebaseSecret, filepickerSecret, document);
                })
                .match(ReportGeneratorActorProtocol.RecievedError.class, msg -> {
                    // пришла ошибка - перенаправляем ошибку в контроллер и закрываемся
                    this.processReceivedError(msg, parent);
                })
                .matchEquals("timeout", msg -> {
                    // пришел маймаут - шлем ошибку в контроллер и закрываемся
                    this.terminateWithFailureResponse(parent, msg);
                }).build();
    }

    /**
     * "ожидается заголовок"
     * (см диаграмму report_generation_fsm)
     *
     * В этом состоянии поочередно перебираем элементы документа пока не найдем один из заголовков
     * Если заголовок найден - перехоидм в состояние "ожадание таблицы"
     * @param parent
     * @param document
     * @param ws
     * @param firebaseSecret
     * @param filepickerSecret
     * @param creators
     * @param mappers
     * @param docx
     * @return
     */
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
                    // очередной элемент - параграф
                    // проверяем следующий
                    // нашли параграф - остаемся в данном состоянии и шлем себе "параграф найден"
                    // нашли заголовое - переходим в ожидается таблица и шлем себе "параграф найден"
                    // конец файла - шлем себе сообщение "конец файла"
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
                    // если конец файла - переходим в "конец парсинга" и начинаем собирать отчет
                    this.processParsingEnded(parent,document, ws,firebaseSecret, filepickerSecret, creators, docx);
                })
                .match(ReportGeneratorActorProtocol.RecievedError.class, msg -> {
                    // чтот прлохое случилось - перенаправляем ошибку в контроллер и закрываемся
                    this.processReceivedError(msg, parent);
                })
                .matchEquals("timeout", msg -> {
                    // пришел таймаут - шлем ошибку в контроллер и закрываемся
                    this.terminateWithFailureResponse(parent, msg);
                }).build();
    }

    /**
     * состояние "ожидается таблица"
     * (см диаграмму report_generation_fsm)
     *
     * переходим в него если был найден заколовок и ждем элемент таблицу чтобы сохранить
     * @param parent
     * @param document
     * @param ws
     * @param firebaseSecret
     * @param filepickerSecret
     * @param creators
     * @param mappers
     * @param currentmapping
     * @param docx
     * @return
     */
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
                    // очередной элемент - параграф
                    // проверяем следующий
                    // нашли параграф - остаемся в данном состоянии и шлем себе "параграф найден"
                    // нашли таблицу - сохраняем и переходив в состояние "ожидается параграф" с сообщением "параграф найден"
                    // конец файла - шлем себе сообщение "конец файла"
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
                    // если конец файла - переходим в "конец парсинга" и начинаем собирать отчет
                    this.processParsingEnded(parent,document, ws,firebaseSecret, filepickerSecret, creators, docx);
                })
                .match(ReportGeneratorActorProtocol.RecievedError.class, msg -> {
                    // произошла ошибка - перенаправляем в контроллер и закрываемся
                    this.processReceivedError(msg, parent);
                })
                .matchEquals("timeout", msg -> {
                    // пришел таймаут - шлем контроллеру ошибку и тушимся
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

            creators.stream().sorted((a, b) -> a.mapper.indexInReport - b.mapper.indexInReport).forEach(c -> {
                XWPFParagraph emptyline = docx.createParagraph();
                XWPFRun emptylinerun = emptyline.createRun();
                emptylinerun.setText("");

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

                // auto adjust table size
                CTTbl cttbl        = newtable.getCTTbl();
                CTTblPr pr         = cttbl.getTblPr();
                CTTblWidth tblW = pr.getTblW();
                tblW.setW(BigInteger.valueOf(5000));
                tblW.setType(STTblWidth.PCT);
                pr.setTblW(tblW);
                cttbl.setTblPr(pr);

                // borders
                CTTblBorders borders = pr.addNewTblBorders();
                setupTableBorder(borders.addNewBottom());
                setupTableBorder(borders.addNewInsideH());
                setupTableBorder(borders.addNewInsideV());
                setupTableBorder(borders.addNewLeft());
                setupTableBorder(borders.addNewRight());
                setupTableBorder(borders.addNewTop());

                mapper._map.accept(this.table, newtable);
            }
        }

    }

    private static void setupTableBorder(CTBorder border) {
        border.setVal(STBorder.SINGLE);
        border.setColor("000000");
        border.setSz(BigInteger.valueOf(2));
    }

    /**
     * Определяет методику генерации таблиц
     * @return
     */
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

                    for (int i = 2; i<rows.size(); ++i) {
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

        // Таблица 3 –План проведения открытых лекций	Таблица 2 – Сведения о проведенных открытых лекциях
        result.add(new TableMapping(
                2,
                "Таблица 3",
                "Таблица 2 – Сведения о проведенных открытых лекциях",
                (table, newtable) -> {
                    List<XWPFTableRow> rows = table.getRows();

                    // создаем первую строку
                    XWPFTableRow tableRowOne = newtable.getRow(0);
                    tableHeader(tableRowOne.getCell(0), "Ф.И.О. преподавателя");
                    tableHeader(tableRowOne.addNewTableCell(), "Тема лекции");
                    tableHeader(tableRowOne.addNewTableCell(), "Дата проведения");
                    tableHeader(tableRowOne.addNewTableCell(), "Ф.И.О. преподавателей посетивших лекцию");
                    tableHeader(tableRowOne.addNewTableCell(), "Краткий отзыв");

                    //create second row
                    XWPFTableRow tableRowTwo = newtable.createRow();
                    tableHeader(tableRowTwo.getCell(0), "1");
                    tableHeader(tableRowTwo.getCell(1), "2");
                    tableHeader(tableRowTwo.getCell(2), "3");
                    tableHeader(tableRowTwo.getCell(3), "4");
                    tableHeader(tableRowTwo.getCell(4), "5");

                    for (int i = 2; i<rows.size(); ++i) {
                        XWPFTableRow currentrow = table.getRow(i);
                        XWPFTableRow newrow = newtable.createRow();

                        moveText(currentrow, 0, newrow, 0);
                        moveText(currentrow, 1, newrow, 1);
                        moveText(currentrow, 2, newrow, 2);
                        newrow.getCell(3).setText("");
                        newrow.getCell(4).setText("");
                    }
                }
        ));

        // Таблица 4 – План подготовки учебной и учебно-методической литературы	Таблица 3– Сведения об издании учебно-методической литературы
        result.add(new TableMapping(
                3,
                "Таблица 4",
                "Таблица 3 – Сведения об издании учебно-методической литературы",
                (table, newtable) -> {
                    List<XWPFTableRow> rows = table.getRows();

                    // создаем первую строку
                    XWPFTableRow tableRowOne = newtable.getRow(0);
                    tableHeader(tableRowOne.getCell(0), "Наименование разработки");
                    tableHeader(tableRowOne.addNewTableCell(), "Вид разработки (учебник, уч. пособие, мет. указание)");
                    tableHeader(tableRowOne.addNewTableCell(), "Автор(ы) разработки");
                    tableHeader(tableRowOne.addNewTableCell(), "Издательство, год издания"
                    );
                    tableHeader(tableRowOne.addNewTableCell(), "Объем, п.л."
                    );

                    //create second row
                    XWPFTableRow tableRowTwo = newtable.createRow();
                    tableHeader(tableRowTwo.getCell(0), "1");
                    tableHeader(tableRowTwo.getCell(1), "2");
                    tableHeader(tableRowTwo.getCell(2), "3");
                    tableHeader(tableRowTwo.getCell(3), "4");
                    tableHeader(tableRowTwo.getCell(4), "5");

                    for (int i = 2; i<rows.size(); ++i) {
                        XWPFTableRow currentrow = table.getRow(i);
                        XWPFTableRow newrow = newtable.createRow();

                        moveText(currentrow, 1, newrow, 0);
                        newrow.getCell(1).setText("");
                        moveText(currentrow, 2, newrow, 2);
                        newrow.getCell(3).setText("");
                        moveText(currentrow, 3, newrow, 4);
                    }
                }
        ));

        // Таблица 5 – План разработки учебно-методических комплексов дисциплин (ЭУМКД)* 	Таблица 5 – Сведения о разработанных и размещенных в файловом хранилище ЭУМКД по дисциплинам, закрепленным за кафедрой
        result.add(new TableMapping(
                4,
                "Таблица 5",
                "Таблица 5 – Сведения о разработанных и размещенных в файловом хранилище ЭУМКД по дисциплинам, закрепленным за кафедрой",
                (table, newtable) -> {
                    List<XWPFTableRow> rows = table.getRows();

                    // создаем первую строку
                    XWPFTableRow tableRowOne = newtable.getRow(0);
                    tableHeader(tableRowOne.getCell(0), "№ п/п");
                    tableHeader(tableRowOne.addNewTableCell(), "Код ОКСО (с кодом квалификации)");
                    tableHeader(tableRowOne.addNewTableCell(), "Наименование образовательной программы");
                    tableHeader(tableRowOne.addNewTableCell(), "Наименование дисциплины по учебному плану");
                    tableHeader(tableRowOne.addNewTableCell(), "Курс и факультет, для которых разработан ЭУМКД");
                    tableHeader(tableRowOne.addNewTableCell(), "Разработчики");
                    tableHeader(tableRowOne.addNewTableCell(), "Размещение в файловом хранилище университета");
                    tableHeader(tableRowOne.addNewTableCell(), "Общее число дисциплин, читаемых кафедрой/из них, размещенных в файловом хранилище");

                    //create second row
                    XWPFTableRow tableRowTwo = newtable.createRow();
                    tableHeader(tableRowTwo.getCell(0), "1");
                    tableHeader(tableRowTwo.getCell(1), "2");
                    tableHeader(tableRowTwo.getCell(2), "3");
                    tableHeader(tableRowTwo.getCell(3), "4");
                    tableHeader(tableRowTwo.getCell(4), "5");
                    tableHeader(tableRowTwo.getCell(5), "6");
                    tableHeader(tableRowTwo.getCell(6), "7");
                    tableHeader(tableRowTwo.getCell(7), "8");

                    for (int i = 2; i<rows.size(); ++i) {
                        XWPFTableRow currentrow = table.getRow(i);
                        XWPFTableRow newrow = newtable.createRow();

                        moveText(currentrow, 0, newrow, 0);
                        newrow.getCell(1).setText("");
                        moveText(currentrow, 1, newrow, 2);
                        moveText(currentrow, 2, newrow, 3);
                        moveText(currentrow, 3, newrow, 4);
                        moveText(currentrow, 4, newrow, 5);
                        newrow.getCell(6).setText("");
                        newrow.getCell(7).setText("");
                    }
                }
        ));

        // Таблица 7 - План проведения внутривузовских олимпиад и конкурсов ВКР	Таблица 9 – Сведения об участии студентов во внутривузовских олимпиадах и конкурсах ВКР
        result.add(new TableMapping(
                5,
                "Таблица 7",
                "Таблица 9 – Сведения об участии студентов во внутривузовских олимпиадах и конкурсах ВКР",
                (table, newtable) -> {
                    List<XWPFTableRow> rows = table.getRows();

                    // создаем первую строку
                    XWPFTableRow tableRowOne = newtable.getRow(0);
                    tableHeader(tableRowOne.getCell(0), "Наименование олимпиады, конкурса, проведенных кафедрой");
                    tableHeader(tableRowOne.addNewTableCell(), "Дата проведения");
                    tableHeader(tableRowOne.addNewTableCell(), "Число студентов, принявших участие в олимпиаде, конкурсе");
                    tableHeader(tableRowOne.addNewTableCell(), "Ответственный по кафедре за проведение олимпиады");
                    tableHeader(tableRowOne.addNewTableCell(), "Результаты участия (список победителей и занятые места)");

                    //create second row
                    XWPFTableRow tableRowTwo = newtable.createRow();
                    tableHeader(tableRowTwo.getCell(0), "1");
                    tableHeader(tableRowTwo.getCell(1), "2");
                    tableHeader(tableRowTwo.getCell(2), "3");
                    tableHeader(tableRowTwo.getCell(3), "4");
                    tableHeader(tableRowTwo.getCell(4), "5");

                    for (int i = 2; i<rows.size(); ++i) {
                        XWPFTableRow currentrow = table.getRow(i);
                        XWPFTableRow newrow = newtable.createRow();

                        moveText(currentrow, 0, newrow, 0);
                        moveText(currentrow, 1, newrow, 1);
                        newrow.getCell(2).setText("");
                        moveText(currentrow, 2, newrow, 3);
                        newrow.getCell(4).setText("");
                    }
                }
        ));

        // Таблица 8 - План участия студентов в олимпиадах и конкурсах ВКР, проводимых вне университета	Таблица 10 – Сведения об участии студентов в олимпиадах и конкурсах ВКР, проводимых вне университета
        result.add(new TableMapping(
                6,
                "Таблица 8",
                "Таблица 10 – Сведения об участии студентов в олимпиадах и конкурсах ВКР, проводимых вне университета",
                (table, newtable) -> {
                    List<XWPFTableRow> rows = table.getRows();

                    // создаем первую строку
                    XWPFTableRow tableRowOne = newtable.getRow(0);
                    tableHeader(tableRowOne.getCell(0), "Наименование олимпиады, конкурса в которых приняла участие кафедра");
                    tableHeader(tableRowOne.addNewTableCell(), "Дата проведения, место проведения (организация, город)");
                    tableHeader(tableRowOne.addNewTableCell(), "Число студентов, принявших участие в олимпиаде, конкурсе");
                    tableHeader(tableRowOne.addNewTableCell(), "Руководитель  (руководители) команд, принимавших участие в олимпиаде");
                    tableHeader(tableRowOne.addNewTableCell(), "Результаты участия (список победителей и занятые места)");

                    //create second row
                    XWPFTableRow tableRowTwo = newtable.createRow();
                    tableHeader(tableRowTwo.getCell(0), "1");
                    tableHeader(tableRowTwo.getCell(1), "2");
                    tableHeader(tableRowTwo.getCell(2), "3");
                    tableHeader(tableRowTwo.getCell(3), "4");
                    tableHeader(tableRowTwo.getCell(4), "5");

                    for (int i = 2; i<rows.size(); ++i) {
                        XWPFTableRow currentrow = table.getRow(i);
                        XWPFTableRow newrow = newtable.createRow();

                        moveText(currentrow, 0, newrow, 0);
                        moveText(currentrow, 1, newrow, 1);
                        newrow.getCell(2).setText("");
                        moveText(currentrow, 4, newrow, 3);
                        newrow.getCell(4).setText("");
                    }
                }
        ));

        // Таблица 9 – План профориентационной работы	Таблица 11 – Сведения о проведенной профориентационной работе
        result.add(new TableMapping(
                7,
                "Таблица 9",
                "Таблица 11 – Сведения о проведенной профориентационной работе",
                (table, newtable) -> {
                    List<XWPFTableRow> rows = table.getRows();

                    // создаем первую строку
                    XWPFTableRow tableRowOne = newtable.getRow(0);
                    tableHeader(tableRowOne.getCell(0), "№ п/п");
                    tableHeader(tableRowOne.addNewTableCell(), "Наименование мероприятия");
                    tableHeader(tableRowOne.addNewTableCell(), "Место и дата проведения");
                    tableHeader(tableRowOne.addNewTableCell(), "Исполнители");

                    //create second row
                    XWPFTableRow tableRowTwo = newtable.createRow();
                    tableHeader(tableRowTwo.getCell(0), "1");
                    tableHeader(tableRowTwo.getCell(1), "2");
                    tableHeader(tableRowTwo.getCell(2), "3");
                    tableHeader(tableRowTwo.getCell(3), "4");

                    for (int i = 2; i<rows.size(); ++i) {
                        XWPFTableRow currentrow = table.getRow(i);
                        XWPFTableRow newrow = newtable.createRow();

                        moveText(currentrow, 0, newrow, 0);
                        moveText(currentrow, 1, newrow, 1);
                        moveText(currentrow, 2, newrow, 2);
                        moveText(currentrow, 3, newrow, 3);
                    }
                }
        ));

        // Таблица 10 – План повышения квалификации ППС кафедры	Таблица 12 – Сведения о повышении квалификации ППС
        result.add(new TableMapping(
                8,
                "Таблица 10",
                "Таблица 12 – Сведения о повышении квалификации ППС",
                (table, newtable) -> {
                    List<XWPFTableRow> rows = table.getRows();

                    // создаем первую строку
                    XWPFTableRow tableRowOne = newtable.getRow(0);
                    tableHeader(tableRowOne.getCell(0), "ФИО преподавателя, должность");
                    tableHeader(tableRowOne.addNewTableCell(), "Направление повышения квалификации*");
                    tableHeader(tableRowOne.addNewTableCell(), "Наименование программы");
                    tableHeader(tableRowOne.addNewTableCell(), "Дата");
                    tableHeader(tableRowOne.addNewTableCell(), "Сроки освоения **");
                    tableHeader(tableRowOne.addNewTableCell(), "Организация");
                    tableHeader(tableRowOne.addNewTableCell(), "Документ о повышении квалификации (реквизиты)***");

                    //create second row
                    XWPFTableRow tableRowTwo = newtable.createRow();
                    tableHeader(tableRowTwo.getCell(0), "1");
                    tableHeader(tableRowTwo.getCell(1), "2");
                    tableHeader(tableRowTwo.getCell(2), "3");
                    tableHeader(tableRowTwo.getCell(3), "4");
                    tableHeader(tableRowTwo.getCell(4), "5");
                    tableHeader(tableRowTwo.getCell(5), "6");
                    tableHeader(tableRowTwo.getCell(6), "7");

                    for (int i = 2; i<rows.size(); ++i) {
                        XWPFTableRow currentrow = table.getRow(i);
                        XWPFTableRow newrow = newtable.createRow();

                        moveText(currentrow, 0, newrow, 0);
                        moveText(currentrow, 1, newrow, 1);
                        moveText(currentrow, 2, newrow, 2);
                        moveText(currentrow, 3, newrow, 3);
                        newrow.getCell(4).setText("");
                        moveText(currentrow, 4, newrow, 5);
                        newrow.getCell(6).setText("");
                    }
                }
        ));

        // Таблица 11 – План внедрения новых и модернизации действующих лабораторных работ	Таблица 13 – Сведения о внедрении новых и модернизации действующих лабораторных работ
        result.add(new TableMapping(
                9,
                "Таблица 11",
                "Таблица 13 – Сведения о внедрении новых и модернизации действующих лабораторных работ",
                (table, newtable) -> {
                    List<XWPFTableRow> rows = table.getRows();

                    // создаем первую строку
                    XWPFTableRow tableRowOne = newtable.getRow(0);
                    tableHeader(tableRowOne.getCell(0), "Наименование дисциплины по учебному плану");
                    tableHeader(tableRowOne.addNewTableCell(), "Наименование лабораторной работы");
                    tableHeader(tableRowOne.addNewTableCell(), "Введена или модернизирована");
                    tableHeader(tableRowOne.addNewTableCell(), "Дата введения в учебный процесс");

                    //create second row
                    XWPFTableRow tableRowTwo = newtable.createRow();
                    tableHeader(tableRowTwo.getCell(0), "1");
                    tableHeader(tableRowTwo.getCell(1), "2");
                    tableHeader(tableRowTwo.getCell(2), "3");
                    tableHeader(tableRowTwo.getCell(3), "4");

                    for (int i = 2; i<rows.size(); ++i) {
                        XWPFTableRow currentrow = table.getRow(i);
                        XWPFTableRow newrow = newtable.createRow();

                        moveText(currentrow, 0, newrow, 0);
                        moveText(currentrow, 1, newrow, 1);
                        moveText(currentrow, 2, newrow, 2);
                        moveText(currentrow, 3, newrow, 3);
                    }
                }
        ));

        // Таблица 12 – План приобретения нового оборудования, ТСО, средств ВТ	Таблица 14 – Сведения о приобретении и введении в эксплуатацию нового оборудования, ТСО, средств ВТ
        result.add(new TableMapping(
                10,
                "Таблица 12",
                "Таблица 14 – Сведения о приобретении и введении в эксплуатацию нового оборудования, ТСО, средств ВТ",
                (table, newtable) -> {
                    List<XWPFTableRow> rows = table.getRows();

                    // создаем первую строку
                    XWPFTableRow tableRowOne = newtable.getRow(0);
                    tableHeader(tableRowOne.getCell(0), "Наименование оборудования");
                    tableHeader(tableRowOne.addNewTableCell(), "Назначение");
                    tableHeader(tableRowOne.addNewTableCell(), "Стоимость и источник финансирования");
                    tableHeader(tableRowOne.addNewTableCell(), "Дата ввода в эксплуатацию");

                    //create second row
                    XWPFTableRow tableRowTwo = newtable.createRow();
                    tableHeader(tableRowTwo.getCell(0), "1");
                    tableHeader(tableRowTwo.getCell(1), "2");
                    tableHeader(tableRowTwo.getCell(2), "3");
                    tableHeader(tableRowTwo.getCell(3), "4");

                    for (int i = 2; i<rows.size(); ++i) {
                        XWPFTableRow currentrow = table.getRow(i);
                        XWPFTableRow newrow = newtable.createRow();

                        moveText(currentrow, 0, newrow, 0);
                        moveText(currentrow, 1, newrow, 1);
                        moveText(currentrow, 2, newrow, 2);
                        moveText(currentrow, 3, newrow, 3);
                    }
                }
        ));

        // Таблица 13 – Другая учебно-методическая и организационная работа	Таблица 15 – Другая учебно-методическая и организационная работа
        result.add(new TableMapping(
                11,
                "Таблица 13",
                "Таблица 15 – Другая учебно-методическая и организационная работа",
                (table, newtable) -> {
                    List<XWPFTableRow> rows = table.getRows();

                    // создаем первую строку
                    XWPFTableRow tableRowOne = newtable.getRow(0);
                    tableHeader(tableRowOne.getCell(0), "№ п/п");
                    tableHeader(tableRowOne.addNewTableCell(), "Наименование мероприятия*");
                    tableHeader(tableRowOne.addNewTableCell(), "Место и дата проведения");
                    tableHeader(tableRowOne.addNewTableCell(), "Ответственный за организацию и проведение");
                    tableHeader(tableRowOne.addNewTableCell(), "Число участников");

                    //create second row
                    XWPFTableRow tableRowTwo = newtable.createRow();
                    tableHeader(tableRowTwo.getCell(0), "1");
                    tableHeader(tableRowTwo.getCell(1), "2");
                    tableHeader(tableRowTwo.getCell(2), "3");
                    tableHeader(tableRowTwo.getCell(3), "4");
                    tableHeader(tableRowTwo.getCell(3), "5");

                    for (int i = 2; i<rows.size(); ++i) {
                        XWPFTableRow currentrow = table.getRow(i);
                        XWPFTableRow newrow = newtable.createRow();

                        moveText(currentrow, 0, newrow, 0);
                        moveText(currentrow, 1, newrow, 1);
                        moveText(currentrow, 2, newrow, 2);
                        moveText(currentrow, 3, newrow, 3);
                        newrow.getCell(4).setText("");
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