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
import TextField from 'material-ui/lib/text-field';
import shallowequal from 'shallowequal';

import { deleteAllFromFirebase } from 'utils/Utils';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { push, replace, go, goForward, goBack } from 'react-router-redux';
import Breadcrumbs from 'components/Breadcrumbs';
import { Link } from 'react-router';
import ToggleDisplay from 'react-toggle-display';
import MarkEditor from 'components/pages/journal/MarkEditor';

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

class JournalTable extends React.Component {
  constructor(props) {
    super(props);

    this.ref = this.props.firebaseRef;

    this.datesWriteRef = this.ref
      .child('course-dates');

    this.datesReadRef = this.datesWriteRef
      .orderByChild('studentGroupUid-courseUid')
      .equalTo(this.props.createDateForeignKey(this.props.params.studentGroupUid, this.props.params.courseUid));

    this.studentsWriteRef = this.ref
      .child('students');

    this.studentsReadRef = this.studentsWriteRef
      .orderByChild('studentGroupUid')
      .equalTo(this.props.params.studentGroupUid);

    this.studentMarksWriteRef = this.ref
      .child('student-marks');

    this.studentMarksReadRef = this.studentMarksWriteRef
      .orderByChild('studentGroupUid')
      .equalTo(this.props.params.studentGroupUid);
    //console.log(this);
    this.state = {
      dates: null,
      students: null,
      marks: null
    };
  }
  componentWillMount() {
    this.bindAsArray(this.datesReadRef, 'dates', (error) => console.error(error));
    this.bindAsArray(this.studentsReadRef, 'students', (error) => console.error(error));
    this.bindAsObject(this.studentMarksReadRef, 'marks', (error) => console.error(error));
  }

  shouldComponentUpdate(nextProps, nextState) {
    return this.state !== nextState
      || this.props.user !== nextProps.user
      || !shallowequal(this.props.params, nextProps.params);
  }

  render_header(ordereddates) {
    return <TableRow>
            <TableHeaderColumn ></TableHeaderColumn>
            {
              ordereddates.map((date) => {
                const s = !date.isSum
                  ? studentcellstyle
                  : {...studentcellstyle, backgroundColor: Colors.grey100}
                const d = new Date(date.timestamp);
                return <TableHeaderColumn key={date['.key']} style={s} >
                          {`${d.getDate()}.${d.getMonth()+1}`}
                          <ToggleDisplay if={this.props.canUserWrite()}>
                            <IconMenu
                              iconButtonElement={iconButtonElement}
                              anchorOrigin={{horizontal: 'right', vertical: 'bottom'}}
                              targetOrigin={{horizontal: 'right', vertical: 'top'}}>
                              <MenuItem onTouchTap={() => this.props.onDateDialogOpenEdit(date)}>Редактировать</MenuItem>
                              <MenuItem onTouchTap={() => this.props.onDateDelete(date)}>Удалить</MenuItem>
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
                <ToggleDisplay if={this.props.canUserWrite()}>
                  <IconMenu
                    iconButtonElement={iconButtonElement}
                    anchorOrigin={{horizontal: 'right', vertical: 'bottom'}}
                    targetOrigin={{horizontal: 'right', vertical: 'top'}}>
                    <MenuItem onTouchTap={() => this.props.onStudentDialogOpenEdit(student)}>Редактировать</MenuItem>
                    <MenuItem onTouchTap={() => this.props.onStudentDelete(student)}>Удалить</MenuItem>
                  </IconMenu>
                </ToggleDisplay>
              </TableHeaderColumn>
              {
                ordereddates.map((date) => {
                  const sk = student['.key'];
                  const dk = date['.key'];
                  const mk = this.props.createMarkKey(sk, dk);
                  const mark = marks[mk];
                  const s = date.isSum ? {backgroundColor: Colors.grey100} : {};
                  if (date.isSum) {
                    return <TableRowColumn key={`${mk}`} style={s}>{acc}</TableRowColumn>;
                  } else {
                    const v = mark == void 0 || mark == null
                     ? 0
                     : mark.value;
                    acc = acc + v;
                    if (this.props.canUserWrite()) {
                      return  <TableRowColumn key={`${mk}`}>
                                <MarkEditor
                                  id={`${mk}`}
                                  value={v === 0 ? '' : v}
                                  onChange={(value) => this.props.onMarkChange(mk, dk, sk, value)}
                                />
                              </TableRowColumn>;
                    } else {
                      return <TableRowColumn key={`${mk}`} style={s}>{v === 0 ? '' : v}</TableRowColumn>;
                    }
                  }
                })
              }
              <TableRowColumn style={{backgroundColor: Colors.grey100}}>{acc}</TableRowColumn>
            </TableRow>
  }
  render(){
    const { dates, students, marks } = this.state;
    //console.log(this.state);
    const cantberendered = !Array.isArray(dates)
      || students === null
      || marks === null;
      //|| dates.length === 0
      //|| students/length === 0;
    if (cantberendered)
      return null;
    const ordereddates = dates.sort((a, b) => a.timestamp - b.timestamp);
    return <Table
              style={{width: 'auto'}}
              wrapperStyle={{overflow: void 0, width: 'auto'}}
              bodyStyle={{ overflowX: void 0, overflowY: void 0 }}
              selectable={false}
              multiSelectable={false}
            >
              <TableBody
                displayRowCheckbox={false}
                deselectOnClickaway={false}
                showRowHover={false}
                stripedRows={false}
              >
                {this.render_header(ordereddates)}
                {students.map( (student) => this.render_row(ordereddates, student, marks))}
              </TableBody>
            </Table>
  }
}
reactMixin(JournalTable.prototype, ReactFireMixin);


export default JournalTable;
