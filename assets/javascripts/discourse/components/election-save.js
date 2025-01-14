import { tracked } from "@glimmer/tracking";
import Component from "@ember/component";
import { action, computed, get, set } from "@ember/object";
import { next } from "@ember/runloop";
import { dasherize } from "@ember/string";
import DButton from "discourse/components/d-button";
import { ajax } from "discourse/lib/ajax";

/*
<ElectionSave @property={{this.position}}
                    @name="position"
                    @invalid={{this.positionInvalid}}
                    @topic={{this.topic}}
                    @error="error"
                    @saved="saved" />
*/

export default class ElectionSaveComponent extends Component {
  @tracked saving = false;
  @tracked icon = null;
  @tracked property = this.args.property;

  init() {
    super.init(...arguments);
    this.setup();

    // console.log("ElectionSaveComponent this", this);
    // console.log("ElectionSaveComponent this.args", this.args); // --> undefined
    // console.log("ElectionSaveComponent property", this.property);
    // console.log("ElectionSaveComponent name", this.get("name"));
    // console.log("ElectionSaveComponent topic", this.get("topic"));
    // console.log("ElectionSaveComponent saved", this.saved);
  }

  setup() {
    if (this.topic) {
      next(this, () => {
        // console.log("topic", this.topic);
        // console.log(
        //   "ElectionSaveComponent setup",
        //   this.topic["election_nominations_usernames"]
        // );
        set(this, "property", this.topic[`election_${this.name}`]); // property = this.topic[`election_${this.name}`];
      });
    }
  }

  get disabled() {
    return this.unchanged || this.saving || this.invalid;
  }

  @computed("property", "name")
  get unchanged() {
    let current = this.property;
    let original = undefined;
    if (this.topic) {
      original = this.topic[`election_${this.name}`];
    }

    return current === original;
  }

  set unchanged(value) {
    //console.log("ElectionSaveComponent: set unchanged", value);
  }

  prepareData() {
    if (this.disabled) {
      return false;
    }

    this.saving = true;
    $("#modal-alert").hide();

    const data = {
      topic_id: this.topic.id,
      [this.name]: this.property,
    };

    return data;
  }

  resolve(result) {
    const name = this.name;
    const original = this.topic[`election_${name}`];

    if (result.success) {
      this.icon = "check";
      this.topic[`election_${name}`] = this.property;
    } else if (result.failed) {
      this.icon = "times";
      if (original) {
        this.property = original;
      }
      this.handleError(result);
    }

    this.saving = false;
  }

  resolveStandardError(responseText) {
    const message = responseText.substring(
      responseText.indexOf(">") + 1,
      responseText.indexOf("plugins")
    );
    this.resolve({ failed: true, message });
  }

  @action
  save() {
    next(this, () => {
      this.saving = true;
    });

    const data = this.prepareData();

    if (!data["topic_id"]) {
      return;
    }

    ajax(`/election/set-${dasherize(this.name)}`, { type: "PUT", data })
      .then((result) => this.handleSuccess(result))
      .catch((e) => this.handleError(e))
      .finally(() => {
        next(this, () => {
          this.saving = false;
        });
      });

    // .then((result) => {
    //   this.resolve(result);
    // })
    // .catch((e) => {
    //   if (e.jqXHR && e.jqXHR.responseText) {
    //     this.resolveStandardError(e.jqXHR.responseText);
    //   }
    // })
    // .finally(() => this.resolve({}));
  }

  handleSuccess(result) {
    if (result.success) {
      next(this, () => {
        this.icon = "check";
        this.topic[`election_${this.name}`] = this.property;
      });
    } else {
      next(this, () => {
        this.icon = "times";
      });
    }
  }

  handleError(e) {
    console.error("Error during save:", e);
    if (e.jqXHR && e.jqXHR.responseText) {
      this.resolveStandardError(e.jqXHR.responseText);
      alert(e.jqXHR.responseText);
    }
  }

  setPropertyValue(value) {
    next(this, () => {
      this.property = value;
    });
  }
}
