import React from 'react';
import { intersperse } from 'utils/Utils';

const Breadcrumbs = (props) => {
  const { children } = props;
  const enchantedchildren = intersperse(children, (<span>&nbsp;/&nbsp;</span>));
  return (
    <div>
      {enchantedchildren}
    </div>
  );
};

export default Breadcrumbs;
