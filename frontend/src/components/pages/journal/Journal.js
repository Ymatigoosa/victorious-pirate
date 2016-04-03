import React from 'react';
import reactMixin from 'react-mixin';
import ReactFireMixin from 'reactfire';
import Highlighter from 'components/Highlighter';
import List from 'material-ui/lib/lists/list';
import ListItem from 'material-ui/lib/lists/list-item';
import Divider from 'material-ui/lib/divider';
import Subheader from 'material-ui/lib/Subheader';
import Avatar from 'material-ui/lib/avatar';
import * as Colors from 'material-ui/lib/styles/colors';
import IconButton from 'material-ui/lib/icon-button';
import MoreVertIcon from 'material-ui/lib/svg-icons/navigation/more-vert';
import AddCircleIcon from 'material-ui/lib/svg-icons/content/add-circle';
import IconMenu from 'material-ui/lib/menus/icon-menu';
import MenuItem from 'material-ui/lib/menus/menu-item';
import ActionGrade from 'material-ui/lib/svg-icons/action/grade';
import CircularProgress from 'material-ui/lib/circular-progress';
import RaisedButton from 'material-ui/lib/raised-button';
import FlatButton from 'material-ui/lib/flat-button';
import Dialog from 'material-ui/lib/dialog';
import Checkbox from 'material-ui/lib/checkbox';
import DatePicker from 'material-ui/lib/date-picker/date-picker';
import Table from 'material-ui/lib/table/table';
import TableHeaderColumn from 'material-ui/lib/table/table-header-column';
import TableRow from 'material-ui/lib/table/table-row';
import TableHeader from 'material-ui/lib/table/table-header';
import TableRowColumn from 'material-ui/lib/table/table-row-column';
import TableBody from 'material-ui/lib/table/table-body';

import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { push, replace, go, goForward, goBack } from 'react-router-redux';
import TextField from 'material-ui/lib/text-field';
import Breadcrumbs from 'components/Breadcrumbs';
import { Link } from 'react-router';
import ToggleDisplay from 'react-toggle-display';

const studentcellstyle = {
  textAlign: 'right'
};
const iconButtonElement = (
  <IconButton
    touch={true}
  >
    <MoreVertIcon color={Colors.grey400} />
  </IconButton>
);

class Journal extends React.Component {
  constructor(props) {
    super(props);

    this.ref = this.props.firebaseService.ref;

    this.datesWriteRef = this.props.firebaseService.ref
      .child('course-dates');

    this.datesReadRef = this.datesWriteRef
      .orderByChild('studentGroupUid-courseUid')
      .equalTo(this.createDateForeignKey(this.props.params.studentGroupUid, this.props.params.courseUid));

    this.studentsWriteRef = this.props.firebaseService.ref
      .child('students');

    this.studentsReadRef = this.studentsWriteRef
      .orderByChild('studentGroupUid')
      .equalTo(this.props.params.studentGroupUid);

    this.studentMarksWriteRef = this.props.firebaseService.ref
      .child('student-marks');

    this.studentMarksReadRef = this.studentMarksWriteRef
      .orderByChild('studentGroupUid')
      .equalTo(this.props.params.studentGroupUid);

    this.state = {
      dates: null,
      students: null,
      marks: null,
      studentDialogMode: 'hide',
      studentDialogName: '',
      studentDialogItem: null,
      dateDialogMode: 'hide',
      dateDialogDate: null,
      dateDialogIsSum: false,
      dateDialogItem: null,
      academicTerm: null,
      course: null,
      studentGroup: null
    };
  }
  componentWillMount() {
    this.bindAsArray(this.datesReadRef, 'dates', (error) => console.error(error));
    this.bindAsArray(this.studentsReadRef, 'students', (error) => console.error(error));
    this.bindAsArray(this.studentMarksReadRef, 'marks', (error) => console.error(error));

    this.bindAsObject(this.ref.child('academic-terms').child(this.props.params.academicTermUid), 'academicTerm', (error) => console.error(error));
    this.bindAsObject(this.ref.child('courses').child(this.props.params.courseUid), 'course', (error) => console.error(error));
    this.bindAsObject(this.ref.child('student-groups').child(this.props.params.studentGroupUid), 'studentGroup', (error) => console.error(error));
  }
  createDateForeignKey(studentGroupUid, courseUid) {
    return `(${studentGroupUid}, ${courseUid})`;
  }
  componentWillUnmount() {
    //this.unbind('items');
  }



  // students
  onStudentDialogNameChange(e) {
    this.setState({studentDialogName: e.target.value})
  }
  createMarksForEmptyStudent(newStudentKey) {
    // obsolete
    const { dates } = this.state;
    return dates.filter((i) => i.IsSum === false).reduce((result, date) =>{
      const newkey = this.studentMarksWriteRef.push().key();
      result[newkey] = {
        studentGroupUid: this.props.params.studentGroupUid,
        courseUid: this.props.params.courseUid,
        dateUid: date['.key'],
        studentUid: newStudentKey,
        value: 0
      };
      return result;
    }, {});
  }
  createMarksForRemoveStudent(studentKey) {
    // obsolete
    const { marks } = this.state;
    return marks.filter((i) => i.studentUid === studentKey).reduce((result, mark) =>{
      const k = mark['.key'];
      result[k] = null;
      return result
    }, {});
  }
  onStudentCreate() {
    this.studentsWriteRef.push({
      name: this.state.studentDialogName,
      studentGroupUid: this.props.params.studentGroupUid
    });
    this.onStudentDialogClose();
  }
  onStudentSave(item) { // тут был key сейчас item
    const key = item['.key'];
    this.studentsWriteRef.child(key).set({
      name: this.state.studentDialogName,
      studentGroupUid: item.studentGroupUid
    });
    this.onStudentDialogClose(); // закончил тут
  }
  onStudentDelete(item) {
    const key = item['.key'];
    if (confirm(`Вы действительно хотите удалить студента "${item.name}"?\nОтменить это действие невозможно!`)) {
      var update = {
        'students': {
          [key]: null
        },
        'student-marks': this.createMarksForRemoveStudent(key)
      };
      console.log(update);
      this.studentsWriteRef.update(update['students']);
      this.studentMarksWriteRef.update(update['student-marks']);
      this.onStudentDialogClose();
    }
  }
  onStudentDialogClose() {
    this.setState({
      studentDialogName: '',
      studentDialogMode: 'hide',
      studentDialogItem: null
    })
  }
  onStudentDialogOpenCreate() {
    this.setState({
      studentDialogName: '',
      studentDialogMode: 'create'
    })
  }
  onStudentDialogOpenEdit(item) {
    this.setState({
      studentDialogName: item.name,
      studentDialogMode: 'edit',
      studentDialogItem: item
    })
  }



  // dates
  onDateDialogDateChange(e, date) {
    this.setState({dateDialogDate: date});
  }
  onDateDialogIsSumChange(e, checked) {
    this.setState({dateDialogIsSum: checked});
  }
  createMarksForEmptyDate(newDateKey) {
    // obsolete
    const { students } = this.state;
    return students.reduce((result, student) =>{
      const newkey = this.studentMarksWriteRef.push().key();
      result[newkey] = {
        studentGroupUid: this.props.params.studentGroupUid,
        courseUid: this.props.params.courseUid,
        dateUid: newDateKey,
        studentUid: student['.key'],
        value: 0,
      };
      return result;
    }, {});
  }
  createMarksForRemoveDate(dateKey) {
    const { marks } = this.state;
    return marks.filter((i) => i.dateUid === dateKey).reduce((result, date) =>{
      const k = date['.key'];
      result[k] = null;
      return result;
    }, {});
  }
  onDateCreate() {
    const newkey = this.datesWriteRef.push({
      isSum: this.state.dateDialogIsSum,
      timestamp: this.state.dateDialogDate.getTime(),
      ['studentGroupUid-courseUid']: this.createDateForeignKey(this.props.params.studentGroupUid, this.props.params.courseUid)
    });
    this.onDateDialogClose();
  }
  onDateSave(item) { // тут был key сейчас item
    const key = item['.key'];
    this.datesWriteRef.child(key).set({
      isSum: this.state.dateDialogIsSum,
      timestamp: this.state.dateDialogDate.getTime(),
      ['studentGroupUid-courseUid']: this.createDateForeignKey(this.props.params.studentGroupUid, this.props.params.courseUid)
    });
    this.onDateDialogClose();
  }
  onDateDelete(item) {
    const key = item['.key'];
    if (confirm(`Вы действительно хотите удалить занятие "${new Date(item.timestamp).toString()}"?\nОтменить это действие невозможно!`)) {
      var update = {
        'course-dates': {
          [key]: null
        },
        'student-marks': this.createMarksForRemoveDate(key)
      };
      console.log(update);
      this.datesWriteRef.update(update['course-dates']);
      this.studentMarksWriteRef.update(update['student-marks']);
      this.onDateDialogClose();
    }
  }
  onDateDialogClose() {
    this.setState({
      dateDialogMode: 'hide',
      dateDialogDate: null,
      dateDialogIsSum: false,
      dateDialogItem: null,
    })
  }
  onDateDialogOpenCreate() {
    this.setState({
      dateDialogMode: 'create',
      dateDialogDate: null,
      dateDialogIsSum: false,
      dateDialogItem: null,
    })
  }
  onDateDialogOpenEdit(item) {
    const key = item['.key'];
    this.setState({
      dateDialogMode: 'edit',
      dateDialogDate: new Date(item.timestamp),
      dateDialogIsSum: item.isSum,
      dateDialogItem: item
    })
  }



  // marks
  onMarkChange(markkey, datekey, studentkey, e) {
    const key = markkey == null
      ? this.studentMarksWriteRef.push().key()
      : markkey;
    const valueasint = parseInt(e.target.value);
    const newvalue =  Number.isNaN(valueasint)
     ? 0
     : valueasint;
    this.studentMarksWriteRef.child(key).set({
      studentGroupUid: this.props.params.studentGroupUid,
      courseUid: this.props.params.courseUid,
      dateUid: datekey,
      studentUid: studentkey,
      value: newvalue
    });
  }


  // other
  canUserWrite() {
    return this.props.user.isInRole(['admin', 'clerk', 'teacher']);
  }
  render_header(ordereddates) {
    return <TableRow>
            <TableHeaderColumn ></TableHeaderColumn>
            {
              ordereddates.map((date) => {
                const d = new Date(date.timestamp);
                return <TableHeaderColumn key={date['.key']} style={date.isSum ? {backgroundColor: Colors.grey100} : {}} >
                          {`${d.getDate()}.${d.getMonth()+1}`}
                          <ToggleDisplay if={this.canUserWrite()}>
                            <IconMenu
                              iconButtonElement={iconButtonElement}
                              anchorOrigin={{horizontal: 'right', vertical: 'bottom'}}
                              targetOrigin={{horizontal: 'right', vertical: 'top'}}>
                              <MenuItem onTouchTap={this.onDateDialogOpenEdit.bind(this, date)}>Редактировать</MenuItem>
                              <MenuItem onTouchTap={this.onDateDelete.bind(this, date)}>Удалить</MenuItem>
                            </IconMenu>
                          </ToggleDisplay>
                        </TableHeaderColumn>;
              })
            }
            <TableHeaderColumn style={{backgroundColor: Colors.grey100}} >Итого</TableHeaderColumn>
          </TableRow>
  }
  render_row(ordereddates, student, marks) {
    var acc = 0;
    return <TableRow key={student['.key']}>
              <TableHeaderColumn style={studentcellstyle}>
                {student.name}
                <ToggleDisplay if={this.canUserWrite()}>
                  <IconMenu
                    iconButtonElement={iconButtonElement}
                    anchorOrigin={{horizontal: 'right', vertical: 'bottom'}}
                    targetOrigin={{horizontal: 'right', vertical: 'top'}}>
                    <MenuItem onTouchTap={this.onStudentDialogOpenEdit.bind(this, student)}>Редактировать</MenuItem>
                    <MenuItem onTouchTap={this.onStudentDelete.bind(this, student)}>Удалить</MenuItem>
                  </IconMenu>
                </ToggleDisplay>
              </TableHeaderColumn>
              {
                ordereddates.map((date) => {
                  const sk = student['.key'];
                  const dk = date['.key'];
                  const mark = marks.filter((m) => m.studentUid === sk && m.dateUid === dk)[0];
                  const s = date.isSum ? {backgroundColor: Colors.grey100} : {};
                  if (date.isSum) {
                    return <TableRowColumn style={s}>{acc}</TableRowColumn>;
                  } else {
                    const mk = mark == void 0 || mark == null
                      ? null
                      : mark['.key'];
                    const v = mark == void 0 || mark == null
                     ? 0
                     : mark.value;
                    acc = acc + v;
                    if (this.canUserWrite()) {
                      return  <TableRowColumn key={`${sk},${dk}`} style={s}>
                                <TextField
                                  id={`${sk},${dk}`}
                                  value={v === 0 ? '' : v}
                                  onChange={this.onMarkChange.bind(this, mk, dk, sk)}
                                />
                              </TableRowColumn>;
                    } else {
                      <TableRowColumn style={s}>{mark.value}</TableRowColumn>;
                    }
                  }
                })
              }
              <TableRowColumn style={{backgroundColor: Colors.grey100}}>{acc}</TableRowColumn>
            </TableRow>
  }
  render_studentsDialog() {
    const { studentDialogMode, studentDialogName, studentDialogItem } = this.state;
    const key = studentDialogItem != null ? studentDialogItem['.key'] : '';
    var actions = [
      <FlatButton
        label="Отмена"
        primary={true}
        onTouchTap={this.onStudentDialogClose.bind(this)}
      />
    ];
    if (studentDialogMode === 'create') {
      actions = [
        ...actions,
        <FlatButton
          label="Создать"
          primary={true}
          onTouchTap={this.onStudentCreate.bind(this)}
          disabled={studentDialogName === ''}
        />
      ]
    }
    if (studentDialogMode === 'edit') {
      actions = [
        ...actions,
        <FlatButton
          label="Сохранить"
          primary={true}
          onTouchTap={this.onStudentSave.bind(this, studentDialogItem)}
          disabled={studentDialogName === ''}
        />
      ]
    }

    return <Dialog
              title={studentDialogMode === 'create' ? 'Создать' : 'Редактировать'}
              actions={actions}
              modal={false}
              open={studentDialogMode !== 'hide'}
              onRequestClose={this.onStudentDialogClose.bind(this)}
            >
        <TextField
          floatingLabelText="ФИО"
          value={studentDialogName}
          onChange={this.onStudentDialogNameChange.bind(this)} />
          <ToggleDisplay if={studentDialogMode === 'edit'}>
            <div>
            <RaisedButton label='Удалить' primary={true} onMouseUp={this.onStudentDelete.bind(this, studentDialogItem)} />
            </div>
          </ToggleDisplay>
      </Dialog>
  }
  render_dateDialog() {
    const { dateDialogMode, dateDialogDate, dateDialogIsSum, dateDialogItem } = this.state;
    const key = dateDialogItem != null ? dateDialogItem['.key'] : '';
    var actions = [
      <FlatButton
        label="Отмена"
        primary={true}
        onTouchTap={this.onDateDialogClose.bind(this)}
      />
    ];
    if (dateDialogMode === 'create') {
      actions = [
        ...actions,
        <FlatButton
          label="Создать"
          primary={true}
          onTouchTap={this.onDateCreate.bind(this)}
          disabled={dateDialogDate === null}
        />
      ]
    }
    if (dateDialogMode === 'edit') {
      actions = [
        ...actions,
        <FlatButton
          label="Сохранить"
          primary={true}
          onTouchTap={this.onDateSave.bind(this, dateDialogItem)}
          disabled={dateDialogDate === null}
        />
      ]
    }

    return <Dialog
              title={dateDialogMode === 'create' ? 'Создать' : 'Редактировать'}
              actions={actions}
              modal={false}
              open={dateDialogMode !== 'hide'}
              onRequestClose={this.onDateDialogClose.bind(this)}
            >
        <DatePicker
          hintText='Дата'
          value={dateDialogDate}
          onChange={this.onDateDialogDateChange.bind(this)} />
        <br />
        <Checkbox
          label="Контрольная неделя"
          checked={dateDialogIsSum}
          onCheck={this.onDateDialogIsSumChange.bind(this)}
        />
        <ToggleDisplay if={dateDialogMode === 'edit'}>
          <div>
          <RaisedButton label='Удалить' primary={true} onMouseUp={this.onDateDelete.bind(this, dateDialogItem)} />
          </div>
        </ToggleDisplay>
      </Dialog>
  }
  render_table(){
    const { dates, students, marks } = this.state;
    //console.log(this.state);
    const cantberendered = !Array.isArray(dates)
      || !Array.isArray(students)
      || !Array.isArray(marks);
      //|| dates.length === 0
      //|| students/length === 0;
    if (cantberendered)
      return null;
    const ordereddates = dates.sort((a, b) => a.timestamp > b.timestamp);
    return <Table
              selectable={false}
              multiSelectable={false}
            >
              <TableHeader
                displaySelectAll={false}
                adjustForCheckbox={false}
                enableSelectAll={false}
              >
                {this.render_header(ordereddates)}
              </TableHeader>
              <TableBody
                displayRowCheckbox={false}
                deselectOnClickaway={false}
                showRowHover={false}
                stripedRows={false}
              >
                {students.map( (student) => this.render_row(ordereddates, student, marks))}
              </TableBody>
            </Table>
  }
  render() {
    const { academicTerm, course } = this.state;

    const breadcrumbs = [
      <Link to='/journal'>Журнал</Link>,
      <Link to={`/journal/${this.props.params.academicTermUid}`}>{academicTerm == null ? '...'  : academicTerm.name}</Link>,
      <Link to={`/journal/${this.props.params.academicTermUid}/${this.props.params.courseUid}`}>{course == null ? '...'  : course.name}</Link>
    ];

    return (
      <div>
        <div style={{padding:'20px'}}>
          <Breadcrumbs items={breadcrumbs}  />
          <br />
          <div>
            <RaisedButton icon={<AddCircleIcon />} label='Добавить студента' onMouseUp={this.onStudentDialogOpenCreate.bind(this)} />
            <RaisedButton icon={<AddCircleIcon />} label='Добавить занятие' onMouseUp={this.onDateDialogOpenCreate.bind(this)} />
          </div>
        </div>
        {this.render_table()}
        {this.render_studentsDialog()}
        {this.render_dateDialog()}
      </div>
    );
  }
}
reactMixin(Journal.prototype, ReactFireMixin);

function mapStateToProps(state, ownProps) {
  return {
    ...ownProps,
    // redux store
    firebaseService: state.firebaseService,
    user: state.user
  };
}

function mapDispatchToProps(dispatch) {
  return {
    routeActions: bindActionCreators({ push, replace, go, goForward, goBack }, dispatch)
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(Journal);
