# name: discourse-elections
# about: Run elections in Discourse
# version: 0.2.1
# authors: angusmcleod
# url: https://github.com/angusmcleod/discourse-elections

register_asset 'stylesheets/common/elections.scss'
register_asset 'stylesheets/desktop/elections.scss', :desktop
register_asset 'stylesheets/mobile/elections.scss', :mobile
register_asset 'lib/jquery.min.js'
register_asset 'lib/jquery.timepicker.min.js'
register_asset 'lib/jquery.timepicker.scss'
register_asset 'lib/bootbox.min.js'
register_asset 'lib/bootbox.locales.min.js'
#register_asset 'lib/moment.min.js'
#register_asset 'javascripts/discourse/init.js'

enabled_site_setting :elections_enabled

after_initialize do
  Topic.register_custom_field_type('election_self_nomination_allowed', :boolean)
  Topic.register_custom_field_type('election_poll_enabled_stages', :string) # finding_answer, finding_winner
  Topic.register_custom_field_type('election_poll_current_stage', :string) # finding_answer
  Topic.register_custom_field_type('election_nominations', :integer)
  Topic.register_custom_field_type('election_nominations_usernames', :json)
  Topic.register_custom_field_type('election_status', :integer) # 1: nomination(-> gathering options), 2: polling, 3: closed
  Topic.register_custom_field_type('election_status_banner', :boolean)
  Topic.register_custom_field_type('election_status_banner_result_hours', :integer)
  Topic.register_custom_field_type('election_poll_open', :boolean)
  Topic.register_custom_field_type('election_poll_open_after', :boolean)
  Topic.register_custom_field_type('election_poll_open_after_hours', :integer)
  Topic.register_custom_field_type('election_poll_open_after_nominations', :integer)
  Topic.register_custom_field_type('election_poll_open_scheduled', :boolean)
  Topic.register_custom_field_type('election_poll_close', :boolean)
  Topic.register_custom_field_type('election_poll_close_after', :boolean)
  Topic.register_custom_field_type('election_poll_close_after_hours', :integer)
  Topic.register_custom_field_type('election_poll_close_after_voters', :integer)
  Topic.register_custom_field_type('election_poll_close_scheduled', :boolean)
  Category.register_custom_field_type('for_elections', :boolean)
  Post.register_custom_field_type('election_nomination_statement', :boolean)

  require_relative "controllers/base"
  require_relative "controllers/election"
  require_relative "controllers/list"
  require_relative "controllers/nomination"
  require_relative "serializers/election"
  require_relative "jobs/election_notify_moderators"
  require_relative "jobs/election_notify_moderators"
  require_relative "jobs/election_notify_nominees"
  require_relative "jobs/election_remove_from_category_list"
  require_relative "jobs/election_open_poll"
  require_relative "jobs/election_close_poll"
  require_relative "lib/election"
  require_relative "lib/election_post"
  require_relative "lib/election_time"
  require_relative "lib/election_topic"
  require_relative "lib/election_user"
  require_relative "lib/election_category"
  require_relative "lib/nomination_statement"
  require_relative "lib/nomination"
  require_relative "lib/poll_edits"

  validate(:post, :validate_election_polls) do |_force = nil|
    return unless raw_changed?
    return if is_first_post?
    return unless self.topic.subtype === 'election'
    return unless SiteSetting.elections_enabled

    extracted_polls = DiscoursePoll::Poll.extract(raw, topic_id, user_id)

    unless extracted_polls.empty?
      errors.add(:base, I18n.t('election.errors.seperate_poll'))
    end
  end

  add_to_serializer(:topic_view, :subtype) { object.topic.subtype }

  add_to_serializer(:topic_view, :election_poll_enabled_stages,
    include_condition: -> { object.topic&.election }) { object.topic&.election_poll_enabled_stages }

  add_to_serializer(:topic_view, :election_poll_current_stage,
    include_condition: -> { object.topic&.election }) { object.topic&.election_poll_current_stage }

  add_to_serializer(:topic_view, :election_status,
  include_condition: -> { object.topic&.election }) { object.topic&.election_status }

  add_to_serializer(:topic_view, :election_status,
    include_condition: -> { object.topic&.election }) { object.topic&.election_status }

  add_to_serializer(:topic_view, :election_position,
    include_condition: -> { object.topic&.election }) { object.topic&.election_position }

  add_to_serializer(:topic_view, :election_nominations,
    include_condition: -> { object.topic&.election }) { object.topic&.election_nominations }

  add_to_serializer(:topic_view, :election_nominations_usernames,
    include_condition: -> { object.topic&.election }) { object.topic&.election_nominations_usernames }

  # add_to_serializer(:topic_view, :election_poll_options,
  #   include_condition: -> { object.topic&.election }) { object.topic&.election_poll_options }

  # add_to_serializer(:topic_view, :election_poll_answer,
  #   include_condition: -> { object.topic&.election }) { object.topic&.election_poll_answer }

  add_to_serializer(:topic_view, :election_self_nomination_allowed,
    include_condition: -> { object.topic&.election }) { object.topic&.election_self_nomination_allowed }

  add_to_serializer(:topic_view, :election_can_self_nominate, include_condition: -> { object.topic&.election }) do
    scope.user && !scope.user.anonymous? &&
    (scope.is_admin? || scope.user.trust_level >= SiteSetting.elections_min_trust_to_self_nominate.to_i)
  end

  add_to_serializer(:topic_view, :election_is_nominee, include_condition: -> { object.topic&.election }) do
    scope.user && object.topic&.election_nominations&.include?(scope.user.id)
  end

  add_to_serializer(:topic_view, :election_nomination_statements,
    include_condition: -> { object.topic&.election }) { object.topic&.election_nomination_statements }

  add_to_serializer(:topic_view, :election_made_statement, include_condition: -> { object.topic&.election }) do
    if scope.user
      object.topic&.election_nomination_statements&.any? { |n| n['user_id'] == scope.user.id }
    end
  end

  add_to_serializer(:topic_view, :election_nomination_message,
    include_condition: -> { object.topic&.election }) { object.topic.custom_fields['election_nomination_message'] }

  add_to_serializer(:topic_view, :election_poll_message,
    include_condition: -> { object.topic&.election }) { object.topic.custom_fields['election_poll_message'] }

  add_to_serializer(:topic_view, :election_closed_poll_message,
    include_condition: -> { object.topic&.election }) { object.topic.custom_fields['election_closed_poll_message'] }

  add_to_serializer(:topic_view, :election_same_message,
    include_condition: -> { object.topic&.election }) { object.topic.custom_fields['election_poll_message'] }

  add_to_serializer(:topic_view, :election_status_banner,
    include_condition: -> { object.topic&.election }) { object.topic.custom_fields['election_status_banner'] }

  add_to_serializer(:topic_view, :election_status_banner_result_hours,
    include_condition: -> { object.topic&.election }) { object.topic.custom_fields['election_status_banner_result_hours'] }

  add_to_serializer(:topic_view, :election_poll_open,
    include_condition: -> { object.topic&.election }) { object.topic&.election_poll_open }

  add_to_serializer(:topic_view, :election_poll_open_after,
    include_condition: -> { object.topic&.election }) { object.topic&.election_poll_open_after }

  add_to_serializer(:topic_view, :election_poll_open_after_hours,
    include_condition: -> { object.topic&.election }) { object.topic&.election_poll_open_after_hours }

  add_to_serializer(:topic_view, :election_poll_open_after_nominations,
    include_condition: -> { object.topic&.election }) { object.topic&.election_poll_open_after_nominations }

  add_to_serializer(:topic_view, :election_poll_open_time,
    include_condition: -> { object.topic&.election }) { object.topic&.election_poll_open_time }

  add_to_serializer(:topic_view, :election_poll_open_scheduled,
    include_condition: -> { object.topic&.election }) { object.topic&.election_poll_open_scheduled }

  add_to_serializer(:topic_view, :election_poll_close,
    include_condition: -> { object.topic&.election }) { object.topic&.election_poll_close }

  add_to_serializer(:topic_view, :election_poll_close_after,
    include_condition: -> { object.topic&.election }) { object.topic&.election_poll_close_after }

  add_to_serializer(:topic_view, :election_poll_close_after_hours,
    include_condition: -> { object.topic&.election }) { object.topic&.election_poll_close_after_hours }

  add_to_serializer(:topic_view, :election_poll_close_after_voters,
    include_condition: -> { object.topic&.election }) { object.topic&.election_poll_close_after_voters }

  add_to_serializer(:topic_view, :election_poll_close_time,
    include_condition: -> { object.topic&.election }) { object.topic&.election_poll_close_time }

  add_to_serializer(:topic_view, :election_poll_close_scheduled,
    include_condition: -> { object.topic&.election }) { object.topic&.election_poll_close_scheduled }

  add_to_serializer(:topic_view, :election_winner,
    include_condition: -> { object.topic&.election }) { object.topic&.election_winner }

  add_to_serializer(:basic_category, :for_elections) { object.custom_fields['for_elections'] }

  add_to_serializer(:basic_category, :election_list,
    include_condition: -> { object.topic&.election }) { object.election_list }

  [
    "for_elections",
    "election_list",
  ].each do |key|
    Site.preloaded_category_custom_fields << key if Site.respond_to? :preloaded_category_custom_fields

    Category.preloaded_category_custom_fields << key if Category.respond_to? :preloaded_category_custom_fields
  end

  add_to_serializer(:post, :election_post,
    include_condition: -> { object.topic&.election }) { object.is_first_post? }

  add_to_serializer(:post, :election_nomination_statement,
    include_condition: -> { object.topic&.election }) { object.election_nomination_statement }

  add_to_serializer(:post, :election_nominee_title,
    include_condition: -> { object.topic&.election }) { object.user.election_nominee_title }

  add_to_serializer(:post, :election_by_nominee, include_condition: -> { object.topic&.election }) do
    object.user && object.topic&.election_nominations&.include?(object.user.id)
  end

  add_to_serializer(:current_user, :is_elections_admin) { object.is_elections_admin? }

  DiscourseEvent.trigger(:elections_ready)
end
