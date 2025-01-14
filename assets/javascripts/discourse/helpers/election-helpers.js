import { helper } from "@ember/component/helper";
import Handlebars from "handlebars";
import { formatTime } from "../lib/election";

export default helper(function electionTime([time]) {
  return new Handlebars.SafeString(formatTime(time));
});
