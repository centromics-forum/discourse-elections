import { tracked } from "@glimmer/tracking";
import Component from "@ember/component";
import { action, computed, get, set } from "@ember/object";
import { next } from "@ember/runloop";
import { dasherize } from "@ember/string";
import DButton from "discourse/components/d-button";
import { ajax } from "discourse/lib/ajax";
import ElectionSave from "./election-save";

/*
  <ElectionSaveCurrentStage
    @property={{this.pollCurrentStage}}
    @name="poll_current_stage"
    @topic={{this.topic}} @error="error" @saved="saved" />
*/

export default class ElectionSaveCurrentStageComponent extends ElectionSave {
  layoutName = "components/election-save";

  @action
  save() {
    let original = undefined;
    if (this.topic) {
      original = this.topic[`election_${this.name}`];
      if (this.property === 'finding_answer' && original === 'finding_winner') {
        if (!confirm('finding_winner에서 finding_answer로 모드를 바꾸면 ' +
          '본문에서 election poll 이 삭제되면서, 기존에 생성된 election_poll의 투표결과(votes)가 초기화됩니다. ' +
          '계속하겠습니까?')) {
          return;
        }
      } else if (this.property === 'finding_winner' && original === 'finding_answer') {
        // 참고: poll-plugin: polls_updater.rb#update()
        if (!confirm("poll의 votes > 0 일 경우, 본래 '처음 5분 후에는 폴링을 변경할 수 없습니다.' " +
          "메시지와 함께 poll options 수정이 안되며, 그로 인하여 election stage 변경에도 오류가 생지기만 무시하도록 하였습니다. " +
          "되도록 poll options을 수정하지 않아야 합니다. 계속하겠습니까?")) {
          return;
        }
      }

      super.save();
    }
  }
}