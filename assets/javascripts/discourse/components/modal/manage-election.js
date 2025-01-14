"use strict";

import Component from "@glimmer/component";
import { tracked } from "@glimmer/tracking";
import { action, computed, observer } from "@ember/object";
import { inject as service } from "@ember/service";
import DButton from "discourse/components/d-button";
import { ElectionPollAvailableStages, ElectionStatuses } from "../../lib/election";
import ElectionSaveCurrentStage from "../election-save-current-stage";
import ElectionSaveTime from "../election-save-time";
import ElectionSaveUsernames from "../election-save-usernames";
import ElectionTime from "../election-time";

export default class ManageElectionModal extends Component {
  @service flashMessages; // To display error messages

  @tracked status; // = this.topic.election_status;

  @tracked topic; // = this.args.model.topic;
  //@tracked usernamesString; // = this.topic.election_nominations_usernames.join(",");
  @tracked nominations = this.topic.election_nominations;
  @tracked nominationsUsernames;
  @tracked position; // = this.topic.election_position;

  @tracked pollEnabledStages; // finding_answer, finding_winner
  //@tracked pollEnabledStagesString = "";
  @tracked pollCurrentStage = "";

  @tracked showSelector = false;
  @tracked pollOpenAfter = true;
  @tracked pollCloseAfter = true;
  @tracked usernamesString = '';
  @tracked selfNomination = false;
  @tracked statusBanner = false;
  @tracked statusBannerResultHours = 0;
  @tracked nominationMessage = "";
  @tracked pollMessage = "";
  @tracked closedPollMessage = "";
  @tracked sameMessage = false;
  @tracked pollOpen = false;
  @tracked pollOpenAfterHours = 0;
  @tracked pollOpenAfterNominations = 0;
  @tracked pollOpenTime = "";
  @tracked pollClose = false;
  @tracked pollCloseAfterHours = 0;
  @tracked pollCloseAfterVoters = 0;
  @tracked pollCloseTime = "";
  @tracked winner = "";
  nominationParam = { type: "nomination" };
  pollParam = { type: "poll" };

  constructor() {
    super(...arguments);
    this.setup();
  }

  setup() {
    const model = this.args.model;

    if (model) {
      const topic = model.model.topic;

      this.showSelector = true;
      this.topic = topic;
      this.position = topic.election_position;

      console.log('topic.election_poll_enabled_stages', topic.election_poll_enabled_stages);

      let pollEnabledStages = topic.election_poll_enabled_stages?.split(',');
      if (!pollEnabledStages) { pollEnabledStages = ['finding_answer']; }
      this.pollEnabledStages = pollEnabledStages;

      let pollCurrentStage = topic.election_poll_current_stage;
      if (!pollCurrentStage) { pollCurrentStage = this.pollEnabledStages[0]; }
      this.pollCurrentStage = pollCurrentStage;

      this.nominationsUsernames = this.prepareNominationsUsernamesVar(topic.election_nominations_usernames);
      this.nominationsUsernamesString = this.prepareNominationsUsernamesInput(topic.election_nominations_usernames);
      this.selfNomination = topic.election_self_nomination_allowed;
      this.statusBanner = topic.election_status_banner;
      this.statusBannerResultHours = topic.election_status_banner_result_hours;
      this.status = topic.election_status;
      this.nominationMessage = topic.election_nomination_message;
      this.pollMessage = topic.election_poll_message;
      this.closedPollMessage = topic.election_closed_poll_message;
      this.sameMessage = topic.same_message;

      this.pollOpen = topic.election_poll_open; // == poll_open-enabled
      this.pollOpenAfter = topic.election_poll_open_after;
      this.pollOpenAfterHours = topic.election_poll_open_after_hours;
      this.pollOpenAfterNominations =
        topic.election_poll_open_after_nominations;
      this.pollOpenTime = topic.election_poll_open_time;

      this.pollClose = topic.election_poll_close; // == poll_close-enabled
      this.pollCloseAfter = topic.election_poll_close_after;
      this.pollCloseAfterHours = topic.election_poll_close_after_hours;
      this.pollCloseAfterVoters = topic.election_poll_close_after_voters;
      this.pollCloseTime = topic.election_poll_close_time;

      this.winner = topic.election_winner;
    }
  }

  get pollAvailableStagesString() {
    return ElectionPollAvailableStages.join(', ');
  }

  // @computed("pollEnabledStages")
  get pollEnabledStagesString() {
    return this.pollEnabledStages.join(", ");
  }

  //@computed("pollEnabledStages")
  get pollEnabledStagesOptions() {
    //return this.pollEnabledStages.join(",");
    console.log('this.pollEnabledStages', this.pollEnabledStages);
    return (this.pollEnabledStages || []).map((k) => ({
      name: k,
      id: k,
    }));
  }

  //@computed("pollCurrentStage")
  get pollCurrentStageUnchanged() {
    return this.topic?.election_poll_current_stage === this.pollCurrentStage;
  }

  set pollCurrentStageUnchanged(value) {
    // setter 로직: 필요 시 구현
    console.warn("pollCurrentStageUnchanged was set:", value);
  }

  get pollCurrentStage_FindingWinner() {
    return this.pollCurrentStage === 'finding_winner';
  }

  @computed
  get electionStatuses() {
    return Object.keys(ElectionStatuses).map((k) => ({
      name: k,
      id: ElectionStatuses[k],
    }));
  }

  prepareNominationsUsernamesVar(nominations_usernames) {
    console.log('prepareNominationsUsernamesVar nomination_usernames', nominations_usernames);
    const str = nominations_usernames
      .filter(Boolean)
      .map((v) => {
        return { username: v.username, description: v.description };
      });
    console.log('prepareNominationsUsernamesVar nominationselection_nomination_string', str);
    return str;
  }

  // this.topic.election_nomination_string
  prepareNominationsUsernamesInput(nominations_usernames) {
    console.log('prepareNominationsUsernamesInput nomination_usernames', nominations_usernames);
    const str = nominations_usernames
      .filter((v) => (v.username != null && v.username !== ''))
      .map((v) => v.username + '=' + (v.description ?? '')).join("\n");
    console.log('prepareNominationsUsernamesInput nominationselection_nomination_string', str);
    return str;
  }

  buildNominationsUsernamesFromNominationsUsernamesString(nominationsUsernamesString) {
    if (nominationsUsernamesString == null || nominationsUsernamesString === '') {
      return [];
    }

    return nominationsUsernamesString.split("\n")
      .map((v) => {
        try {
          const [username, description] = v.split('=');
          return { username, description };
        } catch (e) { return null; }
      })
      .filter(Boolean);
  }

  @computed("nominations", "topic.election_nominations")
  get nominationsUsernamesUnchanged() {
    const original = this.prepareNominationsUsernamesVar(this.topic?.election_nominations_usernames) || [];
    const current = this.buildNominationsUsernamesFromNominationsUsernamesString(this.nominationsUsernamesString);

    console.log('nominationsUnchanged original current', original, current);

    if (original.length !== current.length) {
      return false;
    }

    return current.every((item) =>
      original.some((v) => v.username === item.username && v.description === item.description)
    );
  }

  set nominationsUsernamesUnchanged(value) {
    // setter 로직: 필요 시 구현
    console.warn("nominationsUsernamesUnchanged was set:", value);
  }

  // @computed("usernamesString")
  // get usernames() {
  //   return (this.usernamesString || "").split(",").map((s) => s.trim());
  // }

  // set usernames(value) {
  //   // setter 로직: 필요 시 구현
  //   if (!value) {
  //     this.usernamesString = "";
  //   } else {
  //     this.usernamesString = value.join(", ");
  //   }
  // }

  // @computed("usernames", "topic.election_nominations_usernames")
  // get usernamesUnchanged() {
  //   const newUsernames = this.usernames.filter(Boolean);
  //   const currentUsernames =
  //     this.topic?.election_nominations_usernames.filter(Boolean) || [];

  //   if (newUsernames.length !== currentUsernames.length) {
  //     return false;
  //   }

  //   return newUsernames.every((username) =>
  //     currentUsernames.includes(username)
  //   );
  // }

  // set usernamesUnchanged(value) {
  //   // setter 로직: 필요 시 구현
  //   console.warn("usernamesUnchanged was set:", value);
  // }

  @computed("position")
  get positionInvalid() {
    return !this.position || this.position.length < 3;
  }

  @action
  close() {
    this.args.closeModal();
  }

  @action
  error(message) {
    this.flash(message, "error");
  }

  @action
  saved() {
    this.model.rerender();
  }

  get model() {
    return this.args.model;
  }

  // @action
  // onUsernamesInput(usernames) {
  //   // Join the usernames into a string if needed.
  //   this.usernamesString = (usernames || []).filter(Boolean).join(", ");
  // }

  @action
  onNominationsUsernamesStringInput(e) {
    const nominationsString = e.target.value;
    console.log('onNominationsUsernamesStringInput', nominationsString);
    this.nominationsUsernames = this.buildNominationsUsernamesFromNominationsUsernamesString(nominationsString);
    console.log('onNominationsUsernamesStringInput nominationsUsernames', this.nominationsUsernames);
  }

  @action
  setElectionTime_PollOpen(data) {
    this.pollOpenAfter = data.after;
    this.pollOpenAfterHours = Number(data.hours);
    this.pollOpenAfterNominations = Number(data.nominations);
    this.pollOpenTime = data.time;
  }

  @action
  setElectionTime_PollClose(data) {
    this.pollCloseAfter = data.after;
    this.pollCloseAfterHours = Number(data.hours);
    this.pollCloseAfterVoters = Number(data.voters);
    this.pollCloseTime = data.time;
  }
}
