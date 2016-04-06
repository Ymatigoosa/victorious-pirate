import React from 'react';
import { intersperse } from 'utils/Utils';

const delimiter = ' / ';

const Breadcrumbs = ({items}) => {
  const enchantedchildren = intersperse(items, delimiter);
  return (
    <div className='Breadcrumbs'>
      {enchantedchildren.map( (el, i) => (<span key={i}>{el}</span>) )}
      {delimiter}
    </div>
  );
};

export default Breadcrumbs;
