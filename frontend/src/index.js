import 'core-js/fn/object/assign';
import React from 'react';
import { render } from 'react-dom';
import Routes from 'components/Routes';
import injectTapEventPlugin from 'react-tap-event-plugin';

injectTapEventPlugin();

// Render the main component into the dom
render(<Routes />, document.getElementById('app'));
