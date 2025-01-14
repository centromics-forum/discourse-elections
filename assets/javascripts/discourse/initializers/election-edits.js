// discourse/plugins/discourse-elections/discourse/initializers/election-edit.js

import { tracked } from "@glimmer/tracking";
import { renderComponent } from "@ember/component";
import { action } from "@ember/object";
import { computed } from "@ember/object";
import { scheduleOnce } from "@ember/runloop";
import { h } from "virtual-dom";
import { withPluginApi } from "discourse/lib/plugin-api";
import { escapeExpression } from "discourse/lib/utilities";
import Composer from "discourse/models/composer";
import RawHtml from "discourse/widgets/raw-html";
import Widget from "discourse/widgets/widget";
import I18n from "discourse-i18n";
import ElectionListControlsComponent from "../components/election-list-controls";
import { ElectionStatuses } from "../lib/election";

export default {
  name: "election-edits",
  initialize(container) {
    const siteSettings = container.lookup("site-settings:main");

    if (siteSettings.elections_enabled) {
      withPluginApi("0.8.7", (api) => {
        // ok
        // 모델 수정: topic
        // api.modifyClass('model:topic', {
        //   pluginId: "discourse-election",
        //   electionStatusName: computed('election_status', function() {
        //     console.log("election_status", this.election_status);
        //     return Object.keys(ElectionStatuses).find((k) => {
        //       return ElectionStatuses[k] === this.election_status;
        //     });
        //   })
        // });

        // NOTE: Octane style class로 수정
        api.modifyClass(
          "model:topic",
          (Superclass) =>
            class extends Superclass {
              // Tracked property
              @tracked election_status;

              get electionStatusName() {
                //console.log("model:topic election_status", this.election_status);
                return Object.keys(ElectionStatuses).find((k) => {
                  return ElectionStatuses[k] === this.election_status;
                });
              }

              // Optionally add any actions or additional methods as needed
              // @action
              // someAction() {
              //   console.log("Some action was triggered");
              // }
            }
        );

        // ok
        // 모델 수정: composer
        // api.modifyClass('model:composer', {
        //   pluginId: "discourse-election",
        //   isNominationStatement: computed(
        //     'electionNominationStatement',
        //     'post.election_nomination_statement',
        //     'topic.election_is_nominee',
        //     'topic.election_made_statement',
        //     function() {
        //       const editingPost = this.editingPost;
        //       const { electionNominationStatement, post } = this;
        //       const madeStatement = post.election_made_statement;

        //       if (madeStatement && (!editingPost || !post.election_nomination_statement)) return false;
        //       return (electionNominationStatement || post.election_nomination_statement) && post.election_is_nominee;
        //     }
        //   )
        // });

        // NOTE: disabled by etna (2024.10.22)
        // Modify the original class with the new definition
        // api.modifyClass('model:composer', (Superclass) => class extends Superclass {
        //   // Add properties and computed properties here
        //   @tracked electionNominationStatement; // Define tracked property if necessary

        //   @computed(
        //     'electionNominationStatement',
        //     'post.election_nomination_statement',
        //     'topic.election_is_nominee',
        //     'topic.election_made_statement'
        //   )
        //   get isNominationStatement() {
        //     const editingPost = this.editingPost;
        //     const { electionNominationStatement, post } = this;
        //     const madeStatement = post.election_made_statement;

        //     if (madeStatement && (!editingPost || !post.election_nomination_statement)) {
        //       return false;
        //     }
        //     return (electionNominationStatement || post.election_nomination_statement) && post.election_is_nominee;
        //   }
        // });

        // ok
        // 컴포넌트 수정: composer-body
        // api.modifyClass('component:composer-body', {
        //   pluginId: "discourse-election",
        //   // 액션을 정의하여 상태 변화를 처리
        //   addNominationStatementClass: action(function() {
        //     const isNominationStatement = this.args.composer.isNominationStatement;

        //     scheduleOnce('afterRender', this, () => {
        //       const labelElement = this.element.querySelector('.statement-composer-label');
        //       const replyDetails = document.querySelector('.reply-details');

        //       if (isNominationStatement && labelElement && replyDetails) {
        //         labelElement.remove();
        //         replyDetails.appendChild(labelElement);
        //       }

        //       this.element.classList.toggle('nomination-statement', Boolean(isNominationStatement));
        //     });
        //   }),

        //   // 라이프사이클 훅을 사용하여 상태 변화를 감지
        //   didReceiveAttrs() {
        //     this._super(...arguments);
        //     this.addNominationStatementClass();
        //   }
        // });

        // Modify the original class with the new definition
        // api.modifyClass('component:composer-body', (Superclass) => class extends Superclass {
        //   @action
        //   addNominationStatementClass() {
        //     const isNominationStatement = this.args.composer.isNominationStatement;

        //     scheduleOnce('afterRender', this, () => {
        //       const labelElement = this.element.querySelector('.statement-composer-label');
        //       const replyDetails = document.querySelector('.reply-details');

        //       if (isNominationStatement && labelElement && replyDetails) {
        //         labelElement.remove();
        //         replyDetails.appendChild(labelElement);
        //       }

        //       this.element.classList.toggle('nomination-statement', Boolean(isNominationStatement));
        //     });
        //   }

        //   // Lifecycle hook to detect state changes
        //   didReceiveAttrs() {
        //     super.didReceiveAttrs(...arguments); // Call the superclass method
        //     this.addNominationStatementClass(); // Call the action to update classes
        //   }
        // });

        // ok
        // 위젯 수정: discourse-poll-container
        // api.reopenWidget('discourse-poll-container', {
        //   html(attrs) {
        //     const { poll } = attrs;
        //     const options = poll.get('options');

        //     if (attrs.post.election_post) {
        //       options.forEach((o) => {
        //         if (!o.originalHtml) {
        //           o.originalHtml = o.html;
        //         }
        //         o.html = o.originalHtml;
        //         let usernameOnly = o.html.substring(0, o.html.indexOf('<'));
        //         let fullDetails = o.html.replace(usernameOnly, '');
        //         o.html = attrs.showResults ? usernameOnly : fullDetails;
        //       });
        //     }

        //     if (attrs.showResults) {
        //       const type = poll.get('type') === 'number' ? 'number' : 'standard';
        //       return this.attach(`discourse-poll-${type}-results`, attrs);
        //     }

        //     if (options) {
        //       return h('ul', options.map(option => {
        //         return this.attach('discourse-poll-option', {
        //           option,
        //           isMultiple: attrs.isMultiple,
        //           vote: attrs.vote
        //         });
        //       }));
        //     }
        //   }
        // });

        // 포스트 속성 포함
        api.includePostAttributes(
          "topic",
          "election_post",
          "election_nomination_statement",
          "election_nominee_title",
          "election_by_nominee"
        );

        // 포스트 클래스 콜백 추가
        api.addPostClassesCallback((attrs) => {
          if (attrs.election_post) {
            return ["election-post"];
          } else {
            return [];
          }
        });

        // ok
        // 위젯 꾸미기: poster-name:after
        api.decorateWidget("poster-name:after", (helper) => {
          const post = helper.attrs;
          let contents = [];

          if (post.election_by_nominee && post.election_nomination_statement) {
            contents.push(
              helper.h(
                "span.statement-post-label",
                I18n.t("election.post.nomination_statement")
              )
            );
          }

          if (
            !post.election_by_nominee &&
            post.election_nominee_title &&
            siteSettings.elections_nominee_titles
          ) {
            contents.push(
              helper.h(
                "span.nominee-title",
                new RawHtml({ html: post.election_nominee_title })
              )
            );
          }

          return contents;
        });

        // ok
        // 위젯 꾸미기: post-avatar:after
        api.decorateWidget("post-avatar:after", (helper) => {
          const post = helper.attrs;
          const flair = siteSettings.elections_nominee_avatar_flair;
          let contents = [];

          if (post.election_by_nominee && flair.length > 0) {
            contents.push(
              helper.h(
                "div.avatar-flair.nominee",
                helper.h("i", {
                  className: "fa " + flair,
                  title: I18n.t("election.post.nominee"),
                })
              )
            );
          }

          return contents;
        });

        // NOTE: election-controls has changed to Octane based widget, and does not consist with decorateWidget ...

        // 위젯 꾸미기: post-contents:after-cooked
        // ------------------------
        api.decorateWidget("post-contents:after-cooked", (helper) => {
          const post = helper.attrs;
          const topic = post.topic;
          console.log('decorateWidget post-contents:after-cooked', post, topic);
          if (topic.subtype === "election" && post.firstPost) {
            //NOTE: call widgets/election-controls.js
            return helper.attach("election-controls", { topic });
          }
        });

        // api.decorateWidget("post-contents:after-cooked", (helper) => {
        //   const post = helper.attrs;
        //   const topic = post.topic;

        //   console.log("helper", helper);
        //   if (topic.subtype === "election" && post.firstPost) {
        //     // 새로운 요소를 생성하고 컴포넌트를 렌더링
        //     const container1 = document.createElement("div");
        //     renderComponent("election-controls", container1, { topic });
        //     helper.container.appendChild(container1);
        //   }
        // });

        // ------------------------

        // 위젯 수정: notification-item
        // --> notification-item not found
        // api.reopenWidget('notification-item', {
        //   description() {
        //     const data = this.attrs.data;
        //     const badgeName = data.badge_name;
        //     if (badgeName) return escapeExpression(badgeName);

        //     const description = data.description;
        //     if (description) return escapeExpression(description);

        //     const title = data.topic_title;
        //     return Ember.isEmpty(title) ? "" : escapeExpression(title);
        //   }
        // });

        // api.modifyWidget("notification-item:description", (description, { attrs }) => {
        //   const { data } = attrs;
        //   const badgeName = data.badge_name;
        //   if (badgeName) return escapeExpression(badgeName);

        //   const descriptionText = data.description;
        //   if (descriptionText) return escapeExpression(descriptionText);

        //   const title = data.topic_title;
        //   return Ember.isEmpty(title) ? "" : escapeExpression(title);
        // });
      });

      Composer.serializeOnCreate(
        "election_nomination_statement",
        "electionNominationStatement"
      );
    }
  },
};
