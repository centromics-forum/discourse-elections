// app/components/election-list-controls.js
import Component from "@glimmer/component";
import { action } from "@ember/object";
import { inject as service } from "@ember/service";
import I18n from "discourse-i18n";

export default class ElectionListControlsComponent extends Component {
  @service currentUser;
  @service modal;

  get isAdmin() {
    return this.currentUser?.is_elections_admin;
  }

  @action
  createElection() {
    this.modal.show("create-election", {
      model: {
        categoryId: this.args.category.id,
      },
    });
  }
}
