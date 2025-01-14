import Component from "@glimmer/component";
import { action, computed } from "@ember/object";
import { service } from "@ember/service";
import { dasherize } from "@ember/string";
import { ElectionStatuses } from "../lib/election";

// const electionStatus = {
//   1: "nomination",
//   2: "poll",
//   3: "closed_poll",
// };
// -> key value 바꿔서 생성
const electionStatus = Object.fromEntries(
  Object.entries(ElectionStatuses).map(([key, value]) => [value, key])
);

export default class ElectionBannerComponent extends Component {
  @service discourseURL; // DiscourseURL 서비스 주입

  // 클래스 네임 바인딩
  get classNameBindings() {
    return `election-banner ${this.statusClass}`;
  }

  // computed 속성: status
  @computed("election.status")
  get status() {
    return electionStatus[this.election.status];
  }

  // computed 속성: statusClass
  @computed("status")
  get statusClass() {
    return `election-${dasherize(this.status)}`;
  }

  // computed 속성: key
  @computed("status")
  get key() {
    return `election.status_banner.${this.status}`;
  }

  // computed 속성: timeKey
  @computed("status")
  get timeKey() {
    return `election.status_banner.${this.status}_time`;
  }

  // computed 속성: showTime
  @computed("status", "election.time")
  get showTime() {
    return (
      (this.status === "nomination" || this.status === "poll") &&
      this.election.time
    );
  }

  // 클릭 이벤트 핸들러
  @action
  handleClick() {
    const topicUrl = this.election.topic_url;
    this.discourseURL.routeTo(topicUrl);
  }
}
