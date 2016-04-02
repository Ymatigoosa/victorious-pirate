import React from 'react';
import { Link } from 'react-router';
import Breadcrumbs from 'components/Breadcrumbs';

class FilesPage extends React.Component {
  constructor(props) {
    super(props);
  }
  renderBreadcrumbs(breadcrumbs) {
    //console.log(breadcrumbs);
    if (Array.isArray(breadcrumbs))  {
      return <div style={{'paddingTop': '20px', 'paddingBottom': '20px'}}>
        {breadcrumbs.map((el, i) => (
          <span key={i}>{el}</span>
        ))}
      </div>
    } else {
      return <div></div>;
    }
  }
  render() {
    const breadcrumbs = [
      <Link to='/files'>Файловый архив</Link>,
      '123'
    ];
    return (
      <div>
        <Breadcrumbs items={breadcrumbs} />
        <span>тут будет страница файлов</span>
      </div>
    );
  }
}
//LoginPage.propTypes = { initialCount: React.PropTypes.number };
//LoginPage.defaultProps = { initialCount: 0 };

export default FilesPage;
