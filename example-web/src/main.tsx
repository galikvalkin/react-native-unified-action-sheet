import { AppRegistry } from 'react-native';

// The demo screen is shared with example/ and example-legacy/; edit it in
// example-shared/.
import App from '../../example-shared/ActionSheetDemoApp';

AppRegistry.registerComponent('UnifiedActionSheetExample', () => App);
AppRegistry.runApplication('UnifiedActionSheetExample', {
  rootTag: document.getElementById('root'),
});
