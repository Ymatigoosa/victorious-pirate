import React from 'react';
import Highlight from 'react-highlighter';

const Highlighter = ({search, text}) => (
  <Highlight matchElement='mark' search={search}>
    {text}
  </Highlight>
);
export default Highlighter
