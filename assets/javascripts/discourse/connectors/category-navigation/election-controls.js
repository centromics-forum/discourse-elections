import Component from "@glimmer/component";
import { action } from "@ember/object";
import { service } from "@ember/service";
import DButton from "discourse/components/d-button";
import i18n from "discourse-common/helpers/i18n";
import ElectionList from "../../components/election-list";
import CreateElectionModal from "../../components/modal/create-election";

export default class ElectionControlsComponent extends Component {
  @service currentUser;
  @service modal;
  @service siteSettings;

  @action
  createElection(categoryId) {
    this.modal.show(CreateElectionModal, {
      model: { categoryId },
    });
  }

  get isElectionsAdmin() {
    return this.currentUser.is_elections_admin;
  }

  get category() {
    return this.args.outletArgs.category;
  }

  get tag() {
    return this.args.outletArgs.tag;
  }
}
