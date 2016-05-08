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
import FileDownload from 'material-ui/lib/svg-icons/file/file-download';
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
import TextField from 'material-ui/lib/text-field';

import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { push, replace, go, goForward, goBack } from 'react-router-redux';
import Breadcrumbs from 'components/Breadcrumbs';
import JournalTable from 'components/pages/journal/JournalTable';
import { Link } from 'react-router';
import ToggleDisplay from 'react-toggle-display';
import MarkEditor from 'components/pages/journal/MarkEditor';
import { deleteAllFromFirebase } from 'utils/Utils';

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
    this.bindAsObject(this.ref.child('academic-terms').child(this.props.params.academicTermUid), 'academicTerm', (error) => console.error(error));
    this.bindAsObject(this.ref.child('courses').child(this.props.params.courseUid), 'course', (error) => console.error(error));
    this.bindAsObject(this.ref.child('student-groups').child(this.props.params.studentGroupUid), 'studentGroup', (error) => console.error(error));
  }
  createDateForeignKey(studentGroupUid, courseUid) {
    return `(${studentGroupUid}, ${courseUid})`;
  }
  createMarkKey(studentUid, dateUid) {
    return `(${studentUid}, ${dateUid})`;
  }
  componentWillUnmount() {
    //this.unbind('items');
  }



  // students
  onStudentDialogNameChange(e) {
    this.setState({studentDialogName: e.target.value})
  }
  onStudentCreate() {
    this.studentsWriteRef.push({
      name: this.state.studentDialogName,
      studentGroupUid: this.props.params.studentGroupUid,
      academicTermUid: this.props.params.academicTermUid
    });
    this.onStudentDialogClose();
  }
  onStudentSave(item) { // тут был key сейчас item
    const key = item['.key'];
    this.studentsWriteRef.child(key).set({
      name: this.state.studentDialogName,
      studentGroupUid: item.studentGroupUid,
      academicTermUid: this.props.params.academicTermUid
    });
    this.onStudentDialogClose(); // закончил тут
  }
  onStudentDelete(item) {
    const key = item['.key'];
    if (confirm(`Вы действительно хотите удалить студента "${item.name}"?\nОтменить это действие невозможно!`)) {
      this.studentsWriteRef.child(key).remove();
      const root = this.props.firebaseService.ref;
      root.child('student-marks').orderByChild('studentUid').equalTo(key).once('value', deleteAllFromFirebase);
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
  onDateCreate() {
    const newkey = this.datesWriteRef.push({
      isSum: this.state.dateDialogIsSum,
      timestamp: this.state.dateDialogDate.getTime(),
      studentGroupUid: this.props.params.studentGroupUid,
      courseUid: this.props.params.courseUid,
      ['studentGroupUid-courseUid']: this.createDateForeignKey(this.props.params.studentGroupUid, this.props.params.courseUid),
      academicTermUid: this.props.params.academicTermUid
    });
    this.onDateDialogClose();
  }
  onDateSave(item) { // тут был key сейчас item
    const key = item['.key'];
    this.datesWriteRef.child(key).set({
      isSum: this.state.dateDialogIsSum,
      timestamp: this.state.dateDialogDate.getTime(),
      studentGroupUid: this.props.params.studentGroupUid,
      courseUid: this.props.params.courseUid,
      ['studentGroupUid-courseUid']: this.createDateForeignKey(this.props.params.studentGroupUid, this.props.params.courseUid),
      academicTermUid: this.props.params.academicTermUid
    });
    this.onDateDialogClose();
  }
  onDateDelete(item) {
    const key = item['.key'];
    if (confirm(`Вы действительно хотите удалить занятие "${new Date(item.timestamp).toString()}"?\nОтменить это действие невозможно!`)) {
      const root = this.props.firebaseService.ref;
      this.datesWriteRef.child(key).remove();
      root.child('student-marks').orderByChild('dateUid').equalTo(key).once('value', deleteAllFromFirebase);
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
  onMarkChange(markkey, datekey, studentkey, value) {
    const key = markkey == null
      ? this.studentMarksWriteRef.push().key()
      : markkey;
    const valueasint = parseInt(value);
    const newvalue =  Number.isNaN(valueasint)
     ? 0
     : valueasint;
    this.studentMarksWriteRef.child(this.createMarkKey(studentkey, datekey)).set({
      studentGroupUid: this.props.params.studentGroupUid,
      courseUid: this.props.params.courseUid,
      dateUid: datekey,
      studentUid: studentkey,
      academicTermUid: this.props.params.academicTermUid,
      value: newvalue
    });
  }


  // other
  canUserWrite() {
    return this.props.user.isInRole(['admin', 'clerk', 'teacher']);
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
      </Dialog>
  }
  render() {
    const { academicTerm, course, studentGroup } = this.state;

    const breadcrumbs = [
      <Link to='/journal'>Журнал</Link>,
      <Link to={`/journal/${this.props.params.academicTermUid}`}>{academicTerm == null ? '...'  : academicTerm.name}</Link>,
      <Link to={`/journal/${this.props.params.academicTermUid}/${this.props.params.courseUid}`}>{course == null ? '...'  : course.name}</Link>,
      (studentGroup == null ? '...'  : studentGroup.name)
    ];

    return (
      <div>
        <Breadcrumbs items={breadcrumbs} />
        <div style={{padding:'20px'}}>
          <br />
          <div>
          <ToggleDisplay if={this.canUserWrite()} >
            <RaisedButton icon={<AddCircleIcon />} label='Добавить студента' onMouseUp={this.onStudentDialogOpenCreate.bind(this)} />
            <RaisedButton icon={<AddCircleIcon />} label='Добавить занятие' onMouseUp={this.onDateDialogOpenCreate.bind(this)} />
            </ToggleDisplay>
            <RaisedButton icon={<FileDownload />} label='Скачать' linkButton={true} target="_blank" href={`/api/journal-xml/${this.props.params.academicTermUid}/${this.props.params.courseUid}/${this.props.params.studentGroupUid}`} />
          </div>
        </div>
        {<JournalTable
          firebaseRef={this.props.firebaseService.ref}
          user={this.props.user}
          params={this.props.params}
          canUserWrite={this.canUserWrite.bind(this)}
          onStudentDialogOpenEdit={this.onStudentDialogOpenEdit.bind(this)}
          onDateDialogOpenEdit={this.onDateDialogOpenEdit.bind(this)}
          onDateDelete={this.onDateDelete.bind(this)}
          onStudentDelete={this.onStudentDelete.bind(this)}
          createMarkKey={this.createMarkKey.bind(this)}
          createDateForeignKey={this.createDateForeignKey.bind(this)}
          onMarkChange={this.onMarkChange.bind(this)}
          />}
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
