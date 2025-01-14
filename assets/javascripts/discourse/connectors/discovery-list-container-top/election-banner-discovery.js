import Component from "@glimmer/component";
//import { tracked } from "@glimmer/tracking";
//import SiteSettings from 'discourse/lib/site-settings';
import { service } from "@ember/service";

export default class ElectionBannerDiscoveryComponent extends Component {
  @service siteSettings;

  get electionListEnabled() {
    return this.siteSettings.elections_status_banner_discovery;
  }

  get category() {
    return this.args.outletArgs.category;
  }

  get tag() {
    return this.args.outletArgs.tag;
  }
}
