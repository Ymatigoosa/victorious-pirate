import React from 'react';
import TextField from 'material-ui/lib/text-field';

class MarkEditor extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      value: this.props.value
    };
  }
  componentWillReceiveProps(nextProps) {
    this.setState({
      value: nextProps.value
    });
  }
  onChange(e) {
    this.setState({
      value: e.target.value
    });
  }
  onBlur(e) {
    this.callOnChange();
  }
  handleEnterKeyDown(e) {
    if(e.keyCode == 13) {
      this.callOnChange();
    }
  }
  callOnChange() {
    const { onChange } = this.props;
    const { value } = this.state;
    onChange(value);
  }
  render() {
    const { id } = this.props;
    const { value } = this.state;
    return (
        <TextField
          id={id}
          value={value}
          onKeyDown={this.handleEnterKeyDown.bind(this)}
          onBlur={this.onBlur.bind(this)}
          onChange={this.onChange.bind(this)}
        />
    );
  }
}

export default MarkEditor;
