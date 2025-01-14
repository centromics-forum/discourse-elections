import Component from "@ember/component";
//import { computed } from '@ember-decorators/object';
import { computed } from "@ember/object";

/* call example
  <PluginOutlet
    @name="composer-fields"
    @connectorTagName="div"
    @outletArgs={{hash
      model=this.composer.model
      showPreview=this.composer.showPreview
    }}
  />
*/
export default class StatementComposerLabelComponent extends Component {
  @computed("model.isNominationStatement")
  get isNominationStatement() {
    return this.model.isNominationStatement;
  }

  get model() {
    return this.outletArgs.model;
  }
}
