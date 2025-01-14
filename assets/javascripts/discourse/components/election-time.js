import Component from "@glimmer/component";
import { tracked } from "@glimmer/tracking";
import { on } from "@ember/modifier";
import { action, computed, observer } from "@ember/object";
import { inject as service } from "@ember/service";
import withEventValue from "discourse/helpers/with-event-value";
import I18n from "discourse-i18n";
//import { action, set } from "@ember/object";

/*
  <ElectionTime
    @type="open"
    @after={{this.pollOpenAfter}}
    @hours={{this.pollOpenAfterHours}}
    @nominations={{this.pollOpenAfterNominations}}
    @time={{this.pollOpenTime}}
  />
*/
export default class ElectionTimeComponent extends Component {
  @tracked ready = false;

  @tracked after = this.args.after || false;
  @tracked manual = this.args.manual || false;
  @tracked hours = this.args.hours || 0;
  @tracked nominations = this.args.nominations || 2;
  @tracked voters = 0;
  @tracked type = this.args.type;
  @tracked time = this.args.time;

  setElectionTime = this.args.setElectionTime;

  classNames = ["election-time"];

  @action
  onDidInsert() {
    console.log("onDidInsert this.args.time", this.args.time);
    this.ready = true;
  }

  get showNominations() {
    return this.type === "open";
  }

  get showVoters() {
    return this.type === "close";
  }

  @computed("after")
  get toggleManual() {
    //console.log("toggleManual after/manual", this.after, this.manual);
    if (this.after) {
      //console.log("toggleManual manual", this.manual);
      this.manual = false;
    }
  }

  @action
  onAfterClicked(e) {
    //console.log("onAfterClicked", e);
    this.after = e.target.checked; // NOTE: 나중에 반영되는데 미리 여기서 입력함.
    this.toggleManual();
    this.sendElectionTime();
  }

  @computed("manual")
  get toggleAfter() {
    //console.log("toggleAfter after/manual", this.after, this.manual);
    if (this.manual) {
      //console.log("toggleManual after", this.after);
      this.after = false;
    }
  }

  @action
  onManualClicked(e) {
    //console.log("onManualClicked", e);
    this.manual = e.target.checked; // NOTE: 나중에 반영되는데 미리 여기서 입력함.
    this.toggleAfter;
    this.sendElectionTime();
  }

  @computed("nominations")
  get nominationsLabel() {
    //console.log("Nominations", this.nominations);
    return `election.poll.${this.type}_nominations`;
  }

  @computed("type")
  get timeId() {
    return `${this.type}-time-picker`;
  }

  @computed("type")
  get dateId() {
    return `${this.type}-date-picker`;
  }

  @computed("type")
  get afterTitle() {
    return `election.poll.${this.type}_after`;
  }

  @computed("type")
  get manualTitle() {
    return `election.poll.${this.type}_manual`;
  }

  @computed("type")
  get criteria() {
    const list = I18n.t(`election.poll.${this.type}_criteria`).split("-");
    return list.filter((c) => c.length > 3);
  }

  @action
  setTime(time) {
    //console.log("setTime time", time);
    // console.log("setTime this.args.time", this.args.time);
    this.time = time;
    this.sendElectionTime();
  }

  @action
  sendElectionTime() {
    if (this.ready) {
      if (this.setElectionTime) {
        this.setElectionTime(this.prepareData());
      }
    }
  }

  prepareData() {
    return {
      type: this.type,
      after: this.after,
      manual: this.manual,
      hours: this.hours,
      nominations: this.nominations,
      voters: this.voters,
      time: this.time,
    };
  }
}
