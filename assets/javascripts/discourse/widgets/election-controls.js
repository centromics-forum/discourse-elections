import { h } from "virtual-dom";
import { ajax } from "discourse/lib/ajax";
import Topic from "discourse/models/topic";
import { createWidget } from "discourse/widgets/widget";
import { getOwner } from "discourse-common/lib/get-owner";
import PollUiBuilderModal from "discourse/plugins/poll/discourse/components/modal/poll-ui-builder";
import ConfirmNominationModal from "../components/modal/confirm-normination";
//import $ from "jquery";
//console.log($);
import ManageElectionModal from "../components/modal/manage-election";
//import showModal from 'discourse/lib/show-modal';
import { ElectionStatuses } from "../lib/election";

export default createWidget("election-controls", {
  tagName: "div.election-controls",
  buildKey: () => `election-controls`,
  modal: getOwner(this).lookup("service:modal"),

  defaultState() {
    return {
      startingPoll: false,
    };
  },

  toggleNomination() {
    this._showModal(ConfirmNominationModal, {
      model: {
        topic: this.attrs.topic,
        rerender: () => //this.router.refresh(),
          this.scheduleRerender(),
      },
    });
  },

  async fetchFirstPosts(topicId) {
    const topic = await Topic.find(topicId, {});
    console.log('topic', topic);
    let allPosts = topic.post_stream.posts;
    let post = null;
    if (allPosts.length > 0) { post = allPosts[0]; }
    else { post = null; }
    return post;
  },

  async openPollUiBuilder() {
    console.log('this.attrs', this.attrs);
    const topicId = this.attrs.topic.id;
    const categoryId = this.attrs.topic.category_id;
    const position = this.attrs.topic.election_position;
    console.log('this.attrs.topic', this.attrs.topic);

    // alert('투표 상태를 먼저 열기 상태로 전환해주세요. 닫기 상태에서는 저장되지 않습니다. ' +
    //   'Please change the poll state to OPEN state. In closed mode poll will not be saved.');

    const post = await this.fetchFirstPosts(topicId);
    console.log('post', post);

    const poll = post.polls?.length > 0 ? post.polls[0] : null;
    let polldata = {};
    if (poll != null) {
      polldata = {
        id: poll.id,
        name: poll.name,
        pollType: poll.type,
        pollTitle: poll.title,
        pollOptions: poll.options,
        pollOptionsText: '',
        pollDataLinks: poll.poll_data_links,
        pollMin: undefined,
        pollMax: undefined,
        pollStep: undefined,
        pollGroups: undefined,
        pollAutoClose: undefined,
        pollResult: poll.result,
        score: poll.score,
        defaultScore: undefined,
        chartType: poll.chart_type,
        status: poll.status,
      };
    }

    this._showModal(PollUiBuilderModal, {
      model: {
        mode: 'election-manage',
        // topic: this.attrs.topic,
        // rerender: () => this.scheduleRerender(),
        toolbarEvent: null,
        onInsertPoll: this.onInsertPoll,          // onInsertPoll(outputAsJson) (for standalone mode; used by external plugin)
        topicId,
        categoryId,
        position,
        _this: this,
        polldata,
      },
    });
  },

  async onInsertPoll(_this, topicId, categoryId, position, outputAsJson) {
    //const topicId = this.attrs.topic.id;
    return await _this.updateTopic(topicId, categoryId, position, outputAsJson);
  },

  makeStatement() {
    const controller = getOwner(this).lookup("controller:composer");
    const topic = this.attrs.topic;

    controller.open({
      action: "reply",
      draftKey: "reply",
      draftSequence: 0,
      topic,
    });

    //controller.set("model.electionNominationStatement", true);
  },

  manage() {
    console.log('startPoll manage this.attrs', this.attrs);

    //this._showModal('manage-election', {
    this._showModal(ManageElectionModal, {
      model: {
        topic: this.attrs.topic,
        rerender: () => this.scheduleRerender(),
      },
    });
  },

  startPoll() {
    console.log('startPoll this.attrs', this.attrs);
    const topicId = this.attrs.topic.id;

    ajax("/election/start-poll", { type: "PUT", data: { topic_id: topicId } })
      .then((result) => {
        if (result.failed) {
          //bootbox.alert(result.message);
          alert(result.message);
        } else {
          this.attrs.topic.set("election_status", ElectionStatuses["poll"]);
        }

        if (this.state) {
          this.state.startingPoll = false;
        }

        this.scheduleRerender();
      })
      .catch((e) => {
        if (e.jqXHR && e.jqXHR.responseText) {
          const responseText = e.jqXHR.responseText;
          //const message = responseText.substring(responseText.indexOf('>') + 1, responseText.indexOf('plugins'));
          // const message = responseText.substring(
          //   0,
          //   responseText.indexOf("):") + 2
          // );
          //bootbox?.alert(message) ||
          //console.log(responseText)
          alert(responseText);
        }
      })
      .finally(() => {
        if (this.state) {
          this.state.startingPoll = false;
        }
        this.scheduleRerender();
      });

    if (this.state) {
      this.state.startingPoll = true;
    }

    this.scheduleRerender();
  },

  // pollType,
  // pollResult,
  // publicPoll,
  // pollTitle,
  // pollOptions,
  // pollDataLinks,
  // pollMin,
  // pollMax,
  // pollStep,
  // pollGroups,
  // pollAutoClose,
  // score,
  // chartType

  async updateTopic(topicId, categoryId, position, outputAsJson) {
    console.log('topicId ouputAsJson1', topicId, categoryId, position, outputAsJson);

    // let polldata = {
    //   // :poll_mode,
    //   poll_mode: outputAsJson.pollMode,
    //   // :nomination_message, # 본래의미에서 변경 --> gathering poll options message

    //   poll_message: outputAsJson.pollMessage,
    //   // :closed_poll_message,
    //   // #:self_nomination_allowed,
    //   // :status_banner,
    //   // :status_banner_result_hours,
    //   // :poll_open,
    //   // :poll_open_after,
    //   // :poll_open_after_hours,
    //   // :poll_open_after_nominations,
    //   // :poll_open_time,
    //   // :poll_close,
    //   // :poll_close_after,
    //   // :poll_close_after_hours,
    //   // :poll_close_after_voters,
    //   // :poll_close_time,
    // };

    //setTimeout(function () {

    console.log('JSON.stringify(outputAsJson)', JSON.stringify(outputAsJson));

    let result1 = null;

    await ajax("/election/update", {
      type: "PUT",
      data: {
        topic_id: topicId,
        category_id: categoryId,
        position,
        //category_id:
        content: JSON.stringify(outputAsJson)
      }

    }).then((result) => {
      //console.log('updateTopic result', result);
      result1 = result;
    }).catch((error) => {
      console.error('Failed to updateTopic:', error);
      result1 = error;
      const resp = error.jqXHR;
      alert(resp.responseText);
    });
    //});

    return result1;
  },

  html(attrs, state) {
    const topic = attrs.topic;
    const user = this.currentUser;
    let contents = [];

    console.log('render election controls', topic);
    console.log('this.currentUser.id', this.currentUser.id);

    // Manage
    if (user && user.is_elections_admin) {
      contents.push(
        this.attach("button", {
          action: "manage",
          label: "election.manage.label",
          className: "btn-primary manage-election",
        })
      );
    }

    // toggle-nomination-button
    if (
      topic.election_status === ElectionStatuses["nomination"] &&
      topic.election_self_nomination_allowed &&
      topic.election_can_self_nominate
    ) {

      contents.push(
        this.attach("button", {
          action: `toggleNomination`,
          label: `election.nomination.${topic.election_is_nominee ? "remove.label" : "add.label"}`,
          className: "btn-primary toggle-nomination",
        })
      );
    }

    // makeStatement button (후보자 댓글 달기)
    if (topic.election_is_nominee && !topic.election_made_statement) {
      contents.push(this.attach('button', {
        action: 'makeStatement',
        label: `election.nomination.statement.add`,
        className: 'btn-primary add-statement'
      }));
    }

    // startPoll
    if (
      user &&
      user.is_elections_admin &&
      topic.election_poll_current_stage === 'finding_winner' && // poll stage == 'finding_winner'
      topic.election_status === ElectionStatuses["nomination"] // topic status == 'nomination'
    ) {
      contents.push(
        this.attach("button", {
          action: "startPoll",
          label: "election.start",
          className: "btn-primary start-poll",
        })
      );

      if (state && state.startingPoll) {
        contents.push(h("div.spinner-container", h("div.spinner.small")));
      }
    }

    return contents;
  },

  _showModal(name, model) {
    const owner = getOwner(this); // Access the owner of this widget
    const modalService = owner.lookup("service:modal"); // Get the modal service

    modalService.show(name, { model }); // Open the modal with the provided model
  },
});
