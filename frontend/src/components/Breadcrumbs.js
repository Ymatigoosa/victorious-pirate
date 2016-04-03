import React from 'react';
import { intersperse } from 'utils/Utils';

const Breadcrumbs = ({items}) => {
  const enchantedchildren = intersperse(items, ' / ');
  return (
    <div className='Breadcrumbs'>
      {enchantedchildren.map( (el, i) => (<span key={i}>{el}</span>) )}
    </div>
  );
};

export default Breadcrumbs;