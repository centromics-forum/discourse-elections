import Component from "@glimmer/component";

export default class ElectionStatusComponent extends Component {
  get showStatus() {
    console.log("ElectionStatusComponent: stages", this.model);
    console.log("ElectionStatusComponent: currentStage_FindingAnswer", this.currentStage_FindingAnswer);
    return this.model.subtype === "election";
    // && this.model.election_poll_current_stage == 'finding_winner';
  }

  get currentStage() {
    return this.model.election_poll_current_stage;
  }

  get currentStage_FindingAnswer() {
    return this.model.election_poll_current_stage === "finding_answer";
  }

  get currentStage_FindingWinner() {
    return this.model.election_poll_current_stage === "finding_winner";
  }

  get model() {
    return this.args.outletArgs.model; // Access model from the args
  }
}
