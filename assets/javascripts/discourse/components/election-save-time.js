import Component from "@glimmer/component";
import { tracked } from "@glimmer/tracking";
import { action, computed } from "@ember/object";
import $ from "jquery";
import ElectionSave from "./election-save";

export default class ElectionSaveTimeComponent extends ElectionSave {
  @tracked type;
  @tracked enabled;
  @tracked after;
  @tracked hours;
  @tracked nominations;
  @tracked voters;
  @tracked time;
  @tracked icon = null;
  @tracked saving = false;
  name = "poll_time";
  layoutName = "components/election-save";

  @computed(
    "type",
    "enabled",
    "after",
    "hours",
    "nominations",
    "voters",
    "time",
    "topicUpdated"
  )
  get unchanged() {
    // always enable save button
    return false;

    // const originalEnabled = this.topic[`election_poll_${this.type}`];
    // const originalAfter = this.topic[`election_poll_${this.type}_after`];
    // const originalHours = this.topic[`election_poll_${this.type}_after_hours`];
    // const originalNominations = this.topic.election_poll_open_after_nominations;
    // const originalVoters = this.topic.election_poll_close_after_voters;
    // const originalTime = this.topic[`election_poll_${this.type}_time`];

    // return (
    //   this.enabled === originalEnabled &&
    //   this.after === originalAfter &&
    //   this.hours === originalHours &&
    //   (this.type === "open"
    //     ? this.nominations === originalNominations
    //     : true) &&
    //   (this.type === "close" ? this.voters === originalVoters : true) &&
    //   this.time === originalTime
    // );
  }

  prepareData() {
    if (this.disabled) {
      return false;
    }

    this.icon = null;
    this.saving = true;

    $("#modal-alert").hide();

    const after = this.after;
    const type = this.type;

    let data = {
      topic_id: this.topic.id,
      type,
      enabled: this.enabled,
      after,
    };

    if (after) {
      data.hours = this.hours;
      if (type === "open") {
        data.nominations = this.nominations;
      }
      if (type === "close") {
        data.voters = this.voters;
      }
    } else {
      data.time = this.time;
    }

    return data;
  }

  @action
  resolve(result) {
    const type = this.type;

    if (result.success) {
      this.icon = "check";
      this.topic[`election_poll_${type}`] = this.enabled;
      this.topic[`election_poll_${type}_after`] = this.after;
      this.topic[`election_poll_${type}_after_hours`] = this.hours;
      this.topic[`election_poll_${type}_time`] = this.time;
      if (type === "open") {
        this.topic.election_poll_open_after_nominations = this.nominations;
      }
      if (type === "close") {
        this.topic.election_poll_close_after_voters = this.voters;
      }
      this.toggleProperty("topicUpdated");

    } else if (result.failed) {
      this.icon = "times";
      this.enabled = this.topic[`election_poll_${type}`];
      this.after = this.topic[`election_poll_${type}_after`];
      this.hours = this.topic[`election_poll_${type}_after_hours`];
      this.time = this.topic[`election_poll_${type}_time`];

      if (type === "open") {
        this.nominations = this.topic.election_poll_open_after_nominations;
      }

      if (type === "close") {
        this.voters = this.topic.election_poll_close_after_voters;
      }

      this.error = result.message;
    }

    this.saving = false;
  }
}
