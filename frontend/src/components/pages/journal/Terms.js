import React from 'react';
import reactMixin from 'react-mixin';
import ReactFireMixin from 'reactfire';
import Highlighter from 'components/Highlighter';

class Terms extends React.Component {
  constructor(props) {
    super(props);
  }
  render() {
    return (
      <HighLighter search={'Foo'} text={'Foo bar baz'} />
    );
  }
}
reactMixin.onClass(Terms, ReactFireMixin);

export default Terms;
