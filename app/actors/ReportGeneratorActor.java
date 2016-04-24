package actors;

import akka.event.Logging;
import akka.event.LoggingAdapter;
import com.firebase.client.DataSnapshot;
import com.firebase.client.Firebase;
import com.firebase.client.FirebaseError;
import com.firebase.client.ValueEventListener;
import models.*;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.xssf.usermodel.*;
import scala.concurrent.duration.Duration;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.text.DateFormat;
import java.text.SimpleDateFormat;
import java.util.*;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

public class ReportGeneratorActor extends UntypedActor {

    public static Props props() {
        return Props.create(ReportGeneratorActor.class);
    }

    private final LoggingAdapter log = Logging.getLogger(getContext().system(), this);
    private final DateFormat df = new SimpleDateFormat("d.MM");

    public ReportGeneratorActor() {

    }

    // dangerous state
    private String studentGroupUid;
    private String firebaseUrl;
    private String academicTermUid ;
    private String courseUid;


    private List<JournalDate> dates = null;
    private List<Student> students = null;
    private List<StudentMark> marks = null;
    private StudentGroup group = null;
    private Course course = null;
    private ActorRef initiator = null;
    private Cancellable timeoutMessage;


    public void onReceive(Object msg) throws Exception {
        if (msg instanceof JournalXmlCreatorActorProtocol.CreateJournalXml ) {
            JournalXmlCreatorActorProtocol.CreateJournalXml createJournalXml = (JournalXmlCreatorActorProtocol.CreateJournalXml)msg;

            this.studentGroupUid = createJournalXml.studentGroupUid;
            this.firebaseUrl = createJournalXml.firebaseUrl;
            this.academicTermUid = createJournalXml.academicTermUid;
            this.courseUid = createJournalXml.courseUid;
            initiator = sender();

            _requestDataFromFirebase();

            Scheduler scheduler = getContext().system().scheduler();
            timeoutMessage = scheduler.scheduleOnce(Duration.create(5, TimeUnit.MINUTES),
                    self(), "timeout", context().dispatcher(), null);

        } else if (msg instanceof JournalXmlCreatorActorProtocol.DatesRecieved ) {
            this.dates = ((JournalXmlCreatorActorProtocol.DatesRecieved)msg).dates;
            _tryStartXlsCreating();
        } else if (msg instanceof JournalXmlCreatorActorProtocol.MarksRecieved ) {
            this.marks = ((JournalXmlCreatorActorProtocol.MarksRecieved)msg).marks;
            _tryStartXlsCreating();
        } else if (msg instanceof JournalXmlCreatorActorProtocol.StudentsRecieved ) {
            this.students = ((JournalXmlCreatorActorProtocol.StudentsRecieved) msg).students;
            _tryStartXlsCreating();
        } else if (msg instanceof JournalXmlCreatorActorProtocol.StudentGroupRecieved ) {
            this.group = ((JournalXmlCreatorActorProtocol.StudentGroupRecieved) msg).group;
            _tryStartXlsCreating();
        } else if (msg instanceof JournalXmlCreatorActorProtocol.CourseRecieved ) {
            this.course = ((JournalXmlCreatorActorProtocol.CourseRecieved) msg).course;
            _tryStartXlsCreating();
        } else if (msg.equals("timeout")) {
            getContext().stop(self());
        } else {
            unhandled(msg);
        }
    }

    private void _tryStartXlsCreating() {
        Boolean canstart = this.dates != null
                && this.marks != null
                && this.students != null
                && this.group != null
                && this.course != null;
        if (canstart) {
            _createXls();
        }
    }

    private void _createXls() {
        log.info("creating xlsx...");
        ByteArrayOutputStream bos = new ByteArrayOutputStream();
        try {
            List<JournalDate> xlsx_dates = this.dates
                    .stream()
                    .sorted((a, b) -> a.getTimestamp().compareTo(b.getTimestamp()))
                    .collect(Collectors.toList());
            List<Student> xlsx_students = this.students
                    .stream()
                    .sorted((a, b) -> a.getName().compareTo(b.getName()))
                    .collect(Collectors.toList());
            Map<String, StudentMark> xlsx_marks = this.marks
                    .stream()
                    .collect(Collectors.toMap(StudentMark::getKey, item -> item));

            Workbook wb = new XSSFWorkbook();
            Map<String, CellStyle> styles = _createStyles(wb);
            Sheet sheet = wb.createSheet("Журнал");

            _createXlsFirstRow(sheet, styles, xlsx_dates);
            Integer i = 0;
            for (Student student : xlsx_students) {
                _createXlsRow(++i, sheet, styles, xlsx_dates, xlsx_marks, student);
            }

            // auto width
            Row row = wb.getSheetAt(0).getRow(0);
            for(int colNum = 0; colNum<row.getLastCellNum();colNum++) {
                wb.getSheetAt(0).autoSizeColumn(colNum);
            }

            wb.write(bos);
            byte[] bytes = bos.toByteArray();
            initiator.tell(
                    new JournalXmlCreatorActorProtocol.JournalXmlCreated(
                            this.academicTermUid,
                            this.courseUid,
                            this.studentGroupUid,
                            this.firebaseUrl,
                            bytes,
                            this.group.getName(),
                            this.course.getName()),
                    this.self()
            );
        } catch (Exception e) {
            log.error(e.toString());
            initiator.tell(
                    new JournalXmlCreatorActorProtocol.JournalXmlError(
                            this.academicTermUid,
                            this.courseUid,
                            this.studentGroupUid,
                            this.firebaseUrl,
                            e.toString()
                    ),
                    this.self()
            );
        } finally {
            try {
                bos.close();
            } catch (IOException e) {
                log.error(e.toString());
            }
            if (timeoutMessage != null && !timeoutMessage.isCancelled()) {
                timeoutMessage.cancel();
            }
            getContext().stop(self());
        }
    }

    private void _createXlsFirstRow(Sheet sheet, Map<String, CellStyle> styles, List<JournalDate> xlsx_dates) {
        Row headerRow = sheet.createRow(0);
        Cell cell = headerRow.createCell(0);
        cell.setCellValue("");
        cell.setCellStyle(styles.get("header"));
        Integer i = 0;
        Integer controlweekcounter = 0;
        for (JournalDate d: xlsx_dates) {
            if (d.getIsSum()) {
                Date javadate = new Date(d.getTimestamp());
                cell = headerRow.createCell(++i);
                cell.setCellValue("к.н. " + (++controlweekcounter).toString());
                cell.setCellStyle(styles.get("header_sum"));
            } else {
                Date javadate = new Date(d.getTimestamp());
                cell = headerRow.createCell(++i);
                cell.setCellValue(df.format(javadate));
                cell.setCellStyle(styles.get("header"));
            }
        }
        cell = headerRow.createCell(++i);
        cell.setCellValue("Итог");
        cell.setCellStyle(styles.get("header_sum"));
    }

    private void _createXlsRow(Integer rownum, Sheet sheet, Map<String, CellStyle> styles, List<JournalDate> xlsx_dates, Map<String, StudentMark> xlsx_marks, Student student) {
        Row headerRow = sheet.createRow(rownum);
        Cell cell = headerRow.createCell(0);
        cell.setCellValue(student.getName());
        cell.setCellStyle(styles.get("header"));
        Integer i = 0;
        Integer acc = 0;
        for (JournalDate d: xlsx_dates) {
            if (d.getIsSum()) {
                cell = headerRow.createCell(++i);
                cell.setCellValue(acc.toString());
                cell.setCellStyle(styles.get("cell_g"));
            } else {
                String dateUid = d.getKey();
                String studentUid = student.getKey();
                StudentMark mark = xlsx_marks.get(_createComplexKey(studentUid, dateUid));
                cell = headerRow.createCell(++i);
                if (mark != null && mark.getValue() > 0) {
                    acc = acc + mark.getValue();
                    cell.setCellValue(mark.getValue().toString());
                } else {
                    cell.setCellValue("");
                }
                cell.setCellStyle(styles.get("cell_normal"));
            }
        }
        cell = headerRow.createCell(++i);
        cell.setCellValue(acc.toString());
        cell.setCellStyle(styles.get("cell_g"));
    }

    private static Map<String, CellStyle> _createStyles(Workbook wb){
        Map<String, CellStyle> styles = new HashMap<String, CellStyle>();
        DataFormat df = wb.createDataFormat();

        CellStyle style;
        Font headerFont = wb.createFont();
        headerFont.setBoldweight(Font.BOLDWEIGHT_BOLD);
        style = _createBorderedStyle(wb);
        style.setAlignment(CellStyle.ALIGN_RIGHT);
        style.setFillForegroundColor(IndexedColors.LIGHT_CORNFLOWER_BLUE.getIndex());
        style.setFillPattern(CellStyle.SOLID_FOREGROUND);
        style.setFont(headerFont);
        styles.put("header", style);

        style = _createBorderedStyle(wb);
        style.setAlignment(CellStyle.ALIGN_RIGHT);
        style.setFillForegroundColor(IndexedColors.GREY_25_PERCENT.getIndex());
        style.setFillPattern(CellStyle.SOLID_FOREGROUND);
        style.setFont(headerFont);
        //style.setDataFormat(df.getFormat("d-mmm"));
        styles.put("header_sum", style);

        Font font1 = wb.createFont();
        font1.setBoldweight(Font.BOLDWEIGHT_BOLD);

        style = _createBorderedStyle(wb);
        style.setAlignment(CellStyle.ALIGN_RIGHT);
        style.setFont(font1);
        style.setFillForegroundColor(IndexedColors.GREY_25_PERCENT.getIndex());
        style.setFillPattern(CellStyle.SOLID_FOREGROUND);
        //style.setDataFormat(df.getFormat("d-mmm"));
        styles.put("cell_g", style);

        Font font2 = wb.createFont();
        font2.setColor(IndexedColors.BLUE.getIndex());
        font2.setBoldweight(Font.BOLDWEIGHT_BOLD);

        Font font3 = wb.createFont();
        font3.setFontHeightInPoints((short)14);
        font3.setColor(IndexedColors.DARK_BLUE.getIndex());
        font3.setBoldweight(Font.BOLDWEIGHT_BOLD);

        style = _createBorderedStyle(wb);
        style.setAlignment(CellStyle.ALIGN_RIGHT);
        style.setWrapText(true);
        styles.put("cell_normal", style);

        return styles;
    }

    private static CellStyle _createBorderedStyle(Workbook wb){
        CellStyle style = wb.createCellStyle();
        style.setBorderRight(CellStyle.BORDER_THIN);
        style.setRightBorderColor(IndexedColors.BLACK.getIndex());
        style.setBorderBottom(CellStyle.BORDER_THIN);
        style.setBottomBorderColor(IndexedColors.BLACK.getIndex());
        style.setBorderLeft(CellStyle.BORDER_THIN);
        style.setLeftBorderColor(IndexedColors.BLACK.getIndex());
        style.setBorderTop(CellStyle.BORDER_THIN);
        style.setTopBorderColor(IndexedColors.BLACK.getIndex());
        return style;
    }

    private void _requestDataFromFirebase() {
        Firebase rootRef = new Firebase(this.firebaseUrl);
        final ActorRef self_c = this.self();

        rootRef.child("course-dates")
                .orderByChild("studentGroupUid-courseUid")
                .equalTo(this._createComplexKey(this.studentGroupUid, this.courseUid))
                .addListenerForSingleValueEvent(new ValueEventListener() {
                    @Override
                    public void onDataChange(DataSnapshot querySnapshot) {
                        List<JournalDate> acc = new ArrayList<JournalDate>();
                        for (DataSnapshot dataSnapshot: querySnapshot.getChildren()) {
                            JournalDate item = dataSnapshot.getValue(JournalDate.class);
                            item.setKey(dataSnapshot.getKey());
                            acc.add(item);
                        }
                        self_c.tell(new JournalXmlCreatorActorProtocol.DatesRecieved(acc), self_c);
                    }
                    @Override
                    public void onCancelled(FirebaseError error) {
                        log.error("Error while retrieving course-dates: %s", error.toString());
                        self_c.tell(new JournalXmlCreatorActorProtocol.DatesRecieved(new ArrayList<JournalDate>()), self_c);
                    }
                });

        rootRef.child("students")
                .orderByChild("studentGroupUid")
                .equalTo(studentGroupUid)
                .addListenerForSingleValueEvent(new ValueEventListener() {
                    @Override
                    public void onDataChange(DataSnapshot querySnapshot) {
                        List<Student> acc = new ArrayList<Student>();
                        for (DataSnapshot dataSnapshot: querySnapshot.getChildren()) {
                            Student item = dataSnapshot.getValue(Student.class);
                            item.setKey(dataSnapshot.getKey());
                            acc.add(item);
                        }
                        self_c.tell(new JournalXmlCreatorActorProtocol.StudentsRecieved(acc), self_c);
                    }
                    @Override
                    public void onCancelled(FirebaseError error) {
                        log.error("Error while retrieving students: %s", error.toString());
                        self_c.tell(new JournalXmlCreatorActorProtocol.StudentsRecieved(new ArrayList<Student>()), self_c);
                    }
                });

        rootRef.child("student-marks")
                .orderByChild("studentGroupUid")
                .equalTo(studentGroupUid)
                .addListenerForSingleValueEvent(new ValueEventListener() {
                    @Override
                    public void onDataChange(DataSnapshot querySnapshot) {
                        List<StudentMark> acc = new ArrayList<StudentMark>();
                        for (DataSnapshot dataSnapshot: querySnapshot.getChildren()) {
                            StudentMark item = dataSnapshot.getValue(StudentMark.class);
                            item.setKey(dataSnapshot.getKey());
                            acc.add(item);
                        }
                        self_c.tell(new JournalXmlCreatorActorProtocol.MarksRecieved(acc), self_c);
                    }
                    @Override
                    public void onCancelled(FirebaseError error) {
                        log.error("Error while retrieving student-marks: %s", error.toString());
                        self_c.tell(new JournalXmlCreatorActorProtocol.MarksRecieved(new ArrayList<StudentMark>()), self_c);
                    }
                });

        rootRef.child("student-groups")
                .child(studentGroupUid)
                .addListenerForSingleValueEvent(new ValueEventListener() {
                    @Override
                    public void onDataChange(DataSnapshot dataSnapshot) {
                        StudentGroup item = dataSnapshot.getValue(StudentGroup.class);
                        item.setKey(dataSnapshot.getKey());
                        self_c.tell(new JournalXmlCreatorActorProtocol.StudentGroupRecieved(item), self_c);
                    }
                    @Override
                    public void onCancelled(FirebaseError error) {
                        log.error("Error while retrieving student-marks: %s", error.toString());
                        self_c.tell(new JournalXmlCreatorActorProtocol.MarksRecieved(new ArrayList<StudentMark>()), self_c);
                    }
                });

        rootRef.child("courses")
                .child(courseUid)
                .addListenerForSingleValueEvent(new ValueEventListener() {
                    @Override
                    public void onDataChange(DataSnapshot dataSnapshot) {
                        Course item = dataSnapshot.getValue(Course.class);
                        item.setKey(dataSnapshot.getKey());
                        self_c.tell(new JournalXmlCreatorActorProtocol.CourseRecieved(item), self_c);
                    }
                    @Override
                    public void onCancelled(FirebaseError error) {
                        log.error("Error while retrieving student-marks: %s", error.toString());
                        self_c.tell(new JournalXmlCreatorActorProtocol.MarksRecieved(new ArrayList<StudentMark>()), self_c);
                    }
                });
    }

    private String _createComplexKey(String a, String b) {
        return "("+ a + ", " + b +")";
    }
}