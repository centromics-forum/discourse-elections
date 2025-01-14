// // app/components/election-controls.js
// import Component from "@glimmer/component";
// import { tracked } from "@glimmer/tracking";
// import { action } from "@ember/object";
// import { inject as service } from "@ember/service";
// import { ajax } from "discourse/lib/ajax";
// import ManageElectionModal from "../components/modal/manage-election";
// import { ElectionStatuses } from "../lib/election";

// export default class ElectionControlsComponent extends Component {
//   @service modal;
//   @service currentUser;
//   @service router;

//   @tracked startingPoll = false;

//   get isNominationAllowed() {
//     const { topic } = this.args;
//     return (
//       topic.election_status === ElectionStatuses.nomination &&
//       topic.election_self_nomination_allowed &&
//       topic.election_can_self_nominate
//     );
//   }

//   get isAdmin() {
//     return this.currentUser?.is_elections_admin;
//   }

//   @action
//   toggleNomination() {
//     this.modal.show("confirm-nomination", {
//       model: {
//         topic: this.args.topic,
//         rerender: () => this.router.refresh(),
//       },
//     });
//   }

//   @action
//   makeStatement() {
//     const controller = this.router.owner.lookup("controller:composer");
//     const topic = this.args.topic;

//     controller.open({
//       action: "reply",
//       draftKey: "reply",
//       draftSequence: 0,
//       topic,
//     });

//     controller.set("model.electionNominationStatement", true);
//   }

//   @action
//   manage() {
//     this.modal.show(ManageElectionModal, {
//       model: {
//         topic: this.args.topic,
//         rerender: () => this.router.refresh(),
//       },
//     });
//   }

//   @action
//   startPoll() {
//     const topicId = this.args.topic.id;
//     this.startingPoll = true;

//     ajax("/election/start-poll", { type: "PUT", data: { topic_id: topicId } })
//       .then((result) => {
//         if (result.failed) {
//           alert(result.message);
//         } else {
//           this.args.topic.set("election_status", ElectionStatuses.poll);
//         }
//       })
//       .catch((e) => {
//         const responseText = e.jqXHR?.responseText || "";
//         const message = responseText.substring(
//           0,
//           responseText.indexOf("):") + 2
//         );
//         alert(message);
//       })
//       .finally(() => {
//         this.startingPoll = false;
//       });
//   }
// }
