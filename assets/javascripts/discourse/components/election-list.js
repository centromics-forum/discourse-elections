// app/components/election-list.js
import Component from "@glimmer/component";
import { tracked } from "@glimmer/tracking";
import { action } from "@ember/object";
import { later } from "@ember/runloop";
import { inject as service } from "@ember/service";
import { ajax } from "discourse/lib/ajax";
import I18n from "discourse-i18n";

export default class ElectionListComponent extends Component {
  @tracked elections = [];
  @tracked loading = true;

  constructor() {
    super(...arguments);
    this.loadElections();
  }

  async loadElections() {
    const category = this.args.category;

    if (!category) {
      this.loading = false;
      return;
    }

    try {
      const response = await ajax(`/election/category-list`, {
        method: "GET",
        data: { category_id: category.id },
      });
      this.elections = response;
    } catch (error) {
      console.error("Failed to load elections:", error);
    } finally {
      this.loading = false;
    }
  }

  get electionListContent() {
    if (this.loading) {
      return `${I18n.t("election.list.loading")}`;
    }

    if (this.elections.length > 0) {
      return this.elections.map((e, i) => ({
        text: e.position,
        url: e.relative_url,
        separator: i > 0 ? ", " : "",
      }));
    }

    return `${I18n.t("election.list.no_elections")}`;
  }
}

// import { tracked } from "@glimmer/tracking";
// import { action } from "@ember/object";
// import MountWidget from "discourse/components/mount-widget";

// export default class ElectionList extends MountWidget {
//   // category를 추적할 수 있도록 설정
//   @tracked category;
//   // 클래스 이름을 직접 정의
//   classNames = ["election-list-container"];

//   buildArgs() {
//     return {
//       category: this.category,
//     };
//   }
// }
